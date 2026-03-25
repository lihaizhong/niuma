/**
 * DeepSeek 提供商实现
 *
 * 基于 OpenAI 提供商实现 DeepSeek 系列模型。
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
 * 继承 OpenAIProvider，通过自定义 API Base 指向 DeepSeek。
 */
export class DeepSeekProvider extends OpenAIProvider {
  /** @inheritdoc */
  readonly name: string = "deepseek";

  /** 默认 API Base */
  public static readonly DEFAULT_API_BASE: string = "https://api.deepseek.com";

  /** 默认模型 */
  public static readonly DEFAULT_MODEL: string = "deepseek-chat";

  /**
   * 创建 DeepSeek 提供商实例
   *
   * @param config - LLM 配置
   */
  constructor(config: DeepSeekConfig) {
    // 设置默认 API Base 和模型
    const deepseekConfig = {
      ...config,
      apiBase: config.apiBase || DeepSeekProvider.DEFAULT_API_BASE,
      model: config.model || DeepSeekProvider.DEFAULT_MODEL,
    };

    super(deepseekConfig);
  }
}