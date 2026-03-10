/**
 * LLM 函数调用工具类型定义
 */

import type { z } from 'zod'

/**
 * 工具参数 Schema 定义（JSON Schema 格式）
 */
export interface ToolParameterSchema {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null'
  description?: string
  enum?: string[]
  properties?: Record<string, ToolParameterSchema>
  required?: string[]
  items?: ToolParameterSchema
  default?: unknown
}

/**
 * 工具定义（用于 LLM 函数调用）
 */
export interface ToolDefinition {
  name: string
  description: string
  parameters: ToolParameterSchema | z.ZodType<unknown>
}

/**
 * LLM 请求的工具调用
 */
export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
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
