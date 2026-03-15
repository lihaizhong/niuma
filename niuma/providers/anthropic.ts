/**
 * Anthropic 提供商实现
 *
 * @description 基于 Anthropic SDK 的 Claude 系列模型提供商实现。
 * 支持同步/流式聊天、工具调用、Anthropic beta 功能等。
 */

// ==================== 第三方库 ====================
import Anthropic from "@anthropic-ai/sdk";

// ==================== 本地模块 ====================
import type { LLMProvider } from "./base";
import type {
  ChatMessage,
  ChatOptions,
  LLMConfig,
  LLMResponse,
  LLMStreamChunk,
  ToolCall,
  ToolDefinition,
} from "../types";
import { ProviderError } from "../types";

/**
 * Anthropic 提供商配置
 *
 * @description 扩展基础 LLM 配置，支持 Anthropic 特定选项
 */
export interface AnthropicConfig extends LLMConfig {
  /** Anthropic API 版本 */
  version?: string;
  /** Anthropic beta 功能 */
  beta?: string[];
  /** 其他 Anthropic 特定选项 */
  extra?: {
    beta?: string[];
    [key: string]: unknown;
  };
}

/**
 * Anthropic 提供商
 *
 * @description 实现 LLMProvider 接口，通过 Anthropic SDK 调用 Claude API。
 *
 * @example
 * ```typescript
 * const provider = new AnthropicProvider({
 *   model: 'claude-3-5-sonnet-20241022',
 *   apiKey: process.env.ANTHROPIC_API_KEY,
 * });
 *
 * const response = await provider.chat({
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * });
 * ```
 */
export class AnthropicProvider implements LLMProvider {
  /** @inheritdoc */
  readonly name = "anthropic";

  /** 提供商配置 */
  private config: AnthropicConfig;

  /** Anthropic SDK 客户端 */
  private client: Anthropic;

  /** 默认模型 */
  private static readonly DEFAULT_MODEL = "claude-3-5-sonnet-20241022";

  /**
   * 创建 Anthropic 提供商实例
   *
   * @param config - LLM 配置
   * @throws {ProviderError} 当 API Key 未配置时抛出
   */
  constructor(config: AnthropicConfig) {
    this.config = config;
    this.client = this._createClient(config);
  }

  /**
   * 创建 Anthropic SDK 客户端
   *
   * @param config - 配置参数
   * @returns Anthropic 客户端
   */
  private _createClient(config: AnthropicConfig): Anthropic {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new ProviderError(
        this.name,
        "Anthropic API Key 未配置，请设置 ANTHROPIC_API_KEY 环境变量或传入 apiKey 参数",
      );
    }

    const beta = config.extra?.beta || config.beta || [];

    return new Anthropic({
      apiKey,
      baseURL: config.apiBase || process.env.ANTHROPIC_BASE_URL,
      maxRetries: config.maxRetries ?? 2,
      timeout: config.timeout,
      defaultHeaders: {
        "anthropic-version": config.version || "2023-06-01",
      },
    });
  }

  /** @inheritdoc */
  getConfig(): LLMConfig {
    return this.config;
  }

  /** @inheritdoc */
  getDefaultModel(): string {
    return this.config.model || AnthropicProvider.DEFAULT_MODEL;
  }

  /**
   * @inheritdoc
   *
   * @description 发送消息到 Anthropic 并返回响应。
   * 支持工具调用、自定义模型参数等。
   */
  async chat(options: ChatOptions): Promise<LLMResponse> {
    const { messages, tools, model, temperature, maxTokens } = options;

    // 验证输入
    this._validateMessages(messages);

    // 转换消息格式
    const anthropicMessages = this._convertMessages(messages);
    const systemMessage = this._extractSystemMessage(messages);

    // 添加 beta 功能（暂时禁用，等待 SDK 更新）
    // const beta = this.config.extra?.beta || this.config.beta;
    // if (beta && beta.length > 0) {
    //   requestParams.beta = beta as any[];
    // }

    try {
      const response = await this.client.messages.create(requestParams);
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

    // 转换消息格式
    const anthropicMessages = this._convertMessages(messages);
    const systemMessage = this._extractSystemMessage(messages);

    // 构建请求参数
    const requestParams: Anthropic.MessageCreateParams = {
      model: model || this.config.model || AnthropicProvider.DEFAULT_MODEL,
      messages: anthropicMessages,
      max_tokens: maxTokens || this.config.maxTokens || 4096,
      stream: true,
    };

    if (systemMessage) {
      requestParams.system = systemMessage;
    }

    if (temperature !== undefined) {
      requestParams.temperature = temperature;
    } else if (this.config.temperature !== undefined) {
      requestParams.temperature = this.config.temperature;
    }

    if (tools && tools.length > 0) {
      requestParams.tools = this._convertTools(tools);
    }

    // 添加 beta 功能
    const beta = this.config.extra?.beta || this.config.beta;
    if (beta && beta.length > 0) {
      requestParams.beta = beta as Anthropic.BetaParam[];
    }

    try {
      const stream = await this.client.messages.create(requestParams);

      for await (const event of stream) {
        const chunk = this._parseStreamEvent(event);
        if (chunk) {
          yield chunk;
        }
      }
    } catch (error) {
      throw this._handleError(error);
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
      if (
        msg.content === undefined &&
        !msg.toolCalls &&
        msg.role !== "tool"
      ) {
        throw new ProviderError(
          this.name,
          "消息必须包含 content 或 toolCalls",
        );
      }
    }
  }

  /**
   * 提取系统消息
   *
   * @description 从消息列表中提取 system 消息
   * @param messages - 消息列表
   * @returns 系统消息内容，如果没有则返回 undefined
   */
  private _extractSystemMessage(
    messages: ChatMessage[],
  ): string | undefined {
    const systemMessage = messages.find((msg) => msg.role === "system");
    if (systemMessage) {
      return systemMessage.content as string;
    }
    return undefined;
  }

  /**
   * 转换消息格式
   *
   * @description 将内部消息格式转换为 Anthropic 格式
   * @param messages - 内部消息列表
   * @returns Anthropic 消息列表（不包含 system 消息）
   */
  private _convertMessages(
    messages: ChatMessage[],
  ): Anthropic.MessageParam[] {
    return messages
      .filter((msg) => msg.role !== "system")
      .map((msg) => {
        switch (msg.role) {
          case "user":
            return {
              role: "user" as const,
              content: msg.content as string,
            };
          case "assistant":
            const assistantMessage: Anthropic.MessageParam = {
              role: "assistant" as const,
              content: (msg.content as string) || "",
            };

            if (msg.toolCalls && msg.toolCalls.length > 0) {
              assistantMessage.content = msg.toolCalls.map((tc) => ({
                type: "tool_use" as const,
                id: tc.id,
                name: tc.name,
                input: tc.arguments,
              }));
            }

            return assistantMessage;
          case "tool":
            return {
              role: "user" as const,
              content: [
                {
                  type: "tool_result" as const,
                  tool_use_id: msg.toolCallId || "",
                  content: msg.content as string,
                },
              ],
            };
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
   * @description 将内部工具格式转换为 Anthropic 工具格式
   * @param tools - 内部工具定义
   * @returns Anthropic 工具格式
   */
  private _convertTools(
    tools: ToolDefinition[],
  ): Anthropic.Tool[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: "object" as const,
        properties: tool.parameters as Record<string, unknown>,
        required: [],
      },
    }));
  }

  /**
   * 解析 LLM 响应
   *
   * @param response - Anthropic 响应
   * @returns 标准化的 LLM 响应
   */
  private _parseResponse(response: Anthropic.Message): LLMResponse {
    let content = "";
    const toolCalls: ToolCall[] = [];

    for (const block of response.content) {
      if (block.type === "text") {
        content += block.text;
      } else if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: block.input as Record<string, unknown>,
        });
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      hasToolCalls: toolCalls.length > 0,
      usage: response.usage
        ? {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            totalTokens:
              response.usage.input_tokens + response.usage.output_tokens,
          }
        : undefined,
      model: response.model,
      finishReason: response.stop_reason || undefined,
      id: response.id,
    };
  }

  /**
   * 解析流式事件
   *
   * @param event - Anthropic 流式事件
   * @returns 标准化的流式块，如果是元数据事件则返回 undefined
   */
  private _parseStreamEvent(
    event: Anthropic.MessageStreamEvent,
  ): LLMStreamChunk | undefined {
    if (event.type === "content_block_delta") {
      if (event.delta.type === "text_delta") {
        return {
          content: event.delta.text,
          isFinal: false,
        };
      }
    } else if (event.type === "content_block_stop") {
      return {
        isFinal: false,
      };
    } else if (event.type === "message_delta") {
      if (event.delta.stop_reason) {
        return {
          isFinal: true,
          finishReason: event.delta.stop_reason,
        };
      }
    } else if (event.type === "message_stop") {
      return {
        isFinal: true,
      };
    }

    return undefined;
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

    // 处理 Anthropic API 错误
    if (error instanceof Anthropic.APIError) {
      const message = error.message;
      const status = error.status;

      // 限流错误
      if (status === 429) {
        return new ProviderError(
          this.name,
          "Anthropic API 请求被限流，请稍后重试",
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
          `Anthropic API 请求无效: ${message}`,
          400,
          {
            originalError: message,
          },
        );
      }

      // 认证错误
      if (status === 401) {
        return new ProviderError(
          this.name,
          "Anthropic API 认证失败，请检查 API Key",
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
          `Anthropic API 服务器错误 (${status})`,
          status,
          {
            originalError: message,
          },
        );
      }

      return new ProviderError(this.name, message, status, {
        originalError: message,
      });
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