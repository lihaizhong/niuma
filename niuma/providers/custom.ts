/**
 * 自定义提供商实现
 *
 * @description 基于 OpenAI 提供商实现自定义 OpenAI 兼容端点.
 */

/* eslint-disable no-undef */
import { OpenAIProvider } from "./openai";
import type { LLMConfig } from "../types";
import { ProviderError } from "../types";

/**
 * 自定义提供商配置
 */
export interface CustomConfig extends LLMConfig {
  /** 自定义 HTTP 头 */
  extra?: {
    headers?: Record<string, string>;
    models?: string[]; // 允许的模型列表
    [key: string]: unknown;
  };
}

/**
 * 自定义提供商
 *
 * @description 继承 OpenAIProvider，支持自定义 OpenAI 兼容端点。
 */
export class CustomProvider extends OpenAIProvider {
  /** @inheritdoc */
  readonly name: string = "custom";

  /**
   * 创建自定义提供商实例
   *
   * @param config - LLM 配置
   * @throws {ProviderError} 当 API Base 未配置时抛出
   */
  constructor(config: CustomConfig) {
    super(config);
    // 在 super 调用之后验证配置
    CustomProvider._validateConfig(config);
  }

  /**
   * 验证配置
   *
   * @param config - 配置参数
   * @throws {ProviderError} 当配置无效时抛出
   */
  private static _validateConfig(config: CustomConfig): void {
    if (!config.apiBase) {
      throw new ProviderError(
        "custom",
        "自定义提供商必须配置 apiBase",
        undefined,
        {
          example: "http://localhost:11434/v1 (Ollama) 或 https://your-api.example.com/v1",
        },
      );
    }

    // 验证 URL 格式
    try {
      new URL(config.apiBase);
    } catch {
      throw new ProviderError(
        "custom",
        `apiBase 格式无效: ${config.apiBase}`,
        undefined,
        {
          example: "http://localhost:11434/v1 或 https://your-api.example.com/v1",
        },
      );
    }
  }
}