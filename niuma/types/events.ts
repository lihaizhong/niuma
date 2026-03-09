/**
 * 内部通信事件类型定义
 */

import type { InboundMessage, OutboundMessage } from './message'
import type { ToolResult } from './tool'
import type { LLMResponse } from './llm'

/**
 * 系统发出的事件类型
 */
export type EventType =
  | 'MESSAGE_RECEIVED'
  | 'MESSAGE_SENT'
  | 'TOOL_CALL_START'
  | 'TOOL_CALL_END'
  | 'LLM_REQUEST_START'
  | 'LLM_RESPONSE'
  | 'ERROR'
  | 'HEARTBEAT'

/**
 * 事件数据映射（用于类型安全的事件处理）
 */
export interface EventMap {
  /** 从渠道接收到消息 */
  MESSAGE_RECEIVED: {
    message: InboundMessage
  }
  /** 向渠道发送了消息 */
  MESSAGE_SENT: {
    message: OutboundMessage
  }
  /** 开始工具执行 */
  TOOL_CALL_START: {
    toolName: string
    args: Record<string, unknown>
    callId: string
  }
  /** 工具执行完成 */
  TOOL_CALL_END: {
    toolName: string
    result: ToolResult
    success: boolean
    duration: number
  }
  /** 开始 LLM 请求 */
  LLM_REQUEST_START: {
    messages: Array<{ role: string; content: string }>
    model: string
  }
  /** 收到 LLM 响应 */
  LLM_RESPONSE: {
    response: LLMResponse
    duration: number
  }
  /** 系统发生错误 */
  ERROR: {
    error: Error
    context?: Record<string, unknown>
  }
  /** 心跳检测 */
  HEARTBEAT: {
    timestamp: number
    uptime: number
  }
}

/**
 * 带元数据的事件载荷
 */
export interface EventPayload<K extends EventType = EventType> {
  /** 事件类型 */
  type: K
  /** 事件数据 */
  data: EventMap[K]
  /** 事件发出时间戳 */
  timestamp: number
}

/**
 * 事件处理函数类型
 */
export type EventHandler<T = unknown> = (data: T) => void | Promise<void>