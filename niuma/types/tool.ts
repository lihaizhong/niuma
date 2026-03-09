/**
 * LLM 函数调用工具类型定义
 */

import type { z } from 'zod'

/**
 * 工具参数 Schema 定义（JSON Schema 格式）
 */
export interface ToolParameterSchema {
  /** 参数类型 */
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null'
  /** 参数描述 */
  description?: string
  /** 枚举值（如果适用） */
  enum?: string[]
  /** 对象属性（当 type 为 'object' 时） */
  properties?: Record<string, ToolParameterSchema>
  /** 必需属性名列表（当 type 为 'object' 时） */
  required?: string[]
  /** 数组元素 Schema（当 type 为 'array' 时） */
  items?: ToolParameterSchema
  /** 默认值 */
  default?: unknown
}

/**
 * 工具定义（用于 LLM 函数调用）
 */
export interface ToolDefinition {
  /** 工具名称（唯一标识符） */
  name: string
  /** 工具描述（供 LLM 理解用途） */
  description: string
  /** 参数 Schema（JSON Schema 格式或 Zod Schema） */
  parameters: ToolParameterSchema | z.ZodType<unknown>
  /** 是否为危险工具（需谨慎使用） */
  dangerous?: boolean
  /** 工具分类 */
  category?: string
  /** 工具别名 */
  aliases?: string[]
}

/**
 * LLM 请求的工具调用
 */
export interface ToolCall {
  /** 工具调用唯一标识符 */
  id: string
  /** 要执行的工具名称 */
  name: string
  /** 传递给工具的参数 */
  arguments: Record<string, unknown>
}

/**
 * 工具执行结果
 */
export interface ToolResult {
  /** 对应的工具调用 ID */
  toolCallId: string
  /** 执行的工具名称 */
  toolName: string
  /** 执行是否成功 */
  success: boolean
  /** 结果内容（字符串或结构化数据） */
  content: string
  /** 执行失败的错误信息 */
  error?: string
  /** 执行耗时（毫秒） */
  duration?: number
}

/**
 * OpenAI 兼容的工具 Schema
 */
export interface OpenAIToolSchema {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, ToolParameterSchema>
      required?: string[]
    }
  }
}

/**
 * Anthropic 兼容的工具 Schema
 */
export interface AnthropicToolSchema {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, ToolParameterSchema>
    required?: string[]
  }
}