/**
 * 提供商注册表
 *
 * @description 管理多个 LLM 提供商的注册、查询和自动选择。
 * 支持两步式注册（spec + config field）和智能匹配机制.
 */

 
// ==================== 本地模块 ====================
import { AnthropicProvider } from "./anthropic";
import { CustomProvider } from "./custom";
import { DeepSeekProvider } from "./deepseek";
import { OpenAIProvider } from "./openai";
import { OpenRouterProvider } from "./openrouter";

import type { LLMProvider } from "./base";
import type { LLMConfig } from "../types";

/**
 * 提供商规格
 *
 * @description 描述提供商的元数据和匹配规则
 */
export interface ProviderSpec {
  /** 配置字段名（如 "openai", "anthropic"） */
  name: string;
  /** 模型名关键词数组（如 ["gpt", "o1"]） */
  keywords: string[];
  /** 环境变量名（如 "OPENAI_API_KEY"） */
  envKey: string;
  /** 显示名称（如 "OpenAI"） */
  displayName: string;
  /** 是否为网关（如 OpenRouter） */
  isGateway?: boolean;
  /** 默认 API Base */
  defaultApiBase?: string;
  /** 提供商工厂函数 */
  factory: (config: LLMConfig) => LLMProvider;
}

/**
 * 提供商注册表
 *
 * @description 管理提供商的注册、查询和自动选择。
 */
export class ProviderRegistry {
  /** 提供商规格映射 */
  private specs: Map<string, ProviderSpec> = new Map();

  /** 提供商实例映射 */
  private instances: Map<string, LLMProvider> = new Map();

  /** 默认提供商名称 */
  private defaultProvider?: string;

  /** 配置映射 */
  private configs: Map<string, LLMConfig> = new Map();

  /**
   * 创建提供商注册表实例
   */
  constructor() {
    this._registerBuiltinProviders();
  }

  /**
   * 注册提供商规格
   *
   * @param spec - 提供商规格
   * @throws 如果已存在同名提供商，发出警告并覆盖
   */
  register(spec: ProviderSpec): void {
    if (this.specs.has(spec.name)) {
      console.warn(`[ProviderRegistry] 提供商 "${spec.name}" 已存在，将被覆盖`);
    }
    this.specs.set(spec.name, spec);
  }

  /**
   * 批量注册提供商规格
   *
   * @param specs - 提供商规格数组
   */
  registerMultiple(specs: ProviderSpec[]): void {
    for (const spec of specs) {
      this.register(spec);
    }
  }

  /**
   * 根据模型名获取提供商
   *
   * @description 智能匹配提供商，优先级：
   * 1. 显式指定（如 "openai/gpt-4o"）
   * 2. 关键词匹配（如 "gpt-4o" → OpenAI）
   * 3. 网关回退（如 OpenRouter）
   * 4. 默认提供商
   *
   * @param model - 模型名
   * @returns 提供商实例，如果未找到返回 undefined
   */
  getProvider(model: string): LLMProvider | undefined {
    // 优先级 1：显式指定
    const explicitMatch = this._matchExplicit(model);
    if (explicitMatch) {
      return this._getOrCreateProvider(explicitMatch);
    }

    // 优先级 2：关键词匹配
    const keywordMatch = this._matchKeyword(model);
    if (keywordMatch) {
      return this._getOrCreateProvider(keywordMatch);
    }

    // 优先级 3：网关回退
    const gateway = this._findGateway();
    if (gateway) {
      return this._getOrCreateProvider(gateway);
    }

    // 优先级 4：默认提供商
    if (this.defaultProvider) {
      return this._getOrCreateProvider(this.defaultProvider);
    }

    return undefined;
  }

  /**
   * 根据名称获取提供商
   *
   * @param name - 提供商名称
   * @returns 提供商实例，如果未找到返回 undefined
   */
  getProviderByName(name: string): LLMProvider | undefined {
    if (!this.specs.has(name)) {
      return undefined;
    }
    return this._getOrCreateProvider(name);
  }

  /**
   * 获取默认提供商
   *
   * @returns 默认提供商实例，如果未设置返回第一个注册的提供商
   */
  getDefaultProvider(): LLMProvider | undefined {
    if (this.defaultProvider) {
      return this.getProviderByName(this.defaultProvider);
    }

    // 返回第一个注册的提供商
    const firstProvider = this.specs.keys().next().value;
    if (firstProvider) {
      return this.getProviderByName(firstProvider);
    }

    return undefined;
  }

  /**
   * 设置默认提供商
   *
   * @param name - 提供商名称
   * @throws 如果提供商不存在
   */
  setDefaultProvider(name: string): void {
    if (!this.specs.has(name)) {
      throw new Error(`提供商 "${name}" 不存在`);
    }
    this.defaultProvider = name;
  }

  /**
   * 获取所有提供商规格
   *
   * @returns 提供商规格数组
   */
  listProviders(): ProviderSpec[] {
    return Array.from(this.specs.values());
  }

  /**
   * 获取所有可用提供商
   *
   * @description 返回所有配置了 API 密钥的提供商
   * @returns 可用的提供商规格数组
   */
  listAvailableProviders(): ProviderSpec[] {
    return Array.from(this.specs.values()).filter((spec) => {
      const envKey = spec.envKey;
      const apiKey = process.env[envKey];
      return Boolean(apiKey);
    });
  }

  /**
   * 创建提供商实例
   *
   * @param name - 提供商名称
   * @param config - 提供商配置
   * @returns 提供商实例
   * @throws 如果提供商不存在
   */
  createProvider(name: string, config: LLMConfig): LLMProvider {
    const spec = this.specs.get(name);
    if (!spec) {
      throw new Error(`提供商 "${name}" 不存在`);
    }

    // 缓存配置
    this.configs.set(name, config);

    // 创建实例
    const instance = spec.factory(config);
    this.instances.set(name, instance);

    return instance;
  }

  /**
   * 匹配显式指定的提供商
   *
   * @param model - 模型名
   * @returns 提供商名称，如果未匹配返回 undefined
   */
  private _matchExplicit(model: string): string | undefined {
    const parts = model.split("/");
    if (parts.length === 2) {
      const providerName = parts[0];
      if (this.specs.has(providerName)) {
        return providerName;
      }
    }
    return undefined;
  }

  /**
   * 匹配关键词
   *
   * @param model - 模型名
   * @returns 提供商名称，如果未匹配返回 undefined
   */
  private _matchKeyword(model: string): string | undefined {
    const lowerModel = model.toLowerCase();

    // 按关键词长度降序排序，优先匹配更具体的关键词
    const providers = Array.from(this.specs.values())
      .filter((spec) => !spec.isGateway) // 排除网关
      .sort((a, b) => {
        const maxKeywordA = Math.max(...a.keywords.map((k) => k.length));
        const maxKeywordB = Math.max(...b.keywords.map((k) => k.length));
        return maxKeywordB - maxKeywordA; // 降序
      });

    for (const spec of providers) {
      for (const keyword of spec.keywords) {
        if (lowerModel.includes(keyword.toLowerCase())) {
          return spec.name;
        }
      }
    }

    return undefined;
  }

  /**
   * 查找网关提供商
   *
   * @returns 网关提供商名称，如果未找到返回 undefined
   */
  private _findGateway(): string | undefined {
    for (const [name, spec] of this.specs.entries()) {
      if (spec.isGateway) {
        return name;
      }
    }
    return undefined;
  }

  /**
   * 获取或创建提供商实例
   *
   * @param name - 提供商名称
   * @returns 提供商实例
   * @throws 如果提供商配置未设置
   */
  private _getOrCreateProvider(name: string): LLMProvider {
    // 检查是否已有实例
    if (this.instances.has(name)) {
      return this.instances.get(name)!;
    }

    // 获取规格
    const spec = this.specs.get(name);
    if (!spec) {
      throw new Error(`提供商 "${name}" 不存在`);
    }

    // 检查配置
    const config = this.configs.get(name);
    if (!config) {
      throw new Error(`提供商 "${name}" 配置未设置`);
    }

    // 创建实例
    const instance = spec.factory(config);
    this.instances.set(name, instance);

    return instance;
  }

  /**
   * 注册内置提供商
   *
   * @description 自动注册 OpenAI、Anthropic、OpenRouter、DeepSeek、Custom 提供商
   */
  private _registerBuiltinProviders(): void {
    // OpenAI 提供商
    this.register({
      name: "openai",
      keywords: ["gpt", "o1", "chatgpt"],
      envKey: "OPENAI_API_KEY",
      displayName: "OpenAI",
      defaultApiBase: "https://api.openai.com/v1",
      factory: (config) => new OpenAIProvider(config),
    });

    // Anthropic 提供商
    this.register({
      name: "anthropic",
      keywords: ["claude"],
      envKey: "ANTHROPIC_API_KEY",
      displayName: "Anthropic",
      defaultApiBase: "https://api.anthropic.com",
      factory: (config) => new AnthropicProvider(config),
    });

    // OpenRouter 提供商（网关）
    this.register({
      name: "openrouter",
      keywords: [],
      envKey: "OPENROUTER_API_KEY",
      displayName: "OpenRouter",
      isGateway: true,
      defaultApiBase: "https://openrouter.ai/api/v1",
      factory: (config) => new OpenRouterProvider(config),
    });

    // DeepSeek 提供商
    this.register({
      name: "deepseek",
      keywords: ["deepseek"],
      envKey: "DEEPSEEK_API_KEY",
      displayName: "DeepSeek",
      defaultApiBase: "https://api.deepseek.com",
      factory: (config) => new DeepSeekProvider(config),
    });

    // Custom 提供商
    this.register({
      name: "custom",
      keywords: [],
      envKey: "CUSTOM_API_KEY",
      displayName: "Custom",
      factory: (config) => new CustomProvider(config),
    });
  }

  /**
   * 设置提供商配置
   *
   * @param name - 提供商名称
   * @param config - 提供商配置
   */
  setProviderConfig(name: string, config: LLMConfig): void {
    this.configs.set(name, config);
  }

  /**
   * 获取提供商配置
   *
   * @param name - 提供商名称
   * @returns 提供商配置，如果未设置返回 undefined
   */
  getProviderConfig(name: string): LLMConfig | undefined {
    return this.configs.get(name);
  }

  /**
   * 清除所有提供商实例
   *
   * @description 用于测试或重新初始化
   */
  clearInstances(): void {
    this.instances.clear();
  }

  /**
   * 清除所有配置
   *
   * @description 用于测试或重新初始化
   */
  clearConfigs(): void {
    this.configs.clear();
  }

  /**
   * 重置注册表
   *
   * @description 清除所有实例和配置，但保留规格
   */
  reset(): void {
    this.clearInstances();
    this.clearConfigs();
    this.defaultProvider = undefined;
  }

  /**
   * 清除所有提供商规格
   *
   * @description 用于测试，清除所有规格、实例和配置
   */
  clearSpecs(): void {
    this.specs.clear();
    this.reset();
  }
}

// 创建全局注册表实例
export const providerRegistry = new ProviderRegistry();