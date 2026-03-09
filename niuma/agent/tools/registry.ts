/**
 * 工具注册中心 - 管理和执行工具
 */

import { z } from 'zod'
import type { ToolCall, ToolResult, OpenAIToolSchema, AnthropicToolSchema } from '../../types'
import type { ITool, ToolDefinition } from './base'
import { zodToParameter } from './base'

// ============================================
// ToolRegistry 类
// ============================================

/**
 * 工具注册中心
 */
export class ToolRegistry {
  private tools: Map<string, ITool> = new Map()
  private categories: Map<string, Set<string>> = new Map()
  private aliases: Map<string, string> = new Map()
  private dangerousTools: Set<string> = new Set()

  /**
   * 注册工具
   */
  register(tool: ITool): this {
    if (this.tools.has(tool.name)) {
      throw new Error(`工具 "${tool.name}" 已注册`)
    }

    this.tools.set(tool.name, tool)

    // 注册危险工具
    if (tool.dangerous) {
      this.dangerousTools.add(tool.name)
    }

    // 注册分类
    if (tool.category) {
      this.addToCategory(tool.name, tool.category)
    }

    // 注册别名
    if (tool.aliases) {
      for (const alias of tool.aliases) {
        this.addAlias(alias, tool.name)
      }
    }

    return this
  }

  /**
   * 批量注册工具
   */
  registerAll(tools: ITool[]): this {
    for (const tool of tools) {
      this.register(tool)
    }
    return this
  }

  /**
   * 注销工具
   */
  unregister(name: string): boolean {
    const tool = this.tools.get(name)
    if (!tool) {
      return false
    }

    this.tools.delete(name)
    this.dangerousTools.delete(name)

    // 从分类中移除
    for (const [category, tools] of this.categories) {
      tools.delete(name)
      if (tools.size === 0) {
        this.categories.delete(category)
      }
    }

    // 移除别名
    for (const [alias, targetName] of this.aliases) {
      if (targetName === name) {
        this.aliases.delete(alias)
      }
    }

    return true
  }

  /**
   * 通过名称或别名获取工具
   */
  get(name: string): ITool | undefined {
    // 先检查直接名称
    const tool = this.tools.get(name)
    if (tool) {
      return tool
    }
    // 检查别名
    const aliasedName = this.aliases.get(name)
    if (aliasedName) {
      return this.tools.get(aliasedName)
    }
    return undefined
  }

  /**
   * 检查工具是否已注册
   */
  has(name: string): boolean {
    return this.tools.has(name) || this.aliases.has(name)
  }

  /**
   * 获取所有已注册的工具名称
   */
  getNames(): string[] {
    return Array.from(this.tools.keys())
  }

  /**
   * 获取所有工具
   */
  getAll(): ITool[] {
    return Array.from(this.tools.values())
  }

  /**
   * 获取所有工具定义
   */
  getDefinitions(): ToolDefinition[] {
    return this.getAll().map((tool) => tool.getDefinition())
  }

  /**
   * 执行工具
   */
  async execute(toolCall: ToolCall): Promise<ToolResult> {
    const { id, name, arguments: args } = toolCall
    const tool = this.get(name)

    if (!tool) {
      return {
        toolCallId: id,
        toolName: name,
        success: false,
        content: '',
        error: `工具 "${name}" 未找到`,
      }
    }

    const startTime = Date.now()

    try {
      // 验证参数
      const validatedArgs = tool.validateArgs(args)

      // 执行工具
      const result = await tool.execute(validatedArgs)
      const duration = Date.now() - startTime

      return {
        toolCallId: id,
        toolName: name,
        success: true,
        content: typeof result === 'string' ? result : JSON.stringify(result),
        duration,
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage =
        error instanceof Error ? error.message : String(error)

      return {
        toolCallId: id,
        toolName: name,
        success: false,
        content: '',
        error: errorMessage,
        duration,
      }
    }
  }

  /**
   * 批量执行工具调用
   */
  async executeAll(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    return Promise.all(toolCalls.map((call) => this.execute(call)))
  }

  /**
   * 生成 OpenAI 兼容的工具 Schema
   */
  generateOpenAISchema(): OpenAIToolSchema[] {
    return this.getAll().map((tool) => {
      const def = tool.getDefinition()
      const params =
        def.parameters instanceof z.ZodType
          ? zodToParameter(def.parameters as z.ZodType<unknown>)
          : def.parameters

      // 确保参数为 object 类型
      const parameters =
        params.type === 'object'
          ? params
          : {
              type: 'object' as const,
              properties: {
                value: params,
              },
            }

      return {
        type: 'function' as const,
        function: {
          name: def.name,
          description: def.description,
          parameters: {
            type: 'object',
            properties: parameters.properties || {},
            required: parameters.required,
          },
        },
      }
    })
  }

  /**
   * 生成 Anthropic 兼容的工具 Schema
   */
  generateAnthropicSchema(): AnthropicToolSchema[] {
    return this.getAll().map((tool) => {
      const def = tool.getDefinition()
      const params =
        def.parameters instanceof z.ZodType
          ? zodToParameter(def.parameters as z.ZodType<unknown>)
          : def.parameters

      // 确保参数为 object 类型
      const parameters =
        params.type === 'object'
          ? params
          : {
              type: 'object' as const,
              properties: {
                value: params,
              },
            }

      return {
        name: def.name,
        description: def.description,
        input_schema: {
          type: 'object',
          properties: parameters.properties || {},
          required: parameters.required,
        },
      }
    })
  }

  // ============================================
  // 分类支持
  // ============================================

  /**
   * 为工具添加别名
   */
  addAlias(alias: string, toolName: string): this {
    if (this.aliases.has(alias)) {
      throw new Error(`别名 "${alias}" 已被使用`)
    }
    if (!this.tools.has(toolName)) {
      throw new Error(`工具 "${toolName}" 未找到`)
    }
    this.aliases.set(alias, toolName)
    return this
  }

  /**
   * 将工具添加到分类
   */
  addToCategory(toolName: string, category: string): this {
    if (!this.tools.has(toolName)) {
      throw new Error(`工具 "${toolName}" 未找到`)
    }

    if (!this.categories.has(category)) {
      this.categories.set(category, new Set())
    }
    this.categories.get(category)!.add(toolName)
    return this
  }

  /**
   * 通过分类获取工具
   */
  getByCategory(category: string): ITool[] {
    const toolNames = this.categories.get(category)
    if (!toolNames) {
      return []
    }
    return Array.from(toolNames)
      .map((name) => this.tools.get(name))
      .filter((tool): tool is ITool => tool !== undefined)
  }

  /**
   * 获取所有分类
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys())
  }

  // ============================================
  // 危险工具支持
  // ============================================

  /**
   * 获取所有危险工具名称
   */
  getDangerousTools(): string[] {
    return Array.from(this.dangerousTools)
  }

  /**
   * 检查工具是否为危险工具
   */
  isDangerous(name: string): boolean {
    const tool = this.get(name)
    return tool?.dangerous ?? false
  }

  // ============================================
  // 工具方法
  // ============================================

  /**
   * 清除所有已注册的工具
   */
  clear(): void {
    this.tools.clear()
    this.categories.clear()
    this.aliases.clear()
    this.dangerousTools.clear()
  }

  /**
   * 获取注册工具数量
   */
  get size(): number {
    return this.tools.size
  }
}