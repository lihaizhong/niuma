/**
 * Ollama 提供商实现
 *
 * 基于 OpenAI 兼容 API 的 Ollama 本地模型提供商。
 * Ollama 运行在本地，默认地址 http://127.0.0.1:11434
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
 * Ollama 提供商配置
 */
export interface OllamaConfig extends LLMConfig {
  /** Ollama 服务地址，默认 http://127.0.0.1:11434 */
  apiBase?: string;
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 最大重试次数 */
  maxRetries?: number;
}

/**
 * Ollama 提供商
 *
 * 实现 LLMProvider 接口，通过 OpenAI 兼容 API 调用 Ollama 本地模型。
 *
 * @example
 * ```typescript
 * const provider = new OllamaProvider({
 *   model: 'llama3',
 *   apiBase: 'http://127.0.0.1:11434',
 * });
 *
 * const response = await provider.chat({
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * });
 * ```
 */
export class OllamaProvider implements LLMProvider {
  /** @inheritdoc */
  readonly name: string = "ollama";

  /** 提供商配置 */
  private config: OllamaConfig;

  /** LangChain ChatOpenAI 实例 */
  private client: ChatOpenAI;

  /** 默认 API 地址 */
  public static readonly DEFAULT_API_BASE: string = "http://127.0.0.1:11434/v1";

  /** 默认模型 */
  public static readonly DEFAULT_MODEL: string = "qwen3.5:cloud";

  /**
   * 创建 Ollama 提供商实例
   *
   * @param config - LLM 配置
   */
  constructor(config: OllamaConfig) {
    this.config = config;
    this.client = this._createClient(config);
  }

  /**
   * 创建 LangChain ChatOpenAI 客户端
   *
   * @param config - 配置参数
   * @returns ChatOpenAI 实例
   */
  private _createClient(config: OllamaConfig): ChatOpenAI {
    const apiBase = config.apiBase || process.env.OLLAMA_API_BASE || OllamaProvider.DEFAULT_API_BASE;
    const apiKey = config.apiKey || "ollama";

    // LangChain 的 ChatOpenAI 需要 OPENAI_API_KEY 环境变量存在
    // 如果未设置，使用一个占位值（Ollama 不验证 API Key）
    if (!process.env.OPENAI_API_KEY) {
      process.env.OPENAI_API_KEY = apiKey;
    }

    return new ChatOpenAI({
      model: config.model || OllamaProvider.DEFAULT_MODEL,
      // Ollama 不需要 API Key，但 LangChain 需要，使用任意值
      openAIApiKey: apiKey,
      configuration: {
        baseURL: apiBase,
      },
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      topP: config.topP,
      stop: config.stopSequences,
      timeout: config.timeout ?? 300000, // Ollama 本地模型可能较慢，默认 5 分钟
      maxRetries: config.maxRetries ?? 1,
    });
  }

  /** @inheritdoc */
  getConfig(): LLMConfig {
    return this.config;
  }

  /** @inheritdoc */
  getDefaultModel(): string {
    return this.config.model || OllamaProvider.DEFAULT_MODEL;
  }

  /**
   * @inheritdoc
   */
  async chat(options: ChatOptions): Promise<LLMResponse> {
    const { messages, tools, model, temperature, maxTokens } = options;

    this._validateMessages(messages);
    if (tools) {
      this._validateTools(tools);
    }

    const mergedConfig = this._mergeConfig({ model, temperature, maxTokens });

    try {
      const langchainMessages = this._convertMessages(messages);

      const invokeOptions: Record<string, unknown> = {};

      if (mergedConfig.model) {
        invokeOptions.model = mergedConfig.model;
      }
      if (mergedConfig.temperature !== undefined) {
        invokeOptions.temperature = mergedConfig.temperature;
      }
      if (mergedConfig.maxTokens !== undefined) {
        invokeOptions.maxTokens = mergedConfig.maxTokens;
      }

      if (tools && tools.length > 0) {
        invokeOptions.tools = this._convertTools(tools);
        invokeOptions.tool_choice = "auto";
      }

      const response = await this.client.invoke(
        langchainMessages,
        invokeOptions,
      );

      return this._parseResponse(response);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * @inheritdoc
   */
  async *chatStream(options: ChatOptions): AsyncIterable<LLMStreamChunk> {
    const { messages, tools, model, temperature, maxTokens } = options;

    this._validateMessages(messages);
    if (tools) {
      this._validateTools(tools);
    }

    const mergedConfig = this._mergeConfig({ model, temperature, maxTokens });

    const controller = new AbortController();
    const timeoutMs = mergedConfig.timeout ?? 300000;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    let lastChunk: LLMStreamChunk | null = null;

    try {
      const langchainMessages = this._convertMessages(messages);

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

      if (tools && tools.length > 0) {
        invokeOptions.tools = this._convertTools(tools);
        invokeOptions.tool_choice = "auto";
      }

      const stream = await this.client.stream(langchainMessages, invokeOptions);

      for await (const chunk of stream) {
        lastChunk = this._parseStreamChunk(chunk);
        yield lastChunk;
      }
    } catch (error) {
      if (controller.signal.aborted) {
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
          408,
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
   */
  private _mergeConfig(options: Partial<ChatOptions>): LLMConfig {
    return {
      ...this.config,
      model: options.model ?? this.config.model ?? OllamaProvider.DEFAULT_MODEL,
      temperature: options.temperature ?? this.config.temperature,
      maxTokens: options.maxTokens ?? this.config.maxTokens,
    };
  }

  /**
   * 验证消息列表
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
   */
  private _normalizeParameters(
    parameters: ToolDefinition["parameters"],
  ): Record<string, unknown> {
    if (
      parameters &&
      typeof parameters === "object" &&
      "safeParse" in parameters
    ) {
      const zodType = parameters as z.ZodType<unknown>;
      const jsonSchema = z.toJSONSchema(zodType);
      return jsonSchema as Record<string, unknown>;
    }

    return parameters as Record<string, unknown>;
  }

  /**
   * 解析 LLM 响应
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
   */
  private _handleError(error: unknown): ProviderError {
    if (error instanceof ProviderError) {
      return error;
    }

    if (error && typeof error === "object") {
      const apiError = error as {
        status?: number;
        statusCode?: number;
        message?: string;
        error?: { message?: string; type?: string };
      };

      const status = apiError.status || apiError.statusCode;
      const message = apiError.message || apiError.error?.message || "未知错误";

      if (status === 429) {
        return new ProviderError(
          this.name,
          "Ollama 请求被限流，请稍后重试",
          429,
          { originalError: message },
        );
      }

      if (status === 400) {
        return new ProviderError(
          this.name,
          `Ollama 请求无效: ${message}`,
          400,
          { originalError: message, type: apiError.error?.type },
        );
      }

      if (status && status >= 500) {
        return new ProviderError(
          this.name,
          `Ollama 服务错误 (${status})`,
          status,
          { originalError: message },
        );
      }
    }

    if (error instanceof Error) {
      if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ETIMEDOUT")
      ) {
        return new ProviderError(
          this.name,
          `无法连接到 Ollama 服务，请确认 Ollama 正在运行 (${this.config.apiBase || OllamaProvider.DEFAULT_API_BASE})`,
          undefined,
          { originalError: error.message },
        );
      }

      return new ProviderError(this.name, error.message, undefined, {
        originalError: error.message,
      });
    }

    return new ProviderError(this.name, "未知错误", undefined, { error });
  }
}
