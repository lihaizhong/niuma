/**
 * 环境变量解析器
 * 支持在配置文件中引用环境变量，使用 ${VAR} 和 ${VAR:default} 语法
 */

import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import type { EnvVarResolverOptions } from './schema'

// ============================================
// 函数定义
// ============================================

/**
 * 从 .env 文件加载环境变量
 * @param envPath .env 文件路径
 * @returns 环境变量对象
 */
export function loadEnvFile(envPath: string): Record<string, string> {
  if (!existsSync(envPath)) {
    return {}
  }

  try {
    const content = readFileSync(envPath, 'utf-8')
    const env: Record<string, string> = {}

    for (const line of content.split('\n')) {
      const trimmedLine = line.trim()
      // 跳过空行和注释
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue
      }

      // 解析 KEY=VALUE 格式
      const match = trimmedLine.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        let value = match[2].trim()

        // 移除引号
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }

        env[key] = value
      }
    }

    return env
  } catch (error) {
    console.warn(`加载 .env 文件失败: ${envPath}`)
    return {}
  }
}

/**
 * 解析单个字符串中的环境变量引用
 * @param value 字符串值
 * @param env 环境变量对象
 * @param strict 是否严格模式
 * @returns 解析后的字符串
 */
function resolveStringValue(value: string, env: Record<string, string>, strict: boolean): string {
  // 匹配 ${VAR} 或 ${VAR:default} 语法
  return value.replace(/\$\{(\w+)(?::([^}]*))?\}/g, (_, varName, defaultValue) => {
    // 优先从 env 对象查找，其次从 process.env 查找
    const envValue = env[varName] ?? process.env[varName]

    if (envValue !== undefined) {
      return envValue
    }

    if (defaultValue !== undefined) {
      return defaultValue
    }

    if (strict) {
      throw new Error(`环境变量 ${varName} 未定义`)
    }

    // 非严格模式，保持原样
    return `\${${varName}}`
  })
}

/**
 * 递归解析对象中的环境变量引用
 * @param obj 待解析的对象
 * @param env 环境变量对象
 * @param strict 是否严格模式
 * @returns 解析后的对象
 */
function resolveObject(obj: Record<string, unknown>, env: Record<string, string>, strict: boolean): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    result[key] = resolveValue(value, env, strict)
  }

  return result
}

/**
 * 递归解析数组中的环境变量引用
 * @param arr 待解析的数组
 * @param env 环境变量对象
 * @param strict 是否严格模式
 * @returns 解析后的数组
 */
function resolveArray(arr: unknown[], env: Record<string, string>, strict: boolean): unknown[] {
  return arr.map(item => resolveValue(item, env, strict))
}

/**
 * 递归解析值中的环境变量引用
 * @param value 待解析的值
 * @param env 环境变量对象
 * @param strict 是否严格模式
 * @returns 解析后的值
 */
function resolveValue(value: unknown, env: Record<string, string>, strict: boolean): unknown {
  if (typeof value === 'string') {
    return resolveStringValue(value, env, strict)
  }

  if (Array.isArray(value)) {
    return resolveArray(value, env, strict)
  }

  if (typeof value === 'object' && value !== null) {
    return resolveObject(value as Record<string, unknown>, env, strict)
  }

  return value
}

/**
 * 解析配置对象中的环境变量引用
 * @param config 配置对象
 * @param options 解析选项
 * @returns 解析后的配置对象
 */
export function resolveEnvVars<T = unknown>(config: T, options: EnvVarResolverOptions): T {
  const { strict = false, env: customEnv } = options

  // 合并环境变量：自定义环境变量 > .env 文件 > 系统环境变量
  const env: Record<string, string> = {
    ...(process.env as Record<string, string>),
    ...customEnv
  }

  return resolveValue(config, env, strict) as T
}

/**
 * 自动查找并加载 .env 文件
 * @param configPath 配置文件路径
 * @returns 环境变量对象
 */
export function loadEnvFromFile(configPath: string): Record<string, string> {
  const configDir = dirname(configPath)
  const envPath = join(configDir, '.env')

  return loadEnvFile(envPath)
}

/**
 * 解析配置并自动加载 .env 文件
 * @param config 配置对象
 * @param configPath 配置文件路径
 * @param strict 是否严格模式
 * @returns 解析后的配置对象
 */
export function resolveEnvVarsWithEnvFile<T = unknown>(
  config: T,
  configPath: string,
  strict: boolean = false
): T {
  const env = loadEnvFromFile(configPath)
  return resolveEnvVars(config, { strict, env })
}