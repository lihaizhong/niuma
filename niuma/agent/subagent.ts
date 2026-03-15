/**
 * 子智能体管理器 - 后台任务处理
 *
 * @description 管理后台子智能体的生命周期，支持独立执行复杂任务。
 * 子智能体与主 Agent 隔离运行，完成后通过事件通知主 Agent。
 */

// ==================== 内置库 ====================
import { randomUUID } from "crypto";

// ==================== 本地模块 ====================
import type { LLMProvider } from "../providers/base";
import type { ToolRegistry } from "./tools/registry";
import type { EventBus } from "../bus/events";
import type {
  ChatMessage,
  ToolCall,
  OutboundMessage,
  ToolDefinition,
} from "../types";

// ============================================
// 类型定义
// ============================================

/**
 * 子智能体创建选项
 */
export interface SubagentSpawnOptions {
  /** 任务描述 */
  task: string;
  /** 任务标签（用于显示） */
  label?: string;
  /** 来源渠道 */
  originChannel: string;
  /** 来源聊天 ID */
  originChatId: string;
  /** 会话键（用于任务关联） */
  sessionKey?: string;
}

/**
 * 子智能体管理器配置
 */
export interface SubagentManagerConfig {
  /** LLM 提供商 */
  provider: LLMProvider;
  /** 工具注册表 */
  tools: ToolRegistry;
  /** 事件总线 */
  bus: EventBus;
  /** 工作空间路径 */
  workspace?: string;
  /** 模型名称 */
  model?: string;
  /** 采样温度 */
  temperature?: number;
  /** 最大 token 数 */
  maxTokens?: number;
}

/**
 * 运行中的子智能体任务
 */
interface RunningTask {
  /** 任务 ID */
  taskId: string;
  /** 任务描述 */
  task: string;
  /** 任务标签 */
  label: string;
  /** 来源渠道 */
  originChannel: string;
  /** 来源聊天 ID */
  originChatId: string;
  /** 会话键 */
  sessionKey?: string;
  /** AbortController 用于取消任务 */
  controller: AbortController;
  /** 任务 Promise */
  promise: Promise<void>;
  /** 开始时间 */
  startTime: number;
}

/**
 * 任务执行状态
 */
type TaskStatus = "success" | "error" | "cancelled";

/**
 * 任务完成结果
 */
interface TaskResult {
  /** 状态 */
  status: TaskStatus;
  /** 结果内容 */
  content: string;
  /** 错误信息 */
  error?: string;
}

// ============================================
// 常量
// ============================================

/**
 * 子智能体最大迭代次数
 * @description 设置为 15 的原因：
 * 1. 子智能体通常执行简单、明确的任务，不需要过多迭代
 * 2. 避免后台任务占用过多 LLM 资源和计算成本
 * 3. 超过 15 次迭代通常意味着任务定义不清晰，应返回错误
 * 4. 远小于主 Agent 的 40 次迭代，确保主 Agent 有更多资源处理用户请求
 * @note 可通过配置覆盖，但建议保持默认值
 */
const MAX_ITERATIONS = 15;

/**
 * 最大并发子智能体数量
 * @description 限制同时运行的子智能体数量，避免资源耗尽
 * @note 超过此限制时，spawn 方法会拒绝新任务
 */
const MAX_CONCURRENT_TASKS = 5;

/**
 * 子智能体任务超时时间（毫秒）
 * @description 单个子智能体任务的最大执行时间
 * @note 默认 10 分钟，超时后任务将被取消
 */
const TASK_TIMEOUT = 10 * 60 * 1000;

/** 子智能体 System Prompt */
const SUBAGENT_SYSTEM_PROMPT = `你是一个专业的后台任务执行助手。你的职责是独立完成分配给你的任务。

## 工作模式

1. 你是一个独立的执行单元，不能与用户直接交互
2. 专注于完成任务，使用可用工具进行操作
3. 任务完成后，提供简洁明确的结果摘要
4. 如果遇到无法解决的问题，清晰说明原因

## 行为准则

- 不询问用户问题，基于现有信息做出合理推断
- 优先使用工具完成任务
- 保持输出简洁，聚焦于任务目标
- 如果任务超出你的能力范围，明确说明

## 工作空间

你可以在指定的目录中读写文件，执行命令，完成开发任务。

## 输出要求

任务完成时，提供：
1. 完成的具体工作内容
2. 创建或修改的文件列表
3. 需要注意的事项（如果有）

如果任务失败，说明失败原因和建议的解决方案。`;

// ============================================
// SubagentManager 类
// ============================================

/**
 * 子智能体管理器
 *
 * @description 管理后台子智能体的创建、执行和清理。
 * 支持任务取消、会话关联和结果通知。
 *
 * @example
 * ```typescript
 * const manager = new SubagentManager({
 *   provider: openaiProvider,
 *   tools: toolRegistry,
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
 * console.log('运行中任务:', manager.getRunningCount());
 *
 * // 取消会话关联的任务
 * await manager.cancelBySession('chat-123');
 * ```
 */
export class SubagentManager {
  // ============================================
  // 配置属性
  // ============================================

  /** LLM 提供商 */
  private provider: LLMProvider;
  /** 工具注册表 */
  private tools: ToolRegistry;
  /** 事件总线 */
  private bus: EventBus;
  /** 工作空间路径 */
  private workspace: string;
  /** 默认模型 */
  private model?: string;
  /** 采样温度 */
  private temperature?: number;
  /** 最大 token 数 */
  private maxTokens?: number;

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
    this.provider = config.provider;
    this.tools = config.tools;
    this.bus = config.bus;
    this.workspace = config.workspace ?? process.cwd();
    this.model = config.model;
    this.temperature = config.temperature;
    this.maxTokens = config.maxTokens;
  }

  // ============================================
  // 公开方法
  // ============================================

  /**
   * 创建后台子智能体任务
   *
   * @description 异步启动一个后台任务，立即返回任务 ID。
   * 任务完成后会通过事件总线通知主 Agent。
   *
   * @param options - 任务选项
   * @returns 任务 ID
   *
   * @example
   * ```typescript
   * const taskId = await manager.spawn({
   *   task: '优化代码性能',
   *   label: '性能优化',
   *   originChannel: 'cli',
   *   originChatId: 'chat-001',
   *   sessionKey: 'session-001',
   * });
   * ```
   */
  async spawn(options: SubagentSpawnOptions): Promise<string> {
    const taskId = `subagent-${randomUUID().slice(0, 8)}`;
    const label = options.label ?? "后台任务";

    const controller = new AbortController();

    // 创建任务 Promise
    const promise = this._runSubagent(
      taskId,
      options.task,
      label,
      {
        channel: options.originChannel,
        chatId: options.originChatId,
      },
      controller.signal,
    );

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
    if (this.runningTasks.size > MAX_CONCURRENT_TASKS) {
      // 超过限制，取消刚创建的任务
      this.runningTasks.delete(taskId);
      controller.abort();
      throw new Error(
        `已达到最大并发子智能体数量 (${MAX_CONCURRENT_TASKS})，请稍后再试`,
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
        // 错误已在 _runSubagent 中处理
      })
      .finally(() => {
        this._cleanupTask(taskId);
      });

    return taskId;
  }

  /**
   * 取消指定会话的所有子智能体任务
   *
   * @description 当会话关闭时，取消该会话关联的所有后台任务。
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
   * 获取运行中任务数量
   *
   * @returns 当前运行中的子智能体数量
   */
  getRunningCount(): number {
    return this.runningTasks.size;
  }

  /**
   * 获取所有运行中任务信息
   *
   * @returns 任务信息列表
   */
  getRunningTasks(): Array<{
    taskId: string;
    task: string;
    label: string;
    startTime: number;
    duration: number;
  }> {
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
   * 等待所有任务完成
   *
   * @param timeout - 超时时间（毫秒），默认 60000
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
   * 执行子智能体循环
   *
   * @description 运行子智能体的核心循环，最多迭代 MAX_ITERATIONS 次。
   * 子智能体不能使用 message 和 spawn 工具。
   */
  private async _runSubagent(
    taskId: string,
    task: string,
    label: string,
    origin: { channel: string; chatId: string },
    signal: AbortSignal,
  ): Promise<void> {
    const timeoutController = new AbortController();

    // 合并外部 signal 和 timeout signal
    const combinedSignal = new AbortController();
    const abortHandler = () => combinedSignal.abort();
    signal.addEventListener("abort", abortHandler);
    timeoutController.signal.addEventListener("abort", abortHandler);

    // 设置超时
    const timeoutId = setTimeout(() => {
      timeoutController.abort();
    }, TASK_TIMEOUT);

    try {
      // 检查是否已取消
      if (combinedSignal.signal.aborted) {
        return;
      }

      // 构建消息历史
      const messages: ChatMessage[] = [
        { role: "system", content: this._buildSubagentPrompt() },
        { role: "user", content: task },
      ];

      // 获取隔离的工具定义（排除 message 和 spawn）
      const tools = this._getIsolatedTools();

      // 执行循环
      let iteration = 0;
      let lastContent = "";

      while (iteration < MAX_ITERATIONS && !combinedSignal.signal.aborted) {
        iteration++;

        // 调用 LLM
        const response = await this.provider.chat({
          messages,
          tools: tools.length > 0 ? tools : undefined,
          model: this.model,
          temperature: this.temperature,
          maxTokens: this.maxTokens,
        });

        // 添加助手回复到历史
        messages.push({
          role: "assistant",
          content: response.content,
          toolCalls: response.toolCalls,
        });

        // 如果没有工具调用，任务完成
        if (!response.hasToolCalls || !response.toolCalls?.length) {
          lastContent = response.content;
          break;
        }

        // 执行工具调用
        for (const toolCall of response.toolCalls) {
          if (combinedSignal.signal.aborted) {
            break;
          }

          const result = await this._executeToolCall(toolCall);

          // 添加工具结果到历史
          messages.push({
            role: "tool",
            toolCallId: toolCall.id,
            name: toolCall.name,
            content: result,
          });
        }
      }

      // 检查是否被取消
      if (combinedSignal.signal.aborted) {
        return;
      }

      // 如果达到最大迭代次数，添加提示
      if (iteration >= MAX_ITERATIONS) {
        const lastMsg = messages[messages.length - 1];
        lastContent =
          typeof lastMsg?.content === "string"
            ? lastMsg.content
            : "任务执行达到最大迭代次数，可能未完全完成。";
        if (!lastContent) {
          lastContent = "任务执行达到最大迭代次数，可能未完全完成。";
        }
      }

      // 通知结果
      this._announceResult(
        taskId,
        label,
        task,
        {
          status: "success",
          content: lastContent,
        },
        origin,
      );
    } catch (error) {
      // 如果是取消导致的错误，不通知
      if (combinedSignal.signal.aborted) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // 通知错误
      this._announceResult(
        taskId,
        label,
        task,
        {
          status: "error",
          content: "任务执行失败",
          error: errorMessage,
        },
        origin,
      );
    } finally {
      clearTimeout(timeoutId);
      signal.removeEventListener("abort", abortHandler);
    }
  }

  /**
   * 构建子智能体 System Prompt
   */
  private _buildSubagentPrompt(): string {
    let prompt = SUBAGENT_SYSTEM_PROMPT;

    // 添加工作空间信息
    prompt += `\n\n当前工作空间: ${this.workspace}`;

    // 添加可用工具列表
    const availableTools = this._getIsolatedTools();
    if (availableTools.length > 0) {
      const toolNames = availableTools.map((t) => t.name).join(", ");
      prompt += `\n\n可用工具: ${toolNames}`;
    }

    return prompt;
  }

  /**
   * 获取隔离工具集
   * @description 返回排除消息和子智能体创建工具后的工具定义。
   * 子智能体不能发送消息或创建更多子智能体。
   */
  private _getIsolatedTools(): ToolDefinition[] {
    const allTools = this.tools.getDefinitions();

    // 精确匹配排除的工具名称
    const excludedTools = new Set([
      "message",
      "spawn",
      "send_message",
      "create_subagent",
      "task",
      "subagent",
    ]);

    return allTools.filter((tool) => {
      // 使用精确匹配而非包含，避免误判
      return !excludedTools.has(tool.name.toLowerCase());
    });
  }

  /**
   * 执行工具调用
   */
  private async _executeToolCall(toolCall: ToolCall): Promise<string> {
    try {
      const args = toolCall.arguments as Record<string, unknown>;
      return await this.tools.execute(toolCall.name, args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `工具执行错误: ${message}`;
    }
  }

  /**
   * 通知子智能体执行结果
   *
   * @description 通过事件总线发送系统消息到原渠道。
   */
  private _announceResult(
    taskId: string,
    label: string,
    task: string,
    result: TaskResult,
    origin: { channel: string; chatId: string },
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
