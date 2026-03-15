/**
 * LLM 提供商抽象接口
 * @description 定义所有 LLM 提供商必须实现的接口
 */

import type {
  LLMConfig,
  LLMResponse,
  LLMStreamChunk,
  ChatOptions,
} from "../types";

/**
 * LLM 提供商接口
 * @description 所有 LLM 提供商必须实现此接口
 */
export interface LLMProvider {
  /**
   * 获取提供商配置
   */
  getConfig(): LLMConfig;

  /**
   * 同步聊天接口
   *
   * @description 发送消息并获取完整的响应。
   *
   * @param options - 聊天选项
   * @returns LLM 响应对象
   * @throws {ProviderError} 当 API 调用失败时抛出
   *
   * @example
   * ```typescript
   * const response = await provider.chat({
   *   messages: [{ role: 'user', content: '你好' }],
   *   model: 'gpt-4o'
   * })
   * ```
   */
  chat(options: ChatOptions): Promise<LLMResponse>;

  /**
   * 流式聊天接口（可选）
   *
   * @description 以流式方式发送消息并逐块返回响应。
   * 适用于需要实时显示生成内容的场景。
   *
   * @param options - 聊天选项（同 chat 方法）
   * @returns 异步可迭代对象，每次迭代返回一个响应块
   * @throws {ProviderError} 当 API 调用失败时抛出
   *
   * @example
   * ```typescript
   * for await (const chunk of provider.chatStream({ messages })) {
   *   if (chunk.content) {
   *     process.stdout.write(chunk.content);
   *   }
   *   if (chunk.isFinal) {
   *     console.log('\nGeneration complete');
   *   }
   * }
   * ```
   */
  chatStream?(options: ChatOptions): AsyncIterable<LLMStreamChunk>;

  /**
   * 获取默认模型名称
   *
   * @description 返回此提供商配置的默认模型标识符。
   * 当调用 chat/chatStream 时未指定 model 参数时使用。
   *
   * @returns 默认模型名称（如 'gpt-4o'、'claude-3-opus'）
   */
  getDefaultModel(): string;

  /**
   * 检查提供商是否可用（可选）
   *
   * @description 验证提供商配置是否正确、API 密钥是否有效。
   * 可用于健康检查或初始化验证。
   *
   * @returns 如果提供商可用返回 true，否则返回 false
   */
  isAvailable?(): Promise<boolean>;
}

/**
 * 提供商错误
 * @description LLM 提供商相关的错误类型
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

/**
 * 提供商工厂
 * @description 根据配置创建相应的提供商实例
 */
export function createProvider(config: LLMConfig): LLMProvider {
  // 这里可以根据配置类型返回不同的提供商实现
  // 例如 OpenAIProvider, AnthropicProvider 等
  throw new Error("createProvider not implemented");
}
