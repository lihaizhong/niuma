/**
 * Initializer-Executor 模式类型定义
 */

export interface InitializerConfig {
  projectSpec: string;
  projectName: string;
  structure: string[];
  initialFiles: Record<string, string>;
  initCommands: string[];
}

export interface ExecutorConfig {
  projectRoot: string;
  verificationEnabled: boolean;
  autoCommit: boolean;
}

export interface TaskContext {
  taskId: string;
  description: string;
  requirements: string[];
  dependencies: string[];
  estimatedSteps: number;
}

export type ExecutionMode = "initializer" | "executor" | "batch";

export interface ExecutionResult {
  mode: ExecutionMode;
  success: boolean;
  taskId?: string;
  output: string;
  errors: string[];
}

export const DEFAULT_INITIALIZER_CONFIG: Partial<InitializerConfig> = {
  structure: ["src", "tests", "docs"],
  initCommands: [],
};

export const DEFAULT_EXECUTOR_CONFIG: Partial<ExecutorConfig> = {
  verificationEnabled: true,
  autoCommit: false,
};
