/**
 * JSON5 配置加载器
 * 支持加载 JSON5 和 JSON 格式的配置文件
 */

import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { homedir } from 'node:os'
import JSON5 from 'json5'

// ============================================
// 接口定义
// ============================================

/**
 * JSON5 配置加载器接口
 */
export interface JSON5ConfigLoader {
  /**
   * 加载并解析 JSON5 配置文件
   * @param configPath 配置文件路径（可选，默认为 ~/.niuma/niuma.json）
   * @returns 解析后的配置对象
   * @throws 配置文件不存在或解析失败时抛出错误
   */
  load(configPath?: string): unknown

  /**
   * 检查配置文件是否存在
   * @param configPath 配置文件路径
   * @returns 文件是否存在
   */
  exists(configPath: string): boolean
}

// ============================================
// 实现类
// ============================================

/**
 * JSON5 配置加载器实现
 */
export class JSON5ConfigLoaderImpl implements JSON5ConfigLoader {
  private readonly defaultConfigPath: string

  constructor() {
    this.defaultConfigPath = join(homedir(), '.niuma', 'niuma.json')
  }

  /**
   * 加载并解析 JSON5 配置文件
   */
  load(configPath?: string): unknown {
    const path = configPath ?? this.defaultConfigPath

    // 如果文件不存在，返回空对象
    if (!this.exists(path)) {
      return {}
    }

    try {
      const content = readFileSync(path, 'utf-8')
      return JSON5.parse(content)
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(
          `配置文件解析失败: ${path}\n语法错误: ${error.message}\n位置: ${error.stack}`,
          { cause: error }
        )
      }
      throw new Error(
        `配置文件加载失败: ${path}\n${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      )
    }
  }

  /**
   * 检查配置文件是否存在
   */
  exists(configPath: string): boolean {
    return existsSync(configPath)
  }

  /**
   * 获取默认配置文件路径
   */
  getDefaultConfigPath(): string {
    return this.defaultConfigPath
  }
}

// ============================================
// 导出默认实例
// ============================================

export const json5ConfigLoader = new JSON5ConfigLoaderImpl()
