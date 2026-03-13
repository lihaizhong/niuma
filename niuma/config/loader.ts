/**
 * 配置加载器
 * 支持多角色配置，向后兼容旧的 API
 */

import { resolve } from 'node:path'
import type { NiumaConfig } from './schema'
import { ConfigManager } from './manager'

// 全局配置管理器实例
let configManager: ConfigManager | null = null

/**
 * 加载配置文件（向后兼容的旧 API）
 * @param configPath 配置文件路径，默认为 ~/.niuma/niuma.config.json
 * @returns 配置对象
 */
export function loadConfig(configPath?: string): NiumaConfig {
  const manager = getConfigManager(configPath)
  return manager.load()
}

/**
 * 加载角色配置（新 API）
 * @param agentId 角色唯一标识符
 * @param configPath 配置文件路径，默认为 ~/.niuma/niuma.config.json
 * @returns 角色配置对象
 */
export function loadAgentConfig(agentId: string, configPath?: string): NiumaConfig {
  const manager = getConfigManager(configPath)
  return manager.getAgentConfig(agentId)
}

/**
 * 获取工作目录绝对路径
 * @param config 配置对象或角色 ID
 */
export function getWorkspaceDir(config: NiumaConfig | string): string {
  if (typeof config === 'string') {
    // 如果是角色 ID，使用 ConfigManager
    const manager = getConfigManager()
    return manager.getAgentWorkspaceDir(config)
  }
  
  // 向后兼容：如果是配置对象，直接使用 workspaceDir
  return resolve(config.workspaceDir)
}

/**
 * 获取角色会话存储路径
 * @param agentId 角色唯一标识符
 * @param configPath 配置文件路径
 */
export function getSessionDir(agentId: string, configPath?: string): string {
  const manager = getConfigManager(configPath)
  return manager.getAgentSessionDir(agentId)
}

/**
 * 获取角色日志路径
 * @param agentId 角色唯一标识符
 * @param configPath 配置文件路径
 */
export function getLogPath(agentId: string, configPath?: string): string {
  const manager = getConfigManager(configPath)
  return manager.getAgentLogPath(agentId)
}

/**
 * 列出所有角色
 * @param configPath 配置文件路径
 */
export function listAgents(configPath?: string) {
  const manager = getConfigManager(configPath)
  return manager.listAgents()
}

/**
 * 获取默认角色 ID
 * @param configPath 配置文件路径
 */
export function getDefaultAgentId(configPath?: string): string {
  const manager = getConfigManager(configPath)
  return manager.getDefaultAgentId()
}

/**
 * 获取或创建配置管理器实例
 * @param configPath 配置文件路径
 */
function getConfigManager(configPath?: string): ConfigManager {
  if (!configManager) {
    configManager = new ConfigManager(configPath)
  }
  return configManager
}

/**
 * 重置配置管理器（主要用于测试）
 */
export function resetConfigManager(): void {
  configManager = null
}