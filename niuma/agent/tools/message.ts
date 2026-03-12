/**
 * 消息工具
 * 提供跨渠道发送消息的能力
 */

import pino from 'pino'

import { z } from 'zod'
import { nanoid } from 'nanoid'

import { BaseTool } from './base'
import { ToolExecutionError } from '../../types/error'

const logger = pino({ level: 'info' })

/**
 * 消息状态
 */
type MessageStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

/**
 * 富文本解析器接口
 */
interface RichTextParser {
  type: 'markdown' | 'html'
  parse(content: string): string
  render(content: string): string
}

/**
 * Markdown 解析器
 */
class MarkdownParser implements RichTextParser {
  type = 'markdown' as const

  parse(content: string): string {
    // 简单的 Markdown 解析（实际项目应使用 marked 或 remark）
    return content
      // 标题
      .replace(/^### (.*$)/gim, '\n### $1\n')
      .replace(/^## (.*$)/gim, '\n## $1\n')
      .replace(/^# (.*$)/gim, '\n# $1\n')
      // 粗体
      .replace(/\*\*(.*)\*\*/gim, '\x1b[1m$1\x1b[0m')
      // 斜体
      .replace(/\*(.*)\*/gim, '\x1b[3m$1\x1b[0m')
      // 代码
      .replace(/`([^`]+)`/gim, '\x1b[36m$1\x1b[0m')
      // 代码块
      .replace(/```([\s\S]*?)```/gim, '\n\x1b[36m$1\x1b[0m\n')
      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '$1 ($2)')
  }

  render(content: string): string {
    return this.parse(content)
  }
}

/**
 * HTML 解析器
 */
class HtmlParser implements RichTextParser {
  type = 'html' as const

  parse(content: string): string {
    // 简单的 HTML 解析（移除标签，保留文本）
    return content
      .replace(/<[^>]*>/g, '') // 移除 HTML 标签
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
  }

  render(content: string): string {
    return this.parse(content)
  }
}

/**
 * 富文本解析器注册表
 */
const richTextParsers: Record<string, RichTextParser> = {
  markdown: new MarkdownParser(),
  html: new HtmlParser(),
}

/**
 * 消息队列项
 */
interface MessageQueueItem {
  message: MessageHistory
  priority: number
  createdAt: Date
}

/**
 * 消息队列（按优先级排序）
 */
class MessageQueue {
  private queue: MessageQueueItem[] = []
  private processing = false
  private maxConcurrent = 5
  private activeCount = 0

  /**
   * 添加消息到队列
   */
  enqueue(message: MessageHistory): void {
    const priorityMap = { low: 1, normal: 2, high: 3 }
    const priority = priorityMap[message.priority as keyof typeof priorityMap] || 2

    this.queue.push({
      message,
      priority,
      createdAt: new Date(),
    })

    // 按优先级排序（高优先级在前）
    this.queue.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority
      }
      return a.createdAt.getTime() - b.createdAt.getTime()
    })

    void this.processQueue()
  }

  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.activeCount >= this.maxConcurrent) {
      return
    }

    this.processing = true

    while (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
      const item = this.queue.shift()
      if (!item) break

      this.activeCount++
      void this.sendMessage(item.message).finally(() => {
        this.activeCount--
      })
    }

    this.processing = false
  }

  /**
   * 发送消息
   */
  private async sendMessage(message: MessageHistory): Promise<void> {
    try {
      message.status = 'sending'

      // 根据渠道发送消息
      switch (message.channel) {
        case 'cli':
          await this.sendToCli(message)
          break
        default:
          throw new ToolExecutionError('message', `不支持的渠道: ${message.channel}`)
      }

      message.status = 'sent'
      message.sentAt = new Date()
      logger.info({ messageId: message.messageId, channel: message.channel }, '消息已发送')
    } catch (error) {
      message.status = 'failed'
      message.error = (error as Error).message
      logger.error({ messageId: message.messageId, error: message.error }, '消息发送失败')
    }
  }

  /**
   * 发送到 CLI
   */
  private async sendToCli(message: MessageHistory): Promise<void> {
    // 根据消息类型解析内容
    const parser = richTextParsers[message.type]
    let renderedContent = message.content

    if (parser && message.type !== 'text') {
      renderedContent = parser.render(message.content)
    }

    // 输出到控制台
    console.log(`[${message.type.toUpperCase()}] ${renderedContent}`)
  }

  /**
   * 获取队列状态
   */
  getStatus(): { queued: number; active: number } {
    return {
      queued: this.queue.length,
      active: this.activeCount,
    }
  }
}

/**
 * 消息队列实例
 */
const messageQueue = new MessageQueue()

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
    immediate: z.boolean().optional().describe('是否立即发送（跳过队列）'),
  })

  async execute(args: {
    content: string
    channel?: string
    priority?: string
    type?: string
    tags?: string[]
    immediate?: boolean
  }): Promise<string> {
    const { content, channel = 'cli', priority = 'normal', type = 'text', tags = [], immediate = false } = args

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
      if (immediate) {
        // 立即发送（跳过队列）
        message.status = 'sending'
        await this.sendMessageImmediate(message)
      } else {
        // 加入队列
        messageQueue.enqueue(message)
      }

      return `消息已${immediate ? '发送' : '加入队列'}（ID: ${messageId}，渠道: ${channel}，类型: ${type}）`
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error
      }

      message.status = 'failed'
      message.error = (error as Error).message

      throw new ToolExecutionError(this.name, `发送消息失败: ${(error as Error).message}`)
    }
  }

  /**
   * 立即发送消息
   */
  private async sendMessageImmediate(message: MessageHistory): Promise<void> {
    const parser = richTextParsers[message.type]
    let renderedContent = message.content

    if (parser && message.type !== 'text') {
      renderedContent = parser.render(message.content)
    }

    // 根据渠道发送消息
    switch (message.channel) {
      case 'cli':
        console.log(`[${message.type.toUpperCase()}] ${renderedContent}`)
        break
      default:
        throw new ToolExecutionError(this.name, `不支持的渠道: ${message.channel}`)
    }

    message.status = 'sent'
    message.sentAt = new Date()
    logger.info({ messageId: message.messageId, channel: message.channel }, '消息已发送')
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