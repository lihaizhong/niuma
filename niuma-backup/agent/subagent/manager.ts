/**
 * 子智能体管理器 - 任务生命周期管理
 *
 * 职责：
 * - 任务创建和调度
 * - 任务取消和清理
 * - 会话关联
 * - 结果通知
 *
 * 不负责：
 * - LLM 调用（由 SubagentExecutor 负责）
 * - 工具执行（由 SubagentExecutor 负责）
 */

// ==================== 内置库 ====================
import { randomUUID } from "crypto";

// ==================== 本地模块 ====================
import {
  type SubagentSpawnOptions,
  type RunningTask,
  type TaskInfo,
  type TaskOrigin,
  type TaskResult,
  type SubagentManagerConfig,
  type ISubagentExecutor,
  MAX_CONCURRENT_TASKS,
} from "./types";

import type { EventBus } from "../../bus/events";
import type { OutboundMessage } from "../../types";


// ==================== 类定义 ====================

/**
 * 子智能体管理器
 *
 * 管理后台子智能体的创建、取消和清理。
 * 支持任务取消、会话关联和结果通知。
 *
 * @example
 * ```typescript
 * const executor = new SubagentExecutor({
 *   provider: openaiProvider,
 *   tools: toolRegistry,
 * });
 *
 * const manager = new SubagentManager({
 *   executor,
 *   bus: eventBus,
 * });
 *
 * // 创建后台任务
 * const taskId = await manager.spawn({
 *   task: '分析项目结构并生成文档',
 *   label: '文档生成',
 *   originChannel: 'cli',
 *   originChatId: 'chat-123',
 * });
 *
 * // 获取运行中任务数
 * console.log('运行中任务:', manager.list().length);
 *
 * // 取消任务
 * manager.cancel(taskId);
 * ```
 */
export class SubagentManager {
  // ============================================
  // 配置属性
  // ============================================

  /** 执行器 */
  private executor: ISubagentExecutor;
  /** 事件总线 */
  private bus: EventBus;
  /** 最大并发数 */
  private maxConcurrent: number;
  /** 任务超时 */
  private taskTimeout: number;

  // ============================================
  // 运行时属性
  // ============================================

  /** 运行中的任务 */
  private runningTasks: Map<string, RunningTask> = new Map();
  /** 会话到任务的映射 */
  private sessionToTasks: Map<string, Set<string>> = new Map();

  /**
   * 创建子智能体管理器
   *
   * @param config - 管理器配置
   */
  constructor(config: SubagentManagerConfig) {
    this.executor = config.executor;
    this.bus = config.bus;
    this.maxConcurrent = config.maxConcurrent ?? MAX_CONCURRENT_TASKS;
    this.taskTimeout = config.taskTimeout ?? 10 * 60 * 1000;
  }

  // ============================================
  // 公开方法
  // ============================================

  /**
   * 创建后台子智能体任务
   *
   * 异步启动一个后台任务，立即返回任务 ID。
   * 任务完成后会通过事件总线通知主 Agent。
   *
   * @param options - 任务选项
   * @returns 任务 ID
   */
  async spawn(options: SubagentSpawnOptions): Promise<string> {
    const taskId = `subagent-${randomUUID().slice(0, 8)}`;
    const label = options.label ?? "后台任务";

    const controller = new AbortController();

    // 创建任务 Promise（委托给 Executor）
    const promise = this._runTask(taskId, options.task, label, {
      channel: options.originChannel,
      chatId: options.originChatId,
    }, controller.signal);

    // 注册运行中任务
    const task: RunningTask = {
      taskId,
      task: options.task,
      label,
      originChannel: options.originChannel,
      originChatId: options.originChatId,
      sessionKey: options.sessionKey,
      controller,
      promise,
      startTime: Date.now(),
    };

    this.runningTasks.set(taskId, task);

    // 检查是否超过限制（先创建再检查，避免竞态条件）
    if (this.runningTasks.size > this.maxConcurrent) {
      // 超过限制，取消刚创建的任务
      this.runningTasks.delete(taskId);
      controller.abort();
      throw new Error(
        `已达到最大并发子智能体数量 (${this.maxConcurrent})，请稍后再试`,
      );
    }

    // 如果有会话键，建立关联
    if (options.sessionKey) {
      if (!this.sessionToTasks.has(options.sessionKey)) {
        this.sessionToTasks.set(options.sessionKey, new Set());
      }
      this.sessionToTasks.get(options.sessionKey)!.add(taskId);
    }

    // 任务完成后清理
    promise
      .catch(() => {
        // 错误已在 _runTask 中处理
      })
      .finally(() => {
        this._cleanupTask(taskId);
      });

    return taskId;
  }

  /**
   * 取消指定任务
   *
   * @param taskId - 任务 ID
   * @returns 是否成功取消
   */
  cancel(taskId: string): boolean {
    const task = this.runningTasks.get(taskId);
    if (!task) {
      return false;
    }

    task.controller.abort();

    // 通知取消
    this._announceResult(
      taskId,
      task.label,
      task.task,
      {
        status: "cancelled",
        content: "任务已取消",
      },
      {
        channel: task.originChannel,
        chatId: task.originChatId,
      },
    );

    return true;
  }

  /**
   * 取消指定会话的所有子智能体任务
   *
   * 当会话关闭时，取消该会话关联的所有后台任务。
   *
   * @param sessionKey - 会话键
   * @returns 取消的任务数量
   */
  async cancelBySession(sessionKey: string): Promise<number> {
    const taskIds = this.sessionToTasks.get(sessionKey);
    if (!taskIds || taskIds.size === 0) {
      return 0;
    }

    let cancelledCount = 0;

    for (const taskId of Array.from(taskIds)) {
      const task = this.runningTasks.get(taskId);
      if (task) {
        task.controller.abort();
        cancelledCount++;

        // 通知取消
        this._announceResult(
          taskId,
          task.label,
          task.task,
          {
            status: "cancelled",
            content: "任务已取消（会话关闭）",
          },
          {
            channel: task.originChannel,
            chatId: task.originChatId,
          },
        );
      }
    }

    return cancelledCount;
  }

  /**
   * 列出所有运行中任务
   *
   * @returns 任务信息列表
   */
  list(): TaskInfo[] {
    const now = Date.now();
    return Array.from(this.runningTasks.values()).map((t) => ({
      taskId: t.taskId,
      task: t.task,
      label: t.label,
      startTime: t.startTime,
      duration: now - t.startTime,
    }));
  }

  /**
   * 获取运行中任务数量
   *
   * @returns 当前运行中的子智能体数量
   */
  getRunningCount(): number {
    return this.runningTasks.size;
  }

  /**
   * 等待指定任务完成
   *
   * @param taskId - 任务 ID
   * @param timeout - 超时时间（毫秒）
   * @returns 任务是否完成
   */
  async wait(taskId: string, timeout?: number): Promise<boolean> {
    const task = this.runningTasks.get(taskId);
    if (!task) {
      return true; // 任务不存在，视为已完成
    }

    const timeoutMs = timeout ?? this.taskTimeout;

    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), timeoutMs);
    });

    const taskPromise = task.promise.then(() => true).catch(() => true);

    return Promise.race([taskPromise, timeoutPromise]);
  }

  /**
   * 等待所有任务完成
   *
   * @param timeout - 超时时间（毫秒）
   * @returns 完成的任务数
   */
  async waitForAll(timeout: number = 60000): Promise<number> {
    const tasks = Array.from(this.runningTasks.values());
    if (tasks.length === 0) {
      return 0;
    }

    const timeoutPromise = new Promise<number>((resolve) => {
      setTimeout(() => resolve(tasks.length), timeout);
    });

    const allPromise = Promise.all(tasks.map((t) => t.promise)).then(
      () => tasks.length,
    );

    return Promise.race([allPromise, timeoutPromise]);
  }

  // ============================================
  // 私有方法
  // ============================================

  /**
   * 运行任务（委托给 Executor）
   */
  private async _runTask(
    taskId: string,
    task: string,
    label: string,
    origin: TaskOrigin,
    signal: AbortSignal,
  ): Promise<void> {
    const result = await this.executor.execute({
      taskId,
      task,
      label,
      origin,
      signal,
    });

    // 如果被取消，不通知（由调用方处理）
    if (result.status === "cancelled") {
      return;
    }

    // 通知结果
    this._announceResult(taskId, label, task, result, origin);
  }

  /**
   * 通知子智能体执行结果
   *
   * 通过事件总线发送系统消息到原渠道。
   */
  private _announceResult(
    taskId: string,
    label: string,
    task: string,
    result: TaskResult,
    origin: TaskOrigin,
  ): void {
    // 构建结果消息
    let content: string;

    switch (result.status) {
      case "success":
        content = `✅ [${label}] 任务完成\n\n${result.content}`;
        break;
      case "error":
        content = `❌ [${label}] 任务失败\n\n错误: ${result.error ?? result.content}`;
        break;
      case "cancelled":
        content = `⏹️ [${label}] 任务已取消\n\n${result.content}`;
        break;
      default:
        content = `[${label}] 任务状态未知\n\n${result.content}`;
    }

    // 发送系统消息
    const message: OutboundMessage = {
      channel: origin.channel as OutboundMessage["channel"],
      chatId: origin.chatId,
      content,
      metadata: {
        taskId,
        taskLabel: label,
        taskStatus: result.status,
        originalTask: task,
      },
    };

    // 通过事件总线发送
    this.bus.emit("MESSAGE_SENT", { message });
  }

  /**
   * 清理完成的任务
   */
  private _cleanupTask(taskId: string): void {
    const task = this.runningTasks.get(taskId);
    if (!task) {
      return;
    }

    // 从运行中任务列表移除
    this.runningTasks.delete(taskId);

    // 从会话映射中移除
    if (task.sessionKey) {
      const sessionTasks = this.sessionToTasks.get(task.sessionKey);
      if (sessionTasks) {
        sessionTasks.delete(taskId);
        // 如果会话没有其他任务，清理映射
        if (sessionTasks.size === 0) {
          this.sessionToTasks.delete(task.sessionKey);
        }
      }
    }
  }
}
