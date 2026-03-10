/**
 * 工具注册中心 - 管理和执行工具
 */

import type { OpenAIToolSchema } from '../../types'
import type { ITool } from './base'

const ERROR_HINT = '\n\n[分析上述错误并尝试其他方式。]'

/**
 * 工具注册中心
 * 参考 nanobot 的简洁设计
 */
export class ToolRegistry {
  private tools: Map<string, ITool> = new Map()

  /**
   * 注册工具
   */
  register(tool: ITool): this {
    this.tools.set(tool.name, tool)
    return this
  }

  /**
   * 注销工具
   */
  unregister(name: string): void {
    this.tools.delete(name)
  }

  /**
   * 获取工具
   */
  get(name: string): ITool | undefined {
    return this.tools.get(name)
  }

  /**
   * 检查工具是否已注册
   */
  has(name: string): boolean {
    return this.tools.has(name)
  }

  /**
   * 获取所有工具名称
   */
  get toolNames(): string[] {
    return Array.from(this.tools.keys())
  }

  /**
   * 获取所有工具的 OpenAI Schema
   */
  getDefinitions(): OpenAIToolSchema[] {
    return Array.from(this.tools.values()).map((tool) => tool.toSchema())
  }

  /**
   * 执行工具
   * @param name 工具名称
   * @param params 参数
   * @returns 执行结果字符串（错误信息也包含在字符串中）
   */
  async execute(name: string, params: Record<string, unknown>): Promise<string> {
    const tool = this.tools.get(name)

    if (!tool) {
      return `错误: 工具 "${name}" 未找到。可用工具: ${this.toolNames.join(', ')}`
    }

    try {
      const validatedArgs = tool.validateArgs(params)
      const result = await tool.execute(validatedArgs)

      // 如果结果本身就是错误消息，添加提示
      if (typeof result === 'string' && result.startsWith('错误')) {
        return result + ERROR_HINT
      }

      return typeof result === 'string' ? result : JSON.stringify(result, null, 2)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return `执行 ${name} 时出错: ${message}${ERROR_HINT}`
    }
  }

  /**
   * 获取注册工具数量
   */
  get size(): number {
    return this.tools.size
  }
}
