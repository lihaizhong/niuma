/**
 * Spawn 工具
 * LLM 可调用的子智能体创建工具
 *
 * 职责：
 * - 接收 LLM 调用
 * - 委托给 SubagentManager 创建任务
 * - 返回任务 ID 给 LLM
 */

// ==================== 第三方库 ====================
import { z } from "zod";

// ==================== 本地模块 ====================
import { ToolExecutionError } from "../../types/error";

import { BaseTool } from "./base";
import { getGlobalSubagentManager } from "./context";

// ==================== 类型定义 ====================

/**
 * Spawn 工具参数
 */
interface SpawnToolArgs {
  /** 任务描述（必填） */
  task: string;
  /** 任务标签（可选） */
  label?: string;
}

// ==================== 类定义 ====================

/**
 * Spawn 工具
 *
 * 用于创建后台子智能体任务。LLM 可以调用此工具
 * 将复杂任务委托给子智能体独立执行。
 *
 * @example
 * ```typescript
 * // LLM 调用示例
 * {
 *   "task": "分析项目结构并生成文档",
 *   "label": "文档生成"
 * }
 * ```
 */
export class SpawnTool extends BaseTool {
  readonly name = "spawn";
  readonly description =
    "创建后台子智能体任务，独立执行复杂操作。任务完成后会通过系统消息通知结果。";
  readonly parameters = z.object({
    task: z.string().describe("任务描述，详细说明需要子智能体完成的工作"),
    label: z.string().optional().describe("任务标签，用于显示和识别"),
  });

  /**
   * 执行 spawn 工具
   *
   * @param args - 工具参数
   * @returns 任务创建结果
   */
  async execute(args: SpawnToolArgs): Promise<string> {
    const { task, label } = args;

    // 验证必填参数
    if (!task || task.trim().length === 0) {
      throw new ToolExecutionError(this.name, "任务描述不能为空");
    }

    // 获取全局 SubagentManager
    let manager;
    try {
      manager = getGlobalSubagentManager();
    } catch {
      throw new ToolExecutionError(
        this.name,
        "SubagentManager 未初始化，无法创建子智能体任务",
      );
    }

    // 创建任务
    try {
      const taskId = await manager.spawn({
        task: task.trim(),
        label: label?.trim() || "后台任务",
        originChannel: "cli",
        originChatId: "default",
      });

      return `后台任务已创建（ID: ${taskId}，标签: ${label || "后台任务"}）\n任务完成后将通过系统消息通知结果。`;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ToolExecutionError(this.name, `创建任务失败: ${message}`);
    }
  }
}

// ==================== 导出 ====================

/** Spawn 工具实例 */
export const spawnTool = new SpawnTool();