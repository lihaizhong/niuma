/**
 * 工具框架基类和接口
 */

import { z } from 'zod'
import type { ToolParameterSchema, ToolDefinition } from '../../types'

// 便捷重导出 ToolDefinition
export type { ToolDefinition }

// ============================================
// ITool 接口
// ============================================

/**
 * 所有工具必须实现的接口
 */
export interface ITool<TInput = unknown, TOutput = string> {
  /** 工具名称（唯一标识符） */
  readonly name: string
  /** 工具描述（供 LLM 理解用途） */
  readonly description: string
  /** 参数 Schema（Zod 类型） */
  readonly parameters: z.ZodType<TInput>
  /** 是否为危险工具 */
  readonly dangerous?: boolean
  /** 工具分类 */
  readonly category?: string
  /** 工具别名 */
  readonly aliases?: string[]

  /**
   * 获取工具定义（用于 LLM 函数调用）
   */
  getDefinition(): ToolDefinition

  /**
   * 验证输入参数
   */
  validateArgs(args: unknown): TInput

  /**
   * 执行工具
   */
  execute(args: TInput): Promise<TOutput>
}

// ============================================
// Zod 到 JSON Schema 转换
// ============================================

/**
 * 将 Zod 类型转换为 JSON Schema 参数格式
 * 使用 Zod v4 内置的 toJSONSchema 方法
 */
export function zodToParameter(zodType: z.ZodType<unknown>): ToolParameterSchema {
  const jsonSchema = z.toJSONSchema(zodType)
  
  // 移除 $schema 和 additionalProperties 字段（LLM 不需要）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { $schema, additionalProperties, ...result } = jsonSchema as Record<string, unknown>
  
  return result as ToolParameterSchema
}

// ============================================
// BaseTool 抽象类
// ============================================

/**
 * 工具抽象基类
 */
export abstract class BaseTool<TInput = unknown, TOutput = string>
  implements ITool<TInput, TOutput>
{
  abstract readonly name: string
  abstract readonly description: string
  abstract readonly parameters: z.ZodType<TInput>

  readonly dangerous?: boolean
  readonly category?: string
  readonly aliases?: string[]

  /**
   * 获取工具定义（用于 LLM 函数调用）
   */
  getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: zodToParameter(this.parameters),
      dangerous: this.dangerous,
      category: this.category,
      aliases: this.aliases,
    }
  }

  /**
   * 验证输入参数
   */
  validateArgs(args: unknown): TInput {
    const result = this.parameters.safeParse(args)
    if (!result.success) {
      throw new Error(
        `工具 "${this.name}" 参数无效: ${result.error?.message || '验证失败'}`
      )
    }
    return result.data as TInput
  }

  /**
   * 执行工具（必须由子类实现）
   */
  abstract execute(args: TInput): Promise<TOutput>
}

// ============================================
// SimpleTool 类
// ============================================

/**
 * 基于函数的简单工具实现
 */
export class SimpleTool<TInput = unknown, TOutput = string> extends BaseTool<
  TInput,
  TOutput
> {
  readonly name: string
  readonly description: string
  readonly parameters: z.ZodType<TInput>
  readonly dangerous?: boolean
  readonly category?: string
  readonly aliases?: string[]

  private readonly handler: (args: TInput) => Promise<TOutput>

  constructor(options: {
    name: string
    description: string
    parameters: z.ZodType<TInput>
    handler: (args: TInput) => Promise<TOutput>
    dangerous?: boolean
    category?: string
    aliases?: string[]
  }) {
    super()
    this.name = options.name
    this.description = options.description
    this.parameters = options.parameters
    this.handler = options.handler
    this.dangerous = options.dangerous
    this.category = options.category
    this.aliases = options.aliases
  }

  async execute(args: TInput): Promise<TOutput> {
    return this.handler(args)
  }
}