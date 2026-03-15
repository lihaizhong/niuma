/**
 * 配置管理器
 * 整合 JSON5 加载、环境变量解析、配置合并和验证
 */

// ==================== 内置库 ====================
import { join } from "path";
import { homedir } from "os";

// ==================== 第三方库 ====================
import fs from "fs-extra";

// ==================== 本地模块 ====================
import { json5ConfigLoader } from "./json5-loader";
import { resolveEnvVars } from "./env-resolver";
import { mergeConfigs } from "./merger";
import { NiumaConfig, StrictNiumaConfigSchema, ProviderConfig } from "./schema";
import {
  providerRegistry,
  ProviderRegistry,
  type ProviderSpec,
} from "../providers/registry";
import type { LLMProvider } from "../providers/base";
import type { LLMConfig } from "../types";

// ============================================
// 接口定义
// ============================================

/**
 * 角色信息
 */
export interface AgentInfo {
  /** 角色唯一标识符 */
  id: string;
  /** 角色显示名称 */
  name: string;
  /** 角色描述 */
  description?: string;
  /** 是否为默认角色 */
  default: boolean;
  /** 配置摘要 */
  config: {
    /** Agent 配置是否有覆盖 */
    agent: boolean;
    /** 提供商配置是否有覆盖 */
    providers: boolean;
    /** 渠道配置是否有覆盖 */
    channels: boolean;
    /** 定时任务配置是否有覆盖 */
    cronTasks: boolean;
  };
}

// ============================================
// ConfigManager 类
// ============================================

/**
 * 配置管理器
 */
export class ConfigManager {
  private configPath: string;
  private config: NiumaConfig | null = null;
  private cache: Map<string, Partial<NiumaConfig>> = new Map();
  private registry: ProviderRegistry;
  private providersInitialized: boolean = false;

  constructor(configPath?: string) {
    this.configPath =
      configPath ?? join(homedir(), ".niuma", "niuma.config.json");
    // 使用全局 ProviderRegistry 实例
    this.registry = providerRegistry;
  }

  /**
   * 加载并解析配置文件
   * @param force 是否强制重新加载
   * @returns 验证后的配置对象
   */
  load(force: boolean = false): NiumaConfig {
    // 如果已缓存且不强制重新加载，返回缓存
    if (this.config && !force) {
      return this.config;
    }

    // 1. 加载 JSON5 配置文件
    const rawConfig = json5ConfigLoader.load(this.configPath);

    // 2. 解析环境变量引用
    const resolvedConfig = resolveEnvVars(rawConfig, { strict: false });

    // 3. 使用严格模式验证配置
    try {
      this.config = StrictNiumaConfigSchema.parse(resolvedConfig);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`配置验证失败: ${this.configPath}\n${error.message}`, {
          cause: error,
        });
      }
      throw error;
    }

    // 清除角色配置缓存
    this.cache.clear();

    return this.config;
  }

  /**
   * 获取角色配置（合并全局默认配置和角色特定配置）
   * @param agentId 角色唯一标识符
   * @returns 合并后的角色配置
   */
  getAgentConfig(agentId: string): NiumaConfig {
    const config = this.load();

    // 查找角色定义
    const agent = config.agents.list.find((a) => a.id === agentId);
    if (!agent) {
      throw new Error(`角色 ${agentId} 不存在`);
    }

    // 检查缓存
    if (this.cache.has(agentId)) {
      return { ...config, ...this.cache.get(agentId)! } as NiumaConfig;
    }

    // 合并全局默认配置和角色特定配置
    const mergedConfig = mergeConfigs(config, agent);

    // 缓存合并后的配置
    this.cache.set(agentId, mergedConfig);

    // 返回完整配置（包含 agents 字段）
    return { ...config, ...mergedConfig } as NiumaConfig;
  }

  /**
   * 获取角色工作区路径
   * @param agentId 角色唯一标识符
   * @returns 工作区绝对路径
   */
  getAgentWorkspaceDir(agentId: string): string {
    const config = this.load();

    // 查找角色定义
    const agent = config.agents.list.find((a) => a.id === agentId);
    if (!agent) {
      throw new Error(`角色 ${agentId} 不存在`);
    }

    // 如果角色配置中指定了 workspaceDir，使用它
    if (agent.workspaceDir) {
      fs.ensureDirSync(agent.workspaceDir);
      return agent.workspaceDir;
    }

    // 否则使用默认路径：~/.niuma/agents/{agentId}/workspace
    const defaultWorkspaceDir = join(
      homedir(),
      ".niuma",
      "agents",
      agentId,
      "workspace",
    );

    // 确保目录存在
    fs.ensureDirSync(defaultWorkspaceDir);

    return defaultWorkspaceDir;
  }

  /**
   * 获取角色日志路径
   * @param agentId 角色唯一标识符
   * @returns 日志文件绝对路径
   */
  getAgentLogPath(agentId: string): string {
    return join(homedir(), ".niuma", "logs", `${agentId}.log`);
  }

  /**
   * 获取角色会话存储路径
   * @param agentId 角色唯一标识符
   * @returns 会话存储目录绝对路径
   */
  getAgentSessionDir(agentId: string): string {
    const sessionDir = join(homedir(), ".niuma", "sessions", agentId);

    // 确保目录存在
    fs.ensureDirSync(sessionDir);

    return sessionDir;
  }

  /**
   * 列出所有角色
   * @returns 角色信息数组
   */
  listAgents(): AgentInfo[] {
    const config = this.load();

    return config.agents.list.map((agent) => ({
      id: agent.id,
      name: agent.name ?? agent.id,
      description: agent.description,
      default: agent.default,
      config: {
        agent: !!agent.agent,
        providers: !!agent.providers,
        channels: !!agent.channels,
        cronTasks: !!agent.cronTasks,
      },
    }));
  }

  /**
   * 获取默认角色 ID
   * @returns 默认角色 ID
   */
  getDefaultAgentId(): string {
    const config = this.load();

    // 查找标记为默认的角色
    const defaultAgent = config.agents.list.find((a) => a.default);
    if (defaultAgent) {
      return defaultAgent.id;
    }

    // 如果没有默认角色，返回第一个角色
    if (config.agents.list.length > 0) {
      return config.agents.list[0].id;
    }

    // 如果没有角色，返回空字符串
    return "";
  }

  /**
   * 检查角色是否存在
   * @param agentId 角色唯一标识符
   * @returns 角色是否存在
   */
  hasAgent(agentId: string): boolean {
    const config = this.load();
    return config.agents.list.some((a) => a.id === agentId);
  }

  /**
   * 清除配置缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 初始化 ProviderRegistry
   * @description 将配置中的提供商信息注册到 ProviderRegistry
   * @param agentId 角色ID（可选），如果不提供则使用全局配置
   */
  initializeProviders(agentId?: string): void {
    // 获取配置（角色特定配置或全局配置）
    const config = agentId ? this.getAgentConfig(agentId) : this.load();

    // 转换 ProviderConfig 为 LLMConfig 并注册
    const providerConfigs = config.providers || {};

    for (const [name, providerConfig] of Object.entries(providerConfigs)) {
      // 转换为 LLMConfig
      const llmConfig = this._convertToLLMConfig(providerConfig);

      // 设置到注册表
      this.registry.setProviderConfig(name, llmConfig);
    }

    // 标记已初始化
    this.providersInitialized = true;
  }

  /**
   * 获取提供商实例
   * @param name 提供商名称
   * @param agentId 角色ID（可选）
   * @returns 提供商实例
   */
  getProvider(name: string, agentId?: string): LLMProvider | undefined {
    // 确保已初始化
    if (!this.providersInitialized) {
      this.initializeProviders(agentId);
    }

    return this.registry.getProviderByName(name);
  }

  /**
   * 根据模型名获取提供商实例
   * @param model 模型名
   * @param agentId 角色ID（可选）
   * @returns 提供商实例
   */
  getProviderByModel(model: string, agentId?: string): LLMProvider | undefined {
    // 确保已初始化
    if (!this.providersInitialized) {
      this.initializeProviders(agentId);
    }

    return this.registry.getProvider(model);
  }

  /**
   * 获取默认提供商实例
   * @param agentId 角色ID（可选）
   * @returns 默认提供商实例
   */
  getDefaultProvider(agentId?: string): LLMProvider | undefined {
    // 确保已初始化
    if (!this.providersInitialized) {
      this.initializeProviders(agentId);
    }

    return this.registry.getDefaultProvider();
  }

  /**
   * 列出所有可用的提供商
   * @param agentId 角色ID（可选）
   * @returns 可用的提供商规格列表
   */
  listAvailableProviders(agentId?: string): ProviderSpec[] {
    // 确保已初始化
    if (!this.providersInitialized) {
      this.initializeProviders(agentId);
    }

    return this.registry.listAvailableProviders();
  }

  /**
   * 将 ProviderConfig 转换为 LLMConfig
   * @param providerConfig 提供商配置
   * @returns LLM 配置
   */
  private _convertToLLMConfig(providerConfig: ProviderConfig): LLMConfig {
    const { type, model, apiKey, apiBase, ...rest } = providerConfig;

    // 构建基础 LLMConfig
    const llmConfig: LLMConfig = {
      model,
    };

    // 添加可选字段
    if (apiKey) llmConfig.apiKey = apiKey;
    if (apiBase) llmConfig.apiBase = apiBase;

    // 添加其他参数
    if (rest.temperature !== undefined) llmConfig.temperature = rest.temperature;
    if (rest.maxTokens !== undefined) llmConfig.maxTokens = rest.maxTokens;
    if (rest.topP !== undefined) llmConfig.topP = rest.topP;
    if (rest.stopSequences) llmConfig.stopSequences = rest.stopSequences;
    if (rest.frequencyPenalty !== undefined) llmConfig.frequencyPenalty = rest.frequencyPenalty;
    if (rest.presencePenalty !== undefined) llmConfig.presencePenalty = rest.presencePenalty;
    if (rest.timeout !== undefined) llmConfig.timeout = rest.timeout;
    if (rest.extra) llmConfig.extra = rest.extra;

    return llmConfig;
  }

  /**
   * 重置 ProviderRegistry
   * @description 清除所有提供商实例和配置
   */
  resetProviders(): void {
    this.registry.reset();
    this.providersInitialized = false;
  }
}

// ============================================
// 导出默认实例
// ============================================

/**
 * 默认配置管理器实例
 */
export const configManager = new ConfigManager();
