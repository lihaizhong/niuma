/**
 * 配置加载器
 */

import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import type { NiumaConfig } from './schema'
import { NiumaConfigSchema } from './schema'

/** 配置文件名称 */
const CONFIG_FILE = 'config.json'

/**
 * 加载配置文件
 * @param configPath 配置文件路径，默认为当前目录的 config.json
 */
export function loadConfig(configPath?: string): NiumaConfig {
  const path = configPath ?? resolve(CONFIG_FILE)
  
  if (!existsSync(path)) {
    return NiumaConfigSchema.parse({})
  }
  
  try {
    const content = readFileSync(path, 'utf-8')
    const config = JSON.parse(content)
    return NiumaConfigSchema.parse(config)
  } catch (error) {
    throw new Error(
      `加载配置文件失败: ${path}\n${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * 获取工作目录绝对路径
 */
export function getWorkspaceDir(config: NiumaConfig): string {
  return resolve(config.workspaceDir)
}