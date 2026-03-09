/**
 * Niuma 自定义错误类型
 */

/**
 * 所有 Niuma 错误的基类
 */
export class NiumaError extends Error {
  /** 错误代码（用于分类） */
  readonly code: string
  /** 附加错误详情 */
  readonly details?: Record<string, unknown>

  constructor(
    message: string,
    code: string,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'NiumaError'
    this.code = code
    this.details = details
    Error.captureStackTrace?.(this, this.constructor)
  }

  /** 转换为 JSON（用于日志/序列化） */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      stack: this.stack,
    }
  }
}

/**
 * 工具执行错误
 */
export class ToolExecutionError extends NiumaError {
  /** 导致错误的工具名称 */
  readonly toolName: string

  constructor(toolName: string, message: string, details?: Record<string, unknown>) {
    super(message, 'TOOL_EXECUTION_ERROR', { toolName, ...details })
    this.name = 'ToolExecutionError'
    this.toolName = toolName
  }
}

/**
 * 配置错误
 */
export class ConfigError extends NiumaError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIG_ERROR', details)
    this.name = 'ConfigError'
  }
}

/**
 * 验证错误
 */
export class ValidationError extends NiumaError {
  /** 验证失败的字段 */
  readonly field?: string

  constructor(message: string, field?: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', { field, ...details })
    this.name = 'ValidationError'
    this.field = field
  }
}

/**
 * 提供商错误（LLM API 错误）
 */
export class ProviderError extends NiumaError {
  /** 提供商名称 */
  readonly provider: string
  /** HTTP 状态码（如果适用） */
  readonly statusCode?: number

  constructor(
    provider: string,
    message: string,
    statusCode?: number,
    details?: Record<string, unknown>
  ) {
    super(message, 'PROVIDER_ERROR', { provider, statusCode, ...details })
    this.name = 'ProviderError'
    this.provider = provider
    this.statusCode = statusCode
  }
}

/**
 * 渠道错误（通信错误）
 */
export class ChannelError extends NiumaError {
  /** 渠道类型 */
  readonly channel: string

  constructor(channel: string, message: string, details?: Record<string, unknown>) {
    super(message, 'CHANNEL_ERROR', { channel, ...details })
    this.name = 'ChannelError'
    this.channel = channel
  }
}

/**
 * 会话错误
 */
export class SessionError extends NiumaError {
  /** 会话 ID */
  readonly sessionId?: string

  constructor(message: string, sessionId?: string, details?: Record<string, unknown>) {
    super(message, 'SESSION_ERROR', { sessionId, ...details })
    this.name = 'SessionError'
    this.sessionId = sessionId
  }
}