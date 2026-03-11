/**
 * 配置合并器
 * 支持 defaults-with-overrides 模式的配置合并
 */

import type { NiumaConfig, AgentDefinition } from './schema'

// ============================================
// 常量定义
// ============================================

/**
 * 需要完全替换的字段（数组字段）
 */
const REPLACE_FIELDS = new Set<keyof NiumaConfig>([
  'channels',
  'cronTasks'
])

// ============================================
// 函数定义
// ============================================

/**
 * 深度合并两个对象
 * @param target 目标对象
 * @param source 源对象
 * @returns 合并后的对象
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Record<string, unknown>): T {
  const result: any = { ...target }

  for (const key in source) {
    const sourceValue = source[key]
    const targetValue = result[key]

    if (sourceValue === undefined) {
      continue
    }

    // 如果源值是对象且目标值也是对象，则递归合并
    if (typeof sourceValue === 'object' && sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' && targetValue !== null &&
        !Array.isArray(targetValue)) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      )
    } else {
      // 否则直接覆盖
      result[key] = sourceValue
    }
  }

  return result as T
}

/**
 * 合并全局配置和角色配置
 * @param globalConfig 全局配置
 * @param agentConfig 角色配置
 * @returns 合并后的配置
 */
export function mergeConfigs(
  globalConfig: NiumaConfig,
  agentConfig: AgentDefinition
): Partial<NiumaConfig> {
  const result: Partial<NiumaConfig> = {}

  // 复制所有全局配置
  Object.assign(result, globalConfig)

  // 合并 agent 配置（深度合并）
  if (agentConfig.agent) {
    const merged = deepMerge(result.agent as any, agentConfig.agent as any)
    result.agent = merged as any
  }

  // 合并 providers 配置（深度合并）
  if (agentConfig.providers) {
    const merged = deepMerge(result.providers as any, agentConfig.providers as any)
    result.providers = merged as any
  }

  // 合并 channels 配置（完全替换）
  if (agentConfig.channels !== undefined) {
    result.channels = agentConfig.channels
  }

  // 合并 cronTasks 配置（完全替换）
  if (agentConfig.cronTasks !== undefined) {
    result.cronTasks = agentConfig.cronTasks
  }

  // 合并 debug 配置（直接覆盖）
  if (agentConfig.debug !== undefined) {
    result.debug = agentConfig.debug
  }

  // 合并 logLevel 配置（直接覆盖）
  if (agentConfig.logLevel !== undefined) {
    result.logLevel = agentConfig.logLevel
  }

  // 合并 workspaceDir 配置（直接覆盖）
  if (agentConfig.workspaceDir !== undefined) {
    result.workspaceDir = agentConfig.workspaceDir
  }

  return result
}

/**
 * 合并多个配置对象（通用函数）
 * @param configs 配置对象数组
 * @returns 合并后的配置
 */
export function mergeMultipleConfigs<T extends Record<string, unknown>>(...configs: Partial<T>[]): T {
  return configs.reduce((result: any, config) => {
    return deepMerge(result, config)
  }, {} as T)
}