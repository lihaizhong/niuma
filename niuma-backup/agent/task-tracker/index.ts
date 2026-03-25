/**
 * 任务追踪器 - 主模块
 *
 * 管理 PROGRESS.json 持久化任务状态，支持断点续执行
 */

import { createLogger } from "../../log";

import { TaskTrackerStore } from "./store";

import type {
  Task,
  TaskStatus,
  ProgressState,
  CreateTaskOptions,
  UpdateTaskOptions,
  TaskTrackerConfig,
} from "./types";

const logger = createLogger("task-tracker");

export interface TaskTrackerOptions {
  workspace: string;
  projectName?: string;
  config?: Partial<TaskTrackerConfig>;
}

export class TaskTracker {
  private store: TaskTrackerStore;
  private projectName: string;
  private initialized = false;

  constructor(options: TaskTrackerOptions) {
    this.store = new TaskTrackerStore(options.workspace, options.config);
    this.projectName = options.projectName ?? "default";
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn("任务追踪器已初始化，跳过");
      return;
    }

    await this.store.initialize(this.projectName);
    this.initialized = true;
    logger.info({ project: this.projectName }, "任务追踪器初始化完成");
  }

  async createTask(options: CreateTaskOptions): Promise<Task> {
    await this._ensureInitialized();
    return this.store.createTask(options);
  }

  async createTasks(optionsList: CreateTaskOptions[]): Promise<Task[]> {
    await this._ensureInitialized();
    const tasks: Task[] = [];

    for (const options of optionsList) {
      const task = await this.store.createTask(options);
      tasks.push(task);
    }

    return tasks;
  }

  async startTask(taskId: string): Promise<Task | null> {
    await this._ensureInitialized();
    return this.store.updateTask({ id: taskId, status: "in_progress" });
  }

  async completeTask(taskId: string): Promise<Task | null> {
    await this._ensureInitialized();
    return this.store.updateTask({ id: taskId, status: "completed" });
  }

  async failTask(taskId: string): Promise<Task | null> {
    await this._ensureInitialized();
    return this.store.updateTask({ id: taskId, status: "failed" });
  }

  async updateTask(options: UpdateTaskOptions): Promise<Task | null> {
    await this._ensureInitialized();
    return this.store.updateTask(options);
  }

  async getTask(taskId: string): Promise<Task | null> {
    await this._ensureInitialized();
    return this.store.getTask(taskId);
  }

  async getCurrentTask(): Promise<Task | null> {
    await this._ensureInitialized();
    return this.store.getCurrentTask();
  }

  async getNextPendingTask(): Promise<Task | null> {
    await this._ensureInitialized();
    return this.store.getNextPendingTask();
  }

  async getAllTasks(): Promise<Task[]> {
    await this._ensureInitialized();
    return this.store.getAllTasks();
  }

  async getCompletedTasks(): Promise<Task[]> {
    await this._ensureInitialized();
    return this.store.getCompletedTasks();
  }

  async getPendingTasks(): Promise<Task[]> {
    await this._ensureInitialized();
    return this.store.getPendingTasks();
  }

  async deleteTask(taskId: string): Promise<boolean> {
    await this._ensureInitialized();
    return this.store.deleteTask(taskId);
  }

  async isComplete(): Promise<boolean> {
    await this._ensureInitialized();
    return this.store.isComplete();
  }

  async getProgress(): Promise<{ completed: number; total: number; percentage: number }> {
    await this._ensureInitialized();
    return this.store.getProgress();
  }

  async getState(): Promise<ProgressState | null> {
    const state = await this.store.load();
    return state;
  }

  private async _ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

export * from "./types";
