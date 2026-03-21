/**
 * Executor - 任务执行器
 *
 * 负责增量任务执行和进度管理
 */

import { join } from "path";
import fs from "fs-extra";
import { createLogger } from "../../log";
import type { ExecutorConfig, TaskContext, ExecutionResult } from "./types";
import { DEFAULT_EXECUTOR_CONFIG } from "./types";
import { TaskTracker } from "../task-tracker";
import { RalphLoops } from "../ralph";
import { SelfVerification } from "../verification";

const logger = createLogger("executor");

export interface ExecutorOptions {
  workspace: string;
  config?: Partial<ExecutorConfig>;
}

export class Executor {
  private config: ExecutorConfig;
  private workspace: string;
  private taskTracker: TaskTracker;
  private ralphLoops: RalphLoops;
  private selfVerification: SelfVerification;
  private currentTaskId: string | null = null;

  constructor(options: ExecutorOptions) {
    this.workspace = options.workspace;
    this.config = {
      projectRoot: options.workspace,
      verificationEnabled: DEFAULT_EXECUTOR_CONFIG.verificationEnabled ?? true,
      autoCommit: DEFAULT_EXECUTOR_CONFIG.autoCommit ?? false,
      ...options.config,
    };
    this.taskTracker = new TaskTracker({ workspace: options.workspace });
    this.ralphLoops = new RalphLoops();
    this.selfVerification = new SelfVerification();
  }

  async executeTask(taskId: string): Promise<ExecutionResult> {
    const errors: string[] = [];

    try {
      const task = await this.taskTracker.getTask(taskId);
      if (!task) {
        return {
          mode: "executor",
          success: false,
          taskId,
          output: "",
          errors: [`Task not found: ${taskId}`],
        };
      }

      this.currentTaskId = taskId;
      logger.info({ taskId }, "开始执行任务");

      await this.taskTracker.startTask(taskId);

      const context = this._buildContext(taskId, task.name);

      this.ralphLoops.startLoop(taskId, context);

      let iterations = 0;
      const maxIterations = 20;

      while (iterations < maxIterations) {
        const shouldContinue = this.ralphLoops.shouldContinue(
          taskId,
          `Iteration ${iterations}`
        );

        if (!shouldContinue.shouldContinue) {
          logger.info({ taskId, reason: shouldContinue.reason }, "任务终止");
          break;
        }

        iterations++;
      }

      await this.taskTracker.completeTask(taskId);

      if (this.config.autoCommit) {
        await this._commitChanges(taskId);
      }

      logger.info({ taskId, iterations }, "任务执行完成");

      return {
        mode: "executor",
        success: true,
        taskId,
        output: `Completed in ${iterations} iterations`,
        errors: [],
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      errors.push(error);
      logger.error({ taskId, error }, "任务执行失败");

      return {
        mode: "executor",
        success: false,
        taskId,
        output: "",
        errors,
      };
    } finally {
      this.currentTaskId = null;
    }
  }

  async executeBatch(taskIds: string[]): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    logger.info({ count: taskIds.length }, "开始批量执行");

    for (const taskId of taskIds) {
      const result = await this.executeTask(taskId);
      results.push(result);

      if (!result.success && !this.config.verificationEnabled) {
        logger.warn({ taskId }, "任务失败但继续执行");
      }
    }

    logger.info({ total: results.length }, "批量执行完成");

    return results;
  }

  async getNextPendingTask(): Promise<TaskContext | null> {
    const task = await this.taskTracker.getNextPendingTask();

    if (!task) {
      return null;
    }

    return {
      taskId: task.id,
      description: task.description ?? task.name,
      requirements: [],
      dependencies: [],
      estimatedSteps: 1,
    };
  }

  async pauseCurrentTask(): Promise<void> {
    if (this.currentTaskId) {
      logger.info({ taskId: this.currentTaskId }, "任务已暂停");
      this.ralphLoops.endLoop(this.currentTaskId);
      await this.taskTracker.updateTask({ id: this.currentTaskId, status: "pending" });
    }
  }

  private _buildContext(taskId: string, description: string): string {
    return `Task: ${description}
Task ID: ${taskId}
Instructions: Execute the task and verify completion.`;
  }

  private async _commitChanges(taskId: string): Promise<void> {
    logger.debug({ taskId }, "提交更改");
  }

  isExecuting(): boolean {
    return this.currentTaskId !== null;
  }

  getCurrentTaskId(): string | null {
    return this.currentTaskId;
  }
}
