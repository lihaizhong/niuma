/**
 * 任务追踪器类型定义
 */

export interface Task {
  id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = "pending" | "in_progress" | "completed" | "failed";

export interface ProgressState {
  project: string;
  tasks: Task[];
  current: number;
  completed: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskOptions {
  name: string;
  description?: string;
}

export interface UpdateTaskOptions {
  id: string;
  status?: TaskStatus;
  name?: string;
  description?: string;
}

export interface TaskTrackerConfig {
  progressFileName: string;
  autoSave: boolean;
  backupEnabled: boolean;
}

export const DEFAULT_TASK_TRACKER_CONFIG: TaskTrackerConfig = {
  progressFileName: "PROGRESS.json",
  autoSave: true,
  backupEnabled: true,
};
