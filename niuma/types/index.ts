/**
 * 核心类型 - 统一导出
 */

// 消息类型
export type {
  ChannelType,
  MediaContent,
  InboundMessage,
  OutboundMessage,
  MessageMetadata,
} from './message'

// 工具类型
export type {
  ToolParameterSchema,
  ToolDefinition,
  ToolCall,
  OpenAIToolSchema,
} from './tool'

// LLM 类型
export type {
  LLMUsage,
  LLMConfig,
  ChatRole,
  ChatMessage,
  LLMResponse,
  LLMStreamChunk,
  ProviderConfig,
} from './llm'

// 事件类型
export type { EventType, EventMap, EventPayload, EventHandler } from './events'

// 错误类型
export {
  NiumaError,
  ToolExecutionError,
  ConfigError,
  ValidationError,
  ProviderError,
  ChannelError,
  SessionError,
} from './error'
