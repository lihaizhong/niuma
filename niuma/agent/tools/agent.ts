/**
 * Agent 工具
 * 提供子智能体创建和管理、定时任务调度等功能
 */

import { z } from 'zod'
import { nanoid } from 'nanoid'
import { schedule, validate, type ScheduledTask } from 'node-cron'
import { BaseTool } from './base.js'
import { ToolExecutionError } from '../../types/error.js'
import pino from 'pino'

const logger = pino({ level: 'info' })

/**
 * Spawn 工具：创建子智能体
 */
export class SpawnTool extends BaseTool {
  readonly name = 'spawn'
  readonly description = '创建和管理子智能体。支持配置继承、资源隔离、工具权限控制等。'
  readonly parameters = z.object({
    config: z.record(z.string(), z.unknown()).optional().describe('子智能体配置'),
    initialMessage: z.string().optional().describe('初始消息'),
    task: z.string().optional().describe('任务描述'),
    timeout: z.number().int().positive().optional().describe('超时时间（毫秒）'),
    allowedTools: z.array(z.string()).optional().describe('允许的工具列表'),
    deniedTools: z.array(z.string()).optional().describe('禁止的工具列表'),
  })

  async execute(args: {
    config?: Record<string, unknown>
    initialMessage?: string
    task?: string
    timeout?: number
    allowedTools?: string[]
    deniedTools?: string[]
  }): Promise<string> {
    const { config = {}, initialMessage, task, timeout, allowedTools, deniedTools } = args

    const agentId = nanoid()
    const now = new Date()

    try {
      // TODO: 实现子智能体创建逻辑
      // 1. 创建独立的配置
      // 2. 创建独立的工作区
      // 3. 创建独立的会话
      // 4. 设置工具权限
      // 5. 初始化子智能体

      logger.info({ agentId, task }, '创建子智能体')

      return `子智能体已创建（ID: ${agentId}）${task ? `，任务: ${task}` : ''}`
    } catch (error) {
      throw new ToolExecutionError(this.name, `创建子智能体失败: ${(error as Error).message}`)
    }
  }
}

/**
 * Cron 任务定义
 */
interface CronTask {
  taskId: string
  name: string
  description?: string
  cron: string
  handler: string
  params: Record<string, unknown>
  enabled: boolean
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused'
  nextRun: Date
  lastRun?: Date
  executionCount: number
  createdAt: Date
  scheduledTask?: ScheduledTask
}

/**
 * Cron 任务存储（内存实现，生产环境应使用数据库）
 */
const cronTasks: Map<string, CronTask> = new Map()

/**
 * Cron 工具：管理定时任务
 */
export class CronTool extends BaseTool {
  readonly name = 'cron'
  readonly description = '创建和管理定时任务。支持标准 Cron 表达式、任务调度、状态跟踪等。'
  readonly parameters = z.object({
    action: z.enum(['create', 'list', 'update', 'delete', 'pause', 'resume']).describe('操作类型'),
    taskId: z.string().optional().describe('任务 ID（更新、删除等操作需要）'),
    cron: z.string().optional().describe('Cron 表达式'),
    name: z.string().optional().describe('任务名称'),
    description: z.string().optional().describe('任务描述'),
    handler: z.string().optional().describe('任务处理器名称'),
    params: z.record(z.string(), z.unknown()).optional().describe('任务参数'),
    enabled: z.boolean().optional().describe('是否启用'),
  })

  async execute(args: {
    action: string
    taskId?: string
    cron?: string
    name?: string
    description?: string
    handler?: string
    params?: Record<string, unknown>
    enabled?: boolean
  }): Promise<string> {
    const { action, taskId, cron, name, description, handler, params = {}, enabled = true } = args

    switch (action) {
      case 'create':
        return this.createTask(cron!, name!, description, handler!, params, enabled)

      case 'list':
        return this.listTasks()

      case 'update':
        return this.updateTask(taskId!, { cron, name, description, params, enabled })

      case 'delete':
        return this.deleteTask(taskId!)

      case 'pause':
        return this.pauseTask(taskId!)

      case 'resume':
        return this.resumeTask(taskId!)

      default:
        throw new ToolExecutionError(this.name, `不支持的操作: ${action}`)
    }
  }

  /**
   * 创建定时任务
   */
  private async createTask(
    cron: string,
    name: string,
    description: string | undefined,
    handler: string,
    params: Record<string, unknown>,
    enabled: boolean
  ): Promise<string> {
    if (!cron || !name || !handler) {
      throw new ToolExecutionError(this.name, '创建任务需要 cron、name 和 handler 参数')
    }

    // 验证 Cron 表达式
    if (!validate(cron)) {
      throw new ToolExecutionError(this.name, `无效的 Cron 表达式: ${cron}`)
    }

    const taskId = nanoid()
    const now = new Date()

    const task: CronTask = {
      taskId,
      name,
      description,
      cron,
      handler,
      params,
      enabled,
      status: 'pending',
      nextRun: this.calculateNextRun(cron),
      executionCount: 0,
      createdAt: now,
    }

    // 如果启用，创建 ScheduledTask
    if (enabled) {
      task.scheduledTask = schedule(cron, () => {
        this.executeTask(taskId)
      })
      task.scheduledTask.start()
    }

    cronTasks.set(taskId, task)

    logger.info({ taskId, name, cron }, '创建定时任务')

    return `定时任务已创建（ID: ${taskId}，名称: ${name}，下次执行: ${task.nextRun.toISOString()}）`
  }

  /**
   * 列出所有任务
   */
  private async listTasks(): Promise<string> {
    if (cronTasks.size === 0) {
      return '暂无定时任务'
    }

    const tasks = Array.from(cronTasks.values())
    const output = tasks
      .map(
        (task) =>
          `[${task.enabled ? '启用' : '禁用'}] ${task.name} (${task.taskId})\n` +
          `  表达式: ${task.cron}\n` +
          `  状态: ${task.status}\n` +
          `  下次执行: ${task.nextRun.toISOString()}\n` +
          `  执行次数: ${task.executionCount}`
      )
      .join('\n\n')

    return output
  }

  /**
   * 更新任务
   */
  private async updateTask(
    taskId: string,
    updates: {
      cron?: string
      name?: string
      description?: string
      params?: Record<string, unknown>
      enabled?: boolean
    }
  ): Promise<string> {
    const task = cronTasks.get(taskId)
    if (!task) {
      throw new ToolExecutionError(this.name, `任务不存在: ${taskId}`)
    }

    // 停止现有的 ScheduledTask
    if (task.scheduledTask) {
      task.scheduledTask.stop()
    }

    // 更新字段
    if (updates.cron) {
      task.cron = updates.cron
      task.nextRun = this.calculateNextRun(updates.cron)
    }
    if (updates.name) task.name = updates.name
    if (updates.description !== undefined) task.description = updates.description
    if (updates.params) task.params = updates.params
    if (updates.enabled !== undefined) task.enabled = updates.enabled

    // 如果启用，创建新的 ScheduledTask
    if (task.enabled) {
      task.scheduledTask = schedule(task.cron, () => {
        this.executeTask(taskId)
      })
      task.scheduledTask.start()
    }

    logger.info({ taskId, updates }, '更新定时任务')

    return `定时任务已更新（ID: ${taskId}）`
  }

  /**
   * 删除任务
   */
  private async deleteTask(taskId: string): Promise<string> {
    const task = cronTasks.get(taskId)
    if (!task) {
      throw new ToolExecutionError(this.name, `任务不存在: ${taskId}`)
    }

    // 停止 ScheduledTask
    if (task.scheduledTask) {
      task.scheduledTask.stop()
    }

    cronTasks.delete(taskId)

    logger.info({ taskId }, '删除定时任务')

    return `定时任务已删除（ID: ${taskId}）`
  }

  /**
   * 暂停任务
   */
  private async pauseTask(taskId: string): Promise<string> {
    const task = cronTasks.get(taskId)
    if (!task) {
      throw new ToolExecutionError(this.name, `任务不存在: ${taskId}`)
    }

    if (!task.enabled) {
      return `任务已暂停（ID: ${taskId}）`
    }

    task.enabled = false
    task.status = 'paused'

    if (task.scheduledTask) {
      task.scheduledTask.stop()
    }

    logger.info({ taskId }, '暂停定时任务')

    return `定时任务已暂停（ID: ${taskId}）`
  }

  /**
   * 恢复任务
   */
  private async resumeTask(taskId: string): Promise<string> {
    const task = cronTasks.get(taskId)
    if (!task) {
      throw new ToolExecutionError(this.name, `任务不存在: ${taskId}`)
    }

    if (task.enabled) {
      return `任务已启用（ID: ${taskId}）`
    }

    task.enabled = true
    task.status = 'pending'

    task.scheduledTask = schedule(task.cron, () => {
        this.executeTask(taskId)
      })
      task.scheduledTask.start()

    logger.info({ taskId }, '恢复定时任务')

    return `定时任务已恢复（ID: ${taskId}，下次执行: ${task.nextRun.toISOString()}）`
  }

  /**
   * 执行任务
   */
  private async executeTask(taskId: string): Promise<void> {
    const task = cronTasks.get(taskId)
    if (!task) {
      return
    }

    task.status = 'running'
    task.lastRun = new Date()
    task.executionCount++

    logger.info({ taskId, handler: task.handler, params: task.params }, '执行定时任务')

    try {
      // TODO: 执行任务处理器
      task.status = 'completed'
    } catch (error) {
      task.status = 'failed'
      logger.error({ taskId, error }, '定时任务执行失败')
    }
  }

  /**
   * 计算下次执行时间
   */
  private calculateNextRun(cron: string): Date {
    // node-cron 没有提供计算下次执行时间的方法
    // 返回默认值（1小时后）
    // TODO: 实现更精确的下次执行时间计算
    return new Date(Date.now() + 60 * 60 * 1000)
  }
}

// 导出工具实例
export const spawnTool = new SpawnTool()
export const cronTool = new CronTool()
