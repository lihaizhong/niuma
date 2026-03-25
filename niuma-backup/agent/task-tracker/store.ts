/**
 * PROGRESS.json 持久化存储
 *
 * 提供原子写入和并发安全的文件操作
 */

import { join } from "path";

import fs from "fs-extra";
import { nanoid } from "nanoid";

import { createLogger } from "../../log";

import { DEFAULT_TASK_TRACKER_CONFIG } from "./types";

import type {
  Task,
  TaskStatus,
  ProgressState,
  CreateTaskOptions,
  UpdateTaskOptions,
  TaskTrackerConfig,
} from "./types";

const logger = createLogger("task-tracker-store");

export class TaskTrackerStore {
  private workspace: string;
  private config: TaskTrackerConfig;
  private progressFile: string;
  private state: ProgressState | null = null;

  constructor(workspace: string, config?: Partial<TaskTrackerConfig>) {
    this.workspace = workspace;
    this.config = { ...DEFAULT_TASK_TRACKER_CONFIG, ...config };
    this.progressFile = join(workspace, this.config.progressFileName);
  }

  async initialize(projectName: string): Promise<ProgressState> {
    const existing = await this.load();

    if (existing && existing.project === projectName) {
      this.state = existing;
      return existing;
    }

    const now = new Date().toISOString();
    this.state = {
      project: projectName,
      tasks: [],
      current: 0,
      completed: [],
      createdAt: now,
      updatedAt: now,
    };

    await this.save();
    logger.info({ project: projectName }, "任务追踪器初始化成功");

    return this.state;
  }

  async load(): Promise<ProgressState | null> {
    try {
      const content = await fs.readFile(this.progressFile, "utf-8");
      this.state = JSON.parse(content);
      return this.state;
    } catch {
      return null;
    }
  }

  async save(): Promise<void> {
    if (!this.state) {
      return;
    }

    this.state.updatedAt = new Date().toISOString();

    if (this.config.backupEnabled) {
      await this._createBackup();
    }

    await this._atomicWrite();
  }

  async createTask(options: CreateTaskOptions): Promise<Task> {
    if (!this.state) {
      throw new Error("追踪器未初始化");
    }

    const now = new Date().toISOString();
    const task: Task = {
      id: nanoid(8),
      name: options.name,
      description: options.description,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    this.state.tasks.push(task);
    await this.save();

    logger.debug({ taskId: task.id, name: task.name }, "任务创建成功");
    return task;
  }

  async updateTask(options: UpdateTaskOptions): Promise<Task | null> {
    if (!this.state) {
      throw new Error("追踪器未初始化");
    }

    const taskIndex = this.state.tasks.findIndex((t) => t.id === options.id);
    if (taskIndex === -1) {
      return null;
    }

    const task = this.state.tasks[taskIndex];

    if (options.status !== undefined) {
      const oldStatus = task.status;
      task.status = options.status;

      if (options.status === "completed" && !this.state.completed.includes(task.id)) {
        this.state.completed.push(task.id);
        this._advanceCurrent();
      } else if (options.status !== "completed" && oldStatus === "completed") {
        this.state.completed = this.state.completed.filter((id) => id !== task.id);
      }
    }

    if (options.name !== undefined) {
      task.name = options.name;
    }

    if (options.description !== undefined) {
      task.description = options.description;
    }

    task.updatedAt = new Date().toISOString();
    await this.save();

    logger.debug({ taskId: task.id, status: task.status }, "任务更新成功");
    return task;
  }

  async deleteTask(taskId: string): Promise<boolean> {
    if (!this.state) {
      throw new Error("追踪器未初始化");
    }

    const taskIndex = this.state.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return false;
    }

    const task = this.state.tasks[taskIndex];
    this.state.tasks.splice(taskIndex, 1);
    this.state.completed = this.state.completed.filter((id) => id !== taskId);

    if (this.state.current >= this.state.tasks.length) {
      this.state.current = Math.max(0, this.state.tasks.length - 1);
    }

    await this.save();
    logger.debug({ taskId }, "任务删除成功");
    return true;
  }

  async getTask(taskId: string): Promise<Task | null> {
    if (!this.state) {
      return null;
    }

    return this.state.tasks.find((t) => t.id === taskId) ?? null;
  }

  async getNextPendingTask(): Promise<Task | null> {
    if (!this.state) {
      return null;
    }

    return this.state.tasks.find((t) => t.status === "pending") ?? null;
  }

  async getCurrentTask(): Promise<Task | null> {
    if (!this.state) {
      return null;
    }

    if (this.state.current >= this.state.tasks.length) {
      return null;
    }

    return this.state.tasks[this.state.current] ?? null;
  }

  async getAllTasks(): Promise<Task[]> {
    if (!this.state) {
      return [];
    }

    return [...this.state.tasks];
  }

  async getCompletedTasks(): Promise<Task[]> {
    if (!this.state) {
      return [];
    }

    return this.state.tasks.filter((t) => t.status === "completed");
  }

  async getPendingTasks(): Promise<Task[]> {
    if (!this.state) {
      return [];
    }

    return this.state.tasks.filter((t) => t.status === "pending");
  }

  async isComplete(): Promise<boolean> {
    if (!this.state) {
      return false;
    }

    return this.state.tasks.every((t) => t.status === "completed");
  }

  async getProgress(): Promise<{ completed: number; total: number; percentage: number }> {
    if (!this.state) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const completed = this.state.tasks.filter((t) => t.status === "completed").length;
    const total = this.state.tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }

  private _advanceCurrent(): void {
    if (!this.state) {
      return;
    }

    while (this.state.current < this.state.tasks.length) {
      const task = this.state.tasks[this.state.current];
      if (task.status === "pending" || task.status === "in_progress") {
        break;
      }
      this.state.current++;
    }
  }

  private async _createBackup(): Promise<void> {
    try {
      const backupFile = `${this.progressFile}.backup`;
      await fs.copy(this.progressFile, backupFile, { overwrite: true });
    } catch {
      logger.warn("创建备份失败");
    }
  }

  private async _atomicWrite(): Promise<void> {
    const tempPath = `${this.progressFile}.tmp`;
    const content = JSON.stringify(this.state, null, 2);

    await fs.writeFile(tempPath, content, "utf-8");
    await fs.rename(tempPath, this.progressFile);
  }
}
