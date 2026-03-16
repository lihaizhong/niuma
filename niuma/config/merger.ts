/**
 * 配置合并器
 * 支持 defaults-with-overrides 模式的配置合并
 */

import deepmerge from "deepmerge";

import type {
  NiumaConfig,
  AgentDefinition,
  AgentConfig,
  ProviderConfig,
} from "./schema";

// ============================================
// 常量定义
// ============================================

// ============================================
// 函数定义
// ============================================

/**
 * 合并全局配置和角色配置
 * @param globalConfig 全局配置
 * @param agentConfig 角色配置
 * @returns 合并后的配置
 */
export function mergeConfigs(
  globalConfig: NiumaConfig,
  agentConfig: AgentDefinition,
): Partial<NiumaConfig> {
  const result: Partial<NiumaConfig> = {};

  // 复制所有全局配置
  Object.assign(result, globalConfig);

  // 合并 agent 配置（深度合并）
  if (agentConfig.agent) {
    result.agent = deepmerge(
      globalConfig.agent as Record<string, unknown>,
      agentConfig.agent as Record<string, unknown>,
    ) as AgentConfig;
  }

  // 合并 providers 配置（深度合并）
  if (agentConfig.providers) {
    result.providers = deepmerge(
      globalConfig.providers as Record<string, unknown>,
      agentConfig.providers as Record<string, unknown>,
    ) as Record<string, ProviderConfig>;
  }

  // 合并 channels 配置（完全替换）
  if (agentConfig.channels !== undefined) {
    result.channels = {
      enabled: agentConfig.channels.map(c => c.type),
      defaults: result.channels?.defaults || { timeout: 30000, retryAttempts: 3 },
      channels: agentConfig.channels,
    };
  }

  // 合并 cronTasks 配置（完全替换）
  if (agentConfig.cronTasks !== undefined) {
    result.cronTasks = agentConfig.cronTasks;
  }

  // 合并 debug 配置（直接覆盖）
  if (agentConfig.debug !== undefined) {
    result.debug = agentConfig.debug;
  }

  // 合并 logLevel 配置（直接覆盖）
  if (agentConfig.logLevel !== undefined) {
    result.logLevel = agentConfig.logLevel;
  }

  // 合并 workspaceDir 配置（直接覆盖）
  if (agentConfig.workspaceDir !== undefined) {
    result.workspaceDir = agentConfig.workspaceDir;
  }

  return result;
}

/**
 * 合并多个配置对象（通用函数）
 * @param configs 配置对象数组
 * @returns 合并后的配置
 */
export function mergeMultipleConfigs<T extends Record<string, unknown>>(
  ...configs: Partial<T>[]
): T {
  return configs.reduce<T>((result, config) => {
    return deepmerge(result, config);
  }, {} as T);
}
