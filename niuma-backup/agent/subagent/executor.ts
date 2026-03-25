/**
 * 子智能体执行器 - 封装 LLM 循环和工具调用逻辑
 *
 * 职责：
 * - 执行 LLM 调用循环
 * - 工具隔离（排除 message、spawn 等）
 * - 构建系统提示词
 * - 任务取消支持
 */

// ==================== 本地模块 ====================
import {
  type ExecuteOptions,
  type ExecuteResult,
  MAX_ITERATIONS,
  TASK_TIMEOUT,
  SUBAGENT_SYSTEM_PROMPT,
  EXCLUDED_TOOLS,
} from "./types";

import type { LLMProvider } from "../../providers/base";
import type { ChatMessage, ToolCall, ToolDefinition } from "../../types";
import type { ToolRegistry } from "../tools/registry";


// ==================== 类定义 ====================

/**
 * 子智能体执行器
 *
 * 封装子智能体的 LLM 循环和工具调用逻辑。
 * 与 SubagentManager 解耦，专注于执行职责。
 *
 * @example
 * ```typescript
 * const executor = new SubagentExecutor({
 *   provider: openaiProvider,
 *   tools: toolRegistry,
 *   workspace: '/path/to/workspace',
 * });
 *
 * const result = await executor.execute({
 *   taskId: 'subagent-abc123',
 *   task: '分析项目结构',
 *   label: '项目分析',
 *   origin: { channel: 'cli', chatId: 'chat-001' },
 *   signal: abortSignal,
 * });
 * ```
 */
export class SubagentExecutor {
  // ============================================
  // 配置属性
  // ============================================

  /** LLM 提供商 */
  private provider: LLMProvider;
  /** 工具注册表 */
  private tools: ToolRegistry;
  /** 工作空间路径 */
  private workspace: string;
  /** 默认模型 */
  private model?: string;
  /** 采样温度 */
  private temperature?: number;
  /** 最大 token 数 */
  private maxTokens?: number;

  // ============================================
  // 构造函数
  // ============================================

  /**
   * 创建子智能体执行器
   *
   * @param config - 执行器配置
   */
  constructor(config: {
    provider: LLMProvider;
    tools: ToolRegistry;
    workspace?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }) {
    this.provider = config.provider;
    this.tools = config.tools;
    this.workspace = config.workspace ?? process.cwd();
    this.model = config.model;
    this.temperature = config.temperature;
    this.maxTokens = config.maxTokens;
  }

  // ============================================
  // 公开方法
  // ============================================

  /**
   * 执行子智能体任务
   *
   * 运行 LLM 循环，最多迭代 MAX_ITERATIONS 次。
   * 子智能体不能使用 message 和 spawn 工具。
   *
   * @param options - 执行选项
   * @returns 执行结果
   */
  async execute(options: ExecuteOptions): Promise<ExecuteResult> {
    const { taskId, task, signal } = options;

    const timeoutController = new AbortController();

    // 合并外部 signal 和 timeout signal
    const combinedSignal = new AbortController();
    const abortHandler = () => combinedSignal.abort();
    signal?.addEventListener("abort", abortHandler);
    timeoutController.signal.addEventListener("abort", abortHandler);

    // 设置超时
    const timeoutId = setTimeout(() => {
      timeoutController.abort();
    }, TASK_TIMEOUT);

    try {
      // 检查是否已取消
      if (combinedSignal.signal.aborted) {
        return {
          status: "cancelled",
          content: "任务已取消",
        };
      }

      // 构建消息历史
      const messages: ChatMessage[] = [
        { role: "system", content: this.buildSystemPrompt() },
        { role: "user", content: task },
      ];

      // 获取隔离的工具定义
      const tools = this.getIsolatedTools();

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
        return {
          status: "cancelled",
          content: "任务已取消",
        };
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

      return {
        status: "success",
        content: lastContent,
      };
    } catch (error) {
      // 如果是取消导致的错误，返回取消状态
      if (combinedSignal.signal.aborted) {
        return {
          status: "cancelled",
          content: "任务已取消",
        };
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return {
        status: "error",
        content: "任务执行失败",
        error: errorMessage,
      };
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", abortHandler);
    }
  }

  /**
   * 获取隔离工具集
   *
   * 返回排除消息和子智能体创建工具后的工具定义。
   * 子智能体不能发送消息或创建更多子智能体。
   *
   * @returns 工具定义列表
   */
  getIsolatedTools(): ToolDefinition[] {
    const allTools = this.tools.getDefinitions();

    return allTools.filter((tool) => {
      // 使用精确匹配而非包含，避免误判
      return !EXCLUDED_TOOLS.has(tool.name.toLowerCase());
    });
  }

  /**
   * 构建子智能体 System Prompt
   *
   * @returns 系统提示词
   */
  buildSystemPrompt(): string {
    let prompt = SUBAGENT_SYSTEM_PROMPT;

    // 添加工作空间信息
    prompt += `\n\n当前工作空间: ${this.workspace}`;

    // 添加可用工具列表
    const availableTools = this.getIsolatedTools();
    if (availableTools.length > 0) {
      const toolNames = availableTools.map((t) => t.name).join(", ");
      prompt += `\n\n可用工具: ${toolNames}`;
    }

    return prompt;
  }

  // ============================================
  // 私有方法
  // ============================================

  /**
   * 执行工具调用
   *
   * @param toolCall - 工具调用
   * @returns 执行结果
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
}
