/**
 * DeepSeek 提供商实现
 *
 * @description 基于 OpenAI 提供商实现 DeepSeek 系列模型。
 */

import { OpenAIProvider } from "./openai";

import type { LLMConfig } from "../types";

/**
 * DeepSeek 提供商配置
 */
export interface DeepSeekConfig extends LLMConfig {
  // DeepSeek 配置与标准 LLMConfig 相同
}

/**
 * DeepSeek 提供商
 *
 * @description 继承 OpenAIProvider，通过自定义 API Base 指向 DeepSeek。
 */
export class DeepSeekProvider extends OpenAIProvider {
  /** @inheritdoc */
  readonly name: string = "deepseek";

  /** 默认模型 */
  private static readonly DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";

  /**
   * 创建 DeepSeek 提供商实例
   *
   * @param config - LLM 配置
   */
  constructor(config: DeepSeekConfig) {
    // 设置默认 API Base 和模型
    const deepseekConfig = {
      ...config,
      apiBase: config.apiBase || "https://api.deepseek.com",
      model: config.model || DeepSeekProvider.DEFAULT_DEEPSEEK_MODEL,
    };

    super(deepseekConfig);
  }
}