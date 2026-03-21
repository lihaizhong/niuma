/**
 * Initializer-Executor 主模块
 *
 * 支持项目初始化和增量任务执行的架构模式
 */

import { createLogger } from "../../log";
import { Initializer } from "./initializer";
import { Executor } from "./executor";
import type { InitializerConfig, ExecutorConfig, ExecutionMode, ExecutionResult } from "./types";

const logger = createLogger("init-exec");

export interface InitExecOptions {
  workspace: string;
  initializerConfig?: Partial<InitializerConfig>;
  executorConfig?: Partial<ExecutorConfig>;
}

export class InitializerExecutor {
  private workspace: string;
  private initializer: Initializer;
  private executor: Executor;
  private currentMode: ExecutionMode = "executor";

  constructor(options: InitExecOptions) {
    this.workspace = options.workspace;
    this.initializer = new Initializer({
      workspace: options.workspace,
      config: options.initializerConfig,
    });
    this.executor = new Executor({
      workspace: options.workspace,
      config: options.executorConfig,
    });
  }

  async initialize(): Promise<{ success: boolean; created: string[]; errors: string[] }> {
    this.currentMode = "initializer";
    const result = await this.initializer.initialize();
    this.currentMode = "executor";
    return result;
  }

  async executeTask(taskId: string): Promise<ExecutionResult> {
    this.currentMode = "executor";
    return this.executor.executeTask(taskId);
  }

  async executeBatch(taskIds: string[]): Promise<ExecutionResult[]> {
    this.currentMode = "batch";
    return this.executor.executeBatch(taskIds);
  }

  async switchToInitializer(config: Partial<InitializerConfig>): Promise<void> {
    if (this.executor.isExecuting()) {
      await this.executor.pauseCurrentTask();
    }
    this.initializer = new Initializer({
      workspace: this.workspace,
      config: { ...this.initializer, ...config },
    });
    this.currentMode = "initializer";
    logger.info("切换到 Initializer 模式");
  }

  async switchToExecutor(config?: Partial<ExecutorConfig>): Promise<void> {
    if (config) {
      this.executor = new Executor({
        workspace: this.workspace,
        config,
      });
    }
    this.currentMode = "executor";
    logger.info("切换到 Executor 模式");
  }

  getMode(): ExecutionMode {
    return this.currentMode;
  }

  isInitialized(): boolean {
    return this.currentMode !== "initializer";
  }
}

export { Initializer, Executor };
export * from "./types";
