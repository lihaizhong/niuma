/**
 * OpenAI 提供商实现
 *
 * @description 基于 LangChain OpenAI 集成的 LLM 提供商实现。
 * 支持同步/流式聊天、工具调用、自定义端点等功能。
 */

// ==================== 第三方库 ====================
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import * as z from "zod";

// ==================== 本地模块 ====================
import { ProviderError } from "../types";

import type {
  ChatMessage,
  ChatOptions,
  LLMConfig,
  LLMResponse,
  LLMStreamChunk,
  ToolCall,
  ToolDefinition,
} from "../types";
import type { LLMProvider } from "./base";
import type { BaseMessage, MessageContent } from "@langchain/core/messages";

/**
 * OpenAI 提供商配置
 *
 * @description 扩展基础 LLM 配置，支持 OpenAI 特定选项
 */
export interface OpenAIConfig extends LLMConfig {
  /** OpenAI 组织 ID */
  organization?: string;
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 最大重试次数 */
  maxRetries?: number;
}

/**
 * OpenAI 提供商
 *
 * @description 实现 LLMProvider 接口，通过 LangChain 调用 OpenAI API。
 *
 * @example
 * ```typescript
 * const provider = new OpenAIProvider({
 *   model: 'gpt-4o',
 *   apiKey: process.env.OPENAI_API_KEY,
 * });
 *
 * const response = await provider.chat({
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * });
 * ```
 */
export class OpenAIProvider implements LLMProvider {
  /** @inheritdoc */
  readonly name: string = "openai";

  /** 提供商配置 */
  private config: OpenAIConfig;

  /** LangChain ChatOpenAI 实例 */
  private client: ChatOpenAI;

  /** 默认模型 */
  private static readonly DEFAULT_MODEL = "gpt-4o";

  /**
   * 创建 OpenAI 提供商实例
   *
   * @param config - LLM 配置
   * @throws {ProviderError} 当 API Key 未配置时抛出
   */
  constructor(config: OpenAIConfig) {
    this.config = config;
    this.client = this._createClient(config);
  }

  /**
   * 创建 LangChain ChatOpenAI 客户端
   *
   * @param config - 配置参数
   * @returns ChatOpenAI 实例
   */
  private _createClient(config: OpenAIConfig): ChatOpenAI {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new ProviderError(
        this.name,
        "OpenAI API Key 未配置，请设置 OPENAI_API_KEY 环境变量或传入 apiKey 参数",
      );
    }

    return new ChatOpenAI({
      model: config.model || OpenAIProvider.DEFAULT_MODEL,
      openAIApiKey: apiKey,
      configuration: {
        baseURL: config.apiBase || process.env.OPENAI_BASE_URL,
        organization: config.organization,
      },
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      topP: config.topP,
      stop: config.stopSequences,
      timeout: config.timeout,
      maxRetries: config.maxRetries ?? 2,
    });
  }

  /** @inheritdoc */
  getConfig(): LLMConfig {
    return this.config;
  }

  /** @inheritdoc */
  getDefaultModel(): string {
    return this.config.model || OpenAIProvider.DEFAULT_MODEL;
  }

  /**
   * @inheritdoc
   *
   * @description 发送消息到 OpenAI 并返回响应。
   * 支持工具调用、自定义模型参数等。
   */
  async chat(options: ChatOptions): Promise<LLMResponse> {
    const { messages, tools, model, temperature, maxTokens } = options;

    // 验证输入
    this._validateMessages(messages);
    if (tools) {
      this._validateTools(tools);
    }

    // 合并配置
    const mergedConfig = this._mergeConfig({ model, temperature, maxTokens });

    try {
      // 转换消息格式
      const langchainMessages = this._convertMessages(messages);

      // 构建 invoke 选项
      const invokeOptions: Record<string, unknown> = {};

      // 设置模型参数
      if (mergedConfig.model) {
        invokeOptions.model = mergedConfig.model;
      }
      if (mergedConfig.temperature !== undefined) {
        invokeOptions.temperature = mergedConfig.temperature;
      }
      if (mergedConfig.maxTokens !== undefined) {
        invokeOptions.maxTokens = mergedConfig.maxTokens;
      }

      // 绑定工具（如果提供）
      if (tools && tools.length > 0) {
        invokeOptions.tools = this._convertTools(tools);
        invokeOptions.tool_choice = "auto";
      }

      // 调用 API
      const response = await this.client.invoke(
        langchainMessages,
        invokeOptions,
      );

      // 解析响应
      return this._parseResponse(response);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * @inheritdoc
   *
   * @description 以流式方式发送消息并逐块返回响应。
   */
  async *chatStream(options: ChatOptions): AsyncIterable<LLMStreamChunk> {
    const { messages, tools, model, temperature, maxTokens } = options;

    // 验证输入
    this._validateMessages(messages);
    if (tools) {
      this._validateTools(tools);
    }

    // 合并配置
    const mergedConfig = this._mergeConfig({ model, temperature, maxTokens });

    // 创建 AbortController 用于超时控制
    const controller = new AbortController();
    const timeoutMs = mergedConfig.timeout ?? 120000; // 默认 2 分钟超时

    // 设置超时
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    // 用于记录最后一块
    let lastChunk: LLMStreamChunk | null = null;

    try {
      // 转换消息格式
      const langchainMessages = this._convertMessages(messages);

      // 构建 invoke 选项
      const invokeOptions: Record<string, unknown> = {
        signal: controller.signal,
      };

      if (mergedConfig.model) {
        invokeOptions.model = mergedConfig.model;
      }
      if (mergedConfig.temperature !== undefined) {
        invokeOptions.temperature = mergedConfig.temperature;
      }
      if (mergedConfig.maxTokens !== undefined) {
        invokeOptions.maxTokens = mergedConfig.maxTokens;
      }

      // 绑定工具
      if (tools && tools.length > 0) {
        invokeOptions.tools = this._convertTools(tools);
        invokeOptions.tool_choice = "auto";
      }

      // 流式调用
      const stream = await this.client.stream(langchainMessages, invokeOptions);

      // 迭代流
      for await (const chunk of stream) {
        lastChunk = this._parseStreamChunk(chunk);
        yield lastChunk;
      }
    } catch (error) {
      if (controller.signal.aborted) {
        // 标记最后一块不完整
        if (lastChunk) {
          yield {
            ...lastChunk,
            isFinal: true,
            finishReason: "timeout",
          };
        }
        throw new ProviderError(
          this.name,
          `流式响应超时 (${timeoutMs}ms)`,
          408, // Request Timeout
          error instanceof Error ? { originalError: error.message } : undefined,
        );
      }
      throw this._handleError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 检查提供商是否可用
   *
   * @description 通过发送一个简单请求验证 API 配置。
   * @returns 如果配置有效返回 true
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.chat({
        messages: [{ role: "user", content: "hi" }],
        maxTokens: 5,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 合并配置
   *
   * @description 将调用选项与默认配置合并
   */
  private _mergeConfig(options: Partial<ChatOptions>): LLMConfig {
    return {
      ...this.config,
      model: options.model ?? this.config.model ?? OpenAIProvider.DEFAULT_MODEL,
      temperature: options.temperature ?? this.config.temperature,
      maxTokens: options.maxTokens ?? this.config.maxTokens,
    };
  }

  /**
   * 验证消息列表
   *
   * @param messages - 消息列表
   * @throws {ProviderError} 当消息格式无效时抛出
   */
  private _validateMessages(messages: ChatMessage[]): void {
    if (!messages || messages.length === 0) {
      throw new ProviderError(this.name, "消息列表不能为空");
    }

    for (const msg of messages) {
      if (!msg.role) {
        throw new ProviderError(this.name, "消息必须包含 role 字段");
      }
      if (msg.content === undefined && !msg.toolCalls && msg.role !== "tool") {
        throw new ProviderError(this.name, "消息必须包含 content 或 toolCalls");
      }
    }
  }

  /**
   * 验证工具定义
   *
   * @param tools - 工具定义列表
   * @throws {ProviderError} 当工具定义无效时抛出
   */
  private _validateTools(tools: ToolDefinition[]): void {
    for (const tool of tools) {
      if (!tool.name || typeof tool.name !== "string") {
        throw new ProviderError(
          this.name,
          "工具名称必须是非空字符串",
          undefined,
          { tool },
        );
      }
      if (!tool.description || typeof tool.description !== "string") {
        throw new ProviderError(
          this.name,
          `工具 ${tool.name} 必须有描述`,
          undefined,
          { tool },
        );
      }
    }
  }

  /**
   * 转换消息格式
   *
   * @description 将内部消息格式转换为 LangChain 消息格式
   * @param messages - 内部消息列表
   * @returns LangChain 消息列表
   */
  private _convertMessages(messages: ChatMessage[]): BaseMessage[] {
    return messages.map((msg) => {
      switch (msg.role) {
        case "system":
          return new SystemMessage(msg.content as string);
        case "user":
          return new HumanMessage(msg.content as MessageContent);
        case "assistant":
          return new AIMessage({
            content: msg.content as MessageContent,
            tool_calls: msg.toolCalls?.map((tc) => ({
              name: tc.name,
              args: tc.arguments,
              id: tc.id,
            })),
          });
        case "tool":
          return new ToolMessage({
            content: msg.content as string,
            tool_call_id: msg.toolCallId ?? "",
            name: msg.name,
          });
        default:
          throw new ProviderError(
            this.name,
            `不支持的消息角色: ${(msg as { role: string }).role}`,
          );
      }
    });
  }

  /**
   * 转换工具定义
   *
   * @description 将内部工具格式转换为 OpenAI 工具格式
   * @param tools - 内部工具定义
   * @returns OpenAI 工具格式
   */
  private _convertTools(tools: ToolDefinition[]): Array<{
    type: "function";
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }> {
    return tools.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: this._normalizeParameters(tool.parameters),
      },
    }));
  }

  /**
   * 标准化工具参数
   *
   * @description 处理 Zod Schema 或 JSON Schema
   * @param parameters - 工具参数定义
   * @returns JSON Schema 对象
   */
  private _normalizeParameters(
    parameters: ToolDefinition["parameters"],
  ): Record<string, unknown> {
    // 检查是否是 Zod Schema
    if (
      parameters &&
      typeof parameters === "object" &&
      "safeParse" in parameters
    ) {
      // 使用 zod 内置的 toJSONSchema 方法（zod v4+）
      const zodType = parameters as z.ZodType<unknown>;
      const jsonSchema = z.toJSONSchema(zodType);
      return jsonSchema as Record<string, unknown>;
    }

    // 已经是 JSON Schema，直接返回
    return parameters as Record<string, unknown>;
  }

  /**
   * 解析 LLM 响应
   *
   * @param response - LangChain 响应
   * @returns 标准化的 LLM 响应
   */
  private _parseResponse(response: AIMessage): LLMResponse {
    const content =
      typeof response.content === "string"
        ? response.content
        : response.content
            .filter(
              (part): part is { type: "text"; text: string } =>
                part.type === "text",
            )
            .map((part) => part.text)
            .join("");

    // 解析工具调用
    const toolCalls: ToolCall[] | undefined = response.tool_calls?.map(
      (tc) => ({
        id: tc.id || "",
        name: tc.name,
        arguments: tc.args as Record<string, unknown>,
      }),
    );

    return {
      content,
      toolCalls,
      hasToolCalls: Boolean(toolCalls && toolCalls.length > 0),
      usage: response.usage_metadata
        ? {
            inputTokens: response.usage_metadata.input_tokens,
            outputTokens: response.usage_metadata.output_tokens,
            totalTokens: response.usage_metadata.total_tokens,
          }
        : undefined,
      model: response.response_metadata?.model as string | undefined,
      finishReason: response.response_metadata?.finish_reason as
        | string
        | undefined,
      id: response.id,
    };
  }

  /**
   * 解析流式响应块
   *
   * @param chunk - LangChain 流式块
   * @returns 标准化的流式块
   */
  private _parseStreamChunk(chunk: AIMessage): LLMStreamChunk {
    const content =
      typeof chunk.content === "string"
        ? chunk.content
        : chunk.content
            .filter(
              (part): part is { type: "text"; text: string } =>
                part.type === "text",
            )
            .map((part) => part.text)
            .join("");

    // 解析工具调用（流式中可能是部分的）
    const toolCalls: Partial<ToolCall>[] | undefined = chunk.tool_calls?.map(
      (tc) => ({
        id: tc.id,
        name: tc.name,
        arguments: tc.args as Record<string, unknown>,
      }),
    );

    return {
      content: content || undefined,
      toolCalls,
      isFinal: !content && !toolCalls,
      finishReason: chunk.response_metadata?.finish_reason as
        | string
        | undefined,
      usage: chunk.usage_metadata
        ? {
            inputTokens: chunk.usage_metadata.input_tokens,
            outputTokens: chunk.usage_metadata.output_tokens,
            totalTokens: chunk.usage_metadata.total_tokens,
          }
        : undefined,
    };
  }

  /**
   * 处理错误
   *
   * @description 将各种错误转换为 ProviderError
   * @param error - 原始错误
   * @returns ProviderError 实例
   */
  private _handleError(error: unknown): ProviderError {
    // 已经是 ProviderError
    if (error instanceof ProviderError) {
      return error;
    }

    // 处理 API 错误
    if (error && typeof error === "object") {
      const apiError = error as {
        status?: number;
        statusCode?: number;
        message?: string;
        error?: { message?: string; type?: string };
      };

      const status = apiError.status || apiError.statusCode;
      const message = apiError.message || apiError.error?.message || "未知错误";

      // 限流错误
      if (status === 429) {
        return new ProviderError(
          this.name,
          "OpenAI API 请求被限流，请稍后重试",
          429,
          {
            originalError: message,
          },
        );
      }

      // 无效请求
      if (status === 400) {
        return new ProviderError(
          this.name,
          `OpenAI API 请求无效: ${message}`,
          400,
          {
            originalError: message,
            type: apiError.error?.type,
          },
        );
      }

      // 认证错误
      if (status === 401) {
        return new ProviderError(
          this.name,
          "OpenAI API 认证失败，请检查 API Key",
          401,
          {
            originalError: message,
          },
        );
      }

      // 服务器错误
      if (status && status >= 500) {
        return new ProviderError(
          this.name,
          `OpenAI API 服务器错误 (${status})`,
          status,
          {
            originalError: message,
          },
        );
      }
    }

    // 网络错误
    if (error instanceof Error) {
      if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ETIMEDOUT")
      ) {
        return new ProviderError(
          this.name,
          `网络连接失败: ${error.message}`,
          undefined,
          {
            originalError: error.message,
          },
        );
      }

      return new ProviderError(this.name, error.message, undefined, {
        originalError: error.message,
      });
    }

    return new ProviderError(this.name, "未知错误", undefined, { error });
  }
}
