/**
 * 配置管理器
 * 整合 JSON5 加载、环境变量解析、配置合并和验证
 */

import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { json5ConfigLoader } from './json5-loader'
import { resolveEnvVarsWithEnvFile } from './env-resolver'
import { mergeConfigs } from './merger'
import {
  NiumaConfig,
  StrictNiumaConfigSchema,
  AgentDefinition
} from './schema'

// ============================================
// 接口定义
// ============================================

/**
 * 角色信息
 */
export interface AgentInfo {
  /** 角色唯一标识符 */
  id: string
  /** 角色显示名称 */
  name: string
  /** 角色描述 */
  description?: string
  /** 是否为默认角色 */
  default: boolean
  /** 配置摘要 */
  config: {
    /** Agent 配置是否有覆盖 */
    agent: boolean
    /** 提供商配置是否有覆盖 */
    providers: boolean
    /** 渠道配置是否有覆盖 */
    channels: boolean
    /** 定时任务配置是否有覆盖 */
    cronTasks: boolean
  }
}

// ============================================
// ConfigManager 类
// ============================================

/**
 * 配置管理器
 */
export class ConfigManager {
  private configPath: string
  private envPath: string
  private config: NiumaConfig | null = null
  private cache: Map<string, Partial<NiumaConfig>> = new Map()

  constructor(configPath?: string, envPath?: string) {
    this.configPath = configPath ?? join(homedir(), '.niuma', 'niuma.json')
    this.envPath = envPath ?? join(homedir(), '.niuma', '.env')
  }

  /**
   * 加载并解析配置文件
   * @param force 是否强制重新加载
   * @returns 验证后的配置对象
   */
  load(force: boolean = false): NiumaConfig {
    // 如果已缓存且不强制重新加载，返回缓存
    if (this.config && !force) {
      return this.config
    }

    // 1. 加载 JSON5 配置文件
    const rawConfig = json5ConfigLoader.load(this.configPath)

    // 2. 解析环境变量引用
    const resolvedConfig = resolveEnvVarsWithEnvFile(rawConfig, this.configPath, false)

    // 3. 使用严格模式验证配置
    try {
      this.config = StrictNiumaConfigSchema.parse(resolvedConfig)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `配置验证失败: ${this.configPath}\n${error.message}`,
          { cause: error }
        )
      }
      throw error
    }

    // 清除角色配置缓存
    this.cache.clear()

    return this.config
  }

  /**
   * 获取角色配置（合并全局默认配置和角色特定配置）
   * @param agentId 角色唯一标识符
   * @returns 合并后的角色配置
   */
  getAgentConfig(agentId: string): NiumaConfig {
    const config = this.load()

    // 查找角色定义
    const agent = config.agents.list.find(a => a.id === agentId)
    if (!agent) {
      throw new Error(`角色 ${agentId} 不存在`)
    }

    // 检查缓存
    if (this.cache.has(agentId)) {
      return { ...config, ...this.cache.get(agentId)! } as NiumaConfig
    }

    // 合并全局默认配置和角色特定配置
    const mergedConfig = mergeConfigs(config, agent)

    // 缓存合并后的配置
    this.cache.set(agentId, mergedConfig)

    // 返回完整配置（包含 agents 字段）
    return { ...config, ...mergedConfig } as NiumaConfig
  }

  /**
   * 获取角色工作区路径
   * @param agentId 角色唯一标识符
   * @returns 工作区绝对路径
   */
  getAgentWorkspaceDir(agentId: string): string {
    const config = this.load()

    // 查找角色定义
    const agent = config.agents.list.find(a => a.id === agentId)
    if (!agent) {
      throw new Error(`角色 ${agentId} 不存在`)
    }

    // 如果角色配置中指定了 workspaceDir，使用它
    if (agent.workspaceDir) {
      mkdirSync(agent.workspaceDir, { recursive: true })
      return agent.workspaceDir
    }

    // 否则使用默认路径：~/.niuma/agents/{agentId}/workspace
    const defaultWorkspaceDir = join(homedir(), '.niuma', 'agents', agentId, 'workspace')

    // 确保目录存在
    mkdirSync(defaultWorkspaceDir, { recursive: true })

    return defaultWorkspaceDir
  }

  /**
   * 获取角色日志路径
   * @param agentId 角色唯一标识符
   * @returns 日志文件绝对路径
   */
  getAgentLogPath(agentId: string): string {
    return join(homedir(), '.niuma', 'logs', `${agentId}.log`)
  }

  /**
   * 获取角色会话存储路径
   * @param agentId 角色唯一标识符
   * @returns 会话存储目录绝对路径
   */
  getAgentSessionDir(agentId: string): string {
    const sessionDir = join(homedir(), '.niuma', 'sessions', agentId)

    // 确保目录存在
    mkdirSync(sessionDir, { recursive: true })

    return sessionDir
  }

  /**
   * 列出所有角色
   * @returns 角色信息数组
   */
  listAgents(): AgentInfo[] {
    const config = this.load()

    return config.agents.list.map(agent => ({
      id: agent.id,
      name: agent.name ?? agent.id,
      description: agent.description,
      default: agent.default,
      config: {
        agent: !!agent.agent,
        providers: !!agent.providers,
        channels: !!agent.channels,
        cronTasks: !!agent.cronTasks
      }
    }))
  }

  /**
   * 获取默认角色 ID
   * @returns 默认角色 ID
   */
  getDefaultAgentId(): string {
    const config = this.load()

    // 查找标记为默认的角色
    const defaultAgent = config.agents.list.find(a => a.default)
    if (defaultAgent) {
      return defaultAgent.id
    }

    // 如果没有默认角色，返回第一个角色
    if (config.agents.list.length > 0) {
      return config.agents.list[0].id
    }

    // 如果没有角色，返回空字符串
    return ''
  }

  /**
   * 检查角色是否存在
   * @param agentId 角色唯一标识符
   * @returns 角色是否存在
   */
  hasAgent(agentId: string): boolean {
    const config = this.load()
    return config.agents.list.some(a => a.id === agentId)
  }

  /**
   * 清除配置缓存
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// ============================================
// 导出默认实例
// ============================================

/**
 * 默认配置管理器实例
 */
export const configManager = new ConfigManager()