/**
 * OpenRouter 提供商实现
 *
 * @description 基于 OpenAI 提供商实现 OpenRouter 多模型网关。
 */

import { OpenAIProvider } from "./openai";

import type { LLMConfig } from "../types";

/**
 * OpenRouter 提供商配置
 */
export interface OpenRouterConfig extends LLMConfig {
  /** 自定义 HTTP 头 */
  extra?: {
    headers?: Record<string, string>;
    [key: string]: unknown;
  };
}

/**
 * OpenRouter 提供商
 *
 * @description 继承 OpenAIProvider，通过自定义 API Base 指向 OpenRouter。
 */
export class OpenRouterProvider extends OpenAIProvider {
  /** @inheritdoc */
  readonly name: string = "openrouter";

  /** 是否为网关 */
  readonly isGateway = true;

  /**
   * 创建 OpenRouter 提供商实例
   *
   * @param config - LLM 配置
   */
  constructor(config: OpenRouterConfig) {
    // 设置默认 API Base
    const openRouterConfig = {
      ...config,
      apiBase: config.apiBase || "https://openrouter.ai/api/v1",
    };

    super(openRouterConfig);
  }
}