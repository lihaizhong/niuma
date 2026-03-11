/**
 * LLM 提供商抽象层类型定义
 */

import type { ToolCall, ToolDefinition } from './tool'

/**
 * LLM 使用统计
 */
export interface LLMUsage {
  /** 输入 token 数量 */
  inputTokens: number
  /** 输出 token 数量 */
  outputTokens: number
  /** 总 token 数量 */
  totalTokens: number
}

/**
 * LLM 配置
 */
export interface LLMConfig {
  /** 模型标识符 */
  model: string
  /** API 密钥（可通过环境变量设置） */
  apiKey?: string
  /** API 基础 URL */
  apiBase?: string
  /** 采样温度（0-2） */
  temperature?: number
  /** 最大生成 token 数 */
  maxTokens?: number
  /** Top-p 采样参数 */
  topP?: number
  /** 停止序列 */
  stopSequences?: string[]
  /** 频率惩罚（-2.0 到 2.0） */
  frequencyPenalty?: number
  /** 存在惩罚（-2.0 到 2.0） */
  presencePenalty?: number
  /** 请求超时时间（毫秒） */
  timeout?: number
  /** 其他提供商特定选项 */
  extra?: Record<string, unknown>
}

/**
 * 聊天消息角色
 */
export type ChatRole = 'system' | 'user' | 'assistant' | 'tool'

/**
 * 多部分消息内容（用于图片等）
 */
export interface MessageContentPart {
  /** 内容类型 */
  type: 'text' | 'image_url'
  /** 文本内容（type=text 时） */
  text?: string
  /** 图片 URL（type=image_url 时） */
  image_url?: {
    url: string
    detail?: 'auto' | 'low' | 'high'
  }
}

/**
 * 对话历史的聊天消息
 */
export interface ChatMessage {
  /** 消息角色 */
  role: ChatRole
  /** 消息内容（字符串或多部分内容） */
  content: string | MessageContentPart[]
  /** 工具消息的名称 */
  name?: string
  /** 工具消息的调用 ID */
  toolCallId?: string
  /** 助手的工具调用 */
  toolCalls?: ToolCall[]
  /** 推理内容（用于思维模型，如 DeepSeek） */
  reasoningContent?: string
}

/**
 * LLM 响应结构
 */
export interface LLMResponse {
  /** 响应内容（文本） */
  content: string
  /** LLM 请求的工具调用 */
  toolCalls?: ToolCall[]
  /** 是否有工具调用需要执行 */
  hasToolCalls: boolean
  /** 推理内容（用于思维模型） */
  reasoningContent?: string
  /** 使用统计 */
  usage?: LLMUsage
  /** 生成使用的模型 */
  model?: string
  /** 完成原因 */
  finishReason?: 'stop' | 'tool_calls' | 'length' | 'content_filter' | string
  /** 提供商返回的响应 ID */
  id?: string
}

/**
 * 流式 LLM 响应块
 */
export interface LLMStreamChunk {
  /** 增量内容 */
  content?: string
  /** 增量工具调用（部分） */
  toolCalls?: Partial<ToolCall>[]
  /** 是否为最后一个块 */
  isFinal?: boolean
  /** 完成原因（如果是最后一块） */
  finishReason?: string
  /** 使用统计（通常在最后一块） */
  usage?: LLMUsage
}

/**
 * 提供商配置
 */
export interface ProviderConfig {
  /** 提供商类型（openai、anthropic 等） */
  type: string
  /** 使用的模型 */
  model: string
  /** API 密钥 */
  apiKey?: string
  /** API 基础 URL */
  apiBase?: string
  /** 默认模型参数 */
  params?: Omit<LLMConfig, 'model' | 'apiKey' | 'apiBase'>
}

/**
 * 聊天调用选项
 */
export interface ChatOptions {
  /** 消息列表 */
  messages: ChatMessage[]
  /** 工具定义 */
  tools?: ToolDefinition[]
  /** 模型（覆盖默认） */
  model?: string
  /** 采样温度 */
  temperature?: number
  /** 最大生成 token 数 */
  maxTokens?: number
  /** Top-p 采样参数 */
  topP?: number
  /** 停止序列 */
  stopSequences?: string[]
  /** 频率惩罚（-2.0 到 2.0） */
  frequencyPenalty?: number
  /** 存在惩罚（-2.0 到 2.0） */
  presencePenalty?: number
  /** 请求超时时间（毫秒） */
  timeout?: number
}