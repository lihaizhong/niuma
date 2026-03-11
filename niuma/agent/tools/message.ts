/**
 * 消息工具
 * 提供跨渠道发送消息的能力
 */

import { z } from 'zod'
import { nanoid } from 'nanoid'
import { BaseTool } from './base.js'
import { ToolExecutionError } from '../../types/error.js'
import pino from 'pino'

const logger = pino({ level: 'info' })

/**
 * 消息状态
 */
type MessageStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

/**
 * 消息历史记录
 */
interface MessageHistory {
  messageId: string
  content: string
  channel: string
  type: string
  priority: string
  status: MessageStatus
  createdAt: Date
  sentAt?: Date
  deliveredAt?: Date
  readAt?: Date
  error?: string
  agentId: string
  tags: string[]
}

/**
 * 消息历史存储（内存实现，生产环境应使用数据库）
 */
const messageHistory: MessageHistory[] = []

/**
 * Message 工具：发送消息
 */
export class MessageTool extends BaseTool {
  readonly name = 'message'
  readonly description = '通过配置的渠道发送消息。支持多渠道、消息优先级、状态跟踪等。'
  readonly parameters = z.object({
    content: z.string().describe('消息内容'),
    channel: z.string().optional().describe('渠道名称（默认: cli）'),
    priority: z.enum(['low', 'normal', 'high']).optional().describe('消息优先级（默认: normal）'),
    type: z.enum(['text', 'markdown', 'html']).optional().describe('消息类型（默认: text）'),
    tags: z.array(z.string()).optional().describe('消息标签'),
  })

  async execute(args: {
    content: string
    channel?: string
    priority?: string
    type?: string
    tags?: string[]
  }): Promise<string> {
    const { content, channel = 'cli', priority = 'normal', type = 'text', tags = [] } = args

    const messageId = nanoid()
    const now = new Date()

    // 创建消息记录
    const message: MessageHistory = {
      messageId,
      content,
      channel,
      type,
      priority,
      status: 'queued',
      createdAt: now,
      agentId: 'default', // TODO: 从上下文获取 Agent ID
      tags,
    }

    messageHistory.push(message)

    try {
      // 更新状态为发送中
      message.status = 'sending'

      // 根据渠道发送消息
      switch (channel) {
        case 'cli':
          // CLI 渠道：直接输出到控制台
          console.log(`[消息] ${content}`)
          break

        default:
          throw new ToolExecutionError(this.name, `不支持的渠道: ${channel}`)
      }

      // 更新状态为已发送
      message.status = 'sent'
      message.sentAt = new Date()

      // TODO: 实现送达和已读状态（需要渠道支持）

      logger.info({ messageId, channel, priority }, '消息已发送')

      return `消息已发送（ID: ${messageId}，渠道: ${channel}）`
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error
      }

      // 更新状态为失败
      message.status = 'failed'
      message.error = (error as Error).message

      throw new ToolExecutionError(this.name, `发送消息失败: ${(error as Error).message}`)
    }
  }
}

/**
 * 获取消息历史
 */
export function getMessageHistory(options?: {
  channel?: string
  status?: MessageStatus
  limit?: number
}): MessageHistory[] {
  let history = [...messageHistory]

  // 过滤
  if (options?.channel) {
    history = history.filter((m) => m.channel === options.channel)
  }
  if (options?.status) {
    history = history.filter((m) => m.status === options.status)
  }

  // 排序（最新的在前）
  history.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  // 限制数量
  if (options?.limit) {
    history = history.slice(0, options.limit)
  }

  return history
}

/**
 * 清理过期消息历史
 */
export function cleanMessageHistory(olderThan: number = 7 * 24 * 60 * 60 * 1000): number {
  const now = Date.now()
  const before = messageHistory.length

  for (let i = messageHistory.length - 1; i >= 0; i--) {
    const message = messageHistory[i]
    if (now - message.createdAt.getTime() > olderThan) {
      messageHistory.splice(i, 1)
    }
  }

  return before - messageHistory.length
}

// 导出工具实例
export const messageTool = new MessageTool()