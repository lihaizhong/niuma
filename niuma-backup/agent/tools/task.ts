/**
 * 任务工具
 *
 * 提供任务创建、完成、查询的 LLM 工具
 */

import { z } from "zod";

import { BaseTool } from "./base";

import type { TaskTracker } from "../task-tracker";

export class StartTaskTool extends BaseTool {
  readonly name = "start_task";
  readonly description =
    "开始一个新任务。将任务状态设置为进行中，并返回任务详情。";
  readonly parameters = z.object({
    name: z.string().describe("任务名称"),
    description: z.string().optional().describe("任务描述"),
  });

  private tracker: TaskTracker | null = null;

  setTracker(tracker: TaskTracker): void {
    this.tracker = tracker;
  }

  async execute(args: { name: string; description?: string }): Promise<string> {
    if (!this.tracker) {
      return "错误: 任务追踪器未初始化";
    }

    const task = await this.tracker.createTask({
      name: args.name,
      description: args.description,
    });

    await this.tracker.startTask(task.id);

    return `任务已创建并开始:\n- ID: ${task.id}\n- 名称: ${task.name}\n- 描述: ${task.description ?? "无"}`;
  }
}

export class CompleteTaskTool extends BaseTool {
  readonly name = "complete_task";
  readonly description = "标记指定任务为已完成。";
  readonly parameters = z.object({
    task_id: z.string().describe("要完成的任务 ID"),
  });

  private tracker: TaskTracker | null = null;

  setTracker(tracker: TaskTracker): void {
    this.tracker = tracker;
  }

  async execute(args: { task_id: string }): Promise<string> {
    if (!this.tracker) {
      return "错误: 任务追踪器未初始化";
    }

    const task = await this.tracker.completeTask(args.task_id);

    if (!task) {
      return `错误: 任务 ${args.task_id} 不存在`;
    }

    const progress = await this.tracker.getProgress();

    return `任务 ${task.name} 已完成!\n进度: ${progress.completed}/${progress.total} (${progress.percentage}%)`;
  }
}

export class QueryTasksTool extends BaseTool {
  readonly name = "query_tasks";
  readonly description =
    "查询任务列表，可以按状态筛选。显示所有任务或特定状态的任务。";
  readonly parameters = z.object({
    status: z
      .enum(["pending", "in_progress", "completed", "failed", "all"])
      .optional()
      .describe("任务状态筛选（默认: all）"),
    include_progress: z
      .boolean()
      .optional()
      .describe("是否包含进度信息（默认: true）"),
  });

  private tracker: TaskTracker | null = null;

  setTracker(tracker: TaskTracker): void {
    this.tracker = tracker;
  }

  async execute(args: {
    status?: "pending" | "in_progress" | "completed" | "failed" | "all";
    include_progress?: boolean;
  }): Promise<string> {
    if (!this.tracker) {
      return "错误: 任务追踪器未初始化";
    }

    let tasks;
    const status = args.status ?? "all";

    switch (status) {
      case "pending":
        tasks = await this.tracker.getPendingTasks();
        break;
      case "in_progress":
        tasks = await this.tracker.getAllTasks();
        tasks = tasks.filter((t) => t.status === "in_progress");
        break;
      case "completed":
        tasks = await this.tracker.getCompletedTasks();
        break;
      case "failed":
        tasks = await this.tracker.getAllTasks();
        tasks = tasks.filter((t) => t.status === "failed");
        break;
      default:
        tasks = await this.tracker.getAllTasks();
    }

    if (tasks.length === 0) {
      return `没有${status === "all" ? "" : status}任务`;
    }

    const lines: string[] = [`## ${status === "all" ? "所有" : status}任务\n`];

    for (const task of tasks) {
      const statusIcon =
        task.status === "completed"
          ? "✅"
          : task.status === "in_progress"
            ? "🔄"
            : task.status === "failed"
              ? "❌"
              : "⏳";
      lines.push(`${statusIcon} [${task.id}] ${task.name}`);
      if (task.description) {
        lines.push(`   ${task.description}`);
      }
    }

    if (args.include_progress !== false) {
      const progress = await this.tracker.getProgress();
      lines.push(`\n进度: ${progress.completed}/${progress.total} (${progress.percentage}%)`);
    }

    return lines.join("\n");
  }
}

export class GetNextTaskTool extends BaseTool {
  readonly name = "get_next_task";
  readonly description =
    "获取下一个待处理任务。如果没有待处理任务，返回空。";
  readonly parameters = z.object({});

  private tracker: TaskTracker | null = null;

  setTracker(tracker: TaskTracker): void {
    this.tracker = tracker;
  }

  async execute(_args: Record<string, unknown>): Promise<string> {
    if (!this.tracker) {
      return "错误: 任务追踪器未初始化";
    }

    const task = await this.tracker.getNextPendingTask();

    if (!task) {
      const progress = await this.tracker.getProgress();
      if (progress.total === 0) {
        return "没有任务。请使用 start_task 创建任务。";
      }
      return `所有任务已完成！\n最终进度: ${progress.completed}/${progress.total} (${progress.percentage}%)`;
    }

    await this.tracker.startTask(task.id);

    return `下一个任务:\n- ID: ${task.id}\n- 名称: ${task.name}\n- 描述: ${task.description ?? "无"}`;
  }
}

export const startTaskTool = new StartTaskTool();
export const completeTaskTool = new CompleteTaskTool();
export const queryTasksTool = new QueryTasksTool();
export const getNextTaskTool = new GetNextTaskTool();
