/**
 * 检查点管理模块
 *
 * 提供 Ralph Loops 的状态持久化和恢复能力
 */

import { join } from "path";

import fs from "fs-extra";

import { createLogger } from "../../log";

import type { GoalState, RalphLoopState } from "./types";

const logger = createLogger("ralph-checkpoint");

export interface Checkpoint {
  taskId: string;
  goalState: GoalState;
  iteration: number;
  idleCount: number;
  createdAt: string;
  version: string;
}

export interface CheckpointManagerOptions {
  checkpointDir: string;
  maxCheckpoints: number;
}

export class CheckpointManager {
  private options: CheckpointManagerOptions;
  private checkpoints: Map<string, Checkpoint> = new Map();

  constructor(options: Partial<CheckpointManagerOptions> = {}) {
    this.options = {
      checkpointDir: ".harness/checkpoints",
      maxCheckpoints: 10,
      ...options,
    };
  }

  async initialize(): Promise<void> {
    await fs.ensureDir(this.options.checkpointDir);
    await this._loadCheckpoints();
  }

  async save(state: RalphLoopState): Promise<void> {
    await this.initialize();

    const checkpoint: Checkpoint = {
      taskId: state.taskId,
      goalState: state.goalState,
      iteration: state.iteration,
      idleCount: state.idleCount,
      createdAt: new Date().toISOString(),
      version: "1.0.0",
    };

    this.checkpoints.set(state.taskId, checkpoint);
    await this._persistCheckpoint(state.taskId);
    await this._cleanupOldCheckpoints();

    logger.debug({ taskId: state.taskId, iteration: state.iteration }, "检查点已保存");
  }

  async load(taskId: string): Promise<Checkpoint | null> {
    await this.initialize();
    return this.checkpoints.get(taskId) ?? null;
  }

  async delete(taskId: string): Promise<void> {
    await this.initialize();

    this.checkpoints.delete(taskId);

    const files = await fs.readdir(this.options.checkpointDir);
    const match = files.find((f) => f.startsWith(taskId));

    if (match) {
      await fs.remove(join(this.options.checkpointDir, match));
    }

    logger.debug({ taskId }, "检查点已删除");
  }

  async list(): Promise<Checkpoint[]> {
    await this.initialize();
    return Array.from(this.checkpoints.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async restore(taskId: string): Promise<RalphLoopState | null> {
    const checkpoint = await this.load(taskId);

    if (!checkpoint) {
      return null;
    }

    return {
      taskId: checkpoint.taskId,
      iteration: checkpoint.iteration,
      goalState: checkpoint.goalState,
      isIdle: false,
      idleCount: checkpoint.idleCount,
    };
  }

  private async _loadCheckpoints(): Promise<void> {
    try {
      const files = await fs.readdir(this.options.checkpointDir);
      const checkpointFiles = files.filter((f) => f.endsWith(".json"));

      for (const file of checkpointFiles) {
        try {
          const data = await fs.readJson(join(this.options.checkpointDir, file));
          if (data.taskId && data.goalState) {
            this.checkpoints.set(data.taskId, data as Checkpoint);
          }
        } catch {
          logger.warn({ file }, "加载检查点失败");
        }
      }
    } catch {
      this.checkpoints = new Map();
    }
  }

  private async _persistCheckpoint(taskId: string): Promise<void> {
    const checkpoint = this.checkpoints.get(taskId);
    if (!checkpoint) return;

    const filePath = join(this.options.checkpointDir, `${taskId}.json`);
    await fs.writeJson(filePath, checkpoint, { spaces: 2 });
  }

  private async _cleanupOldCheckpoints(): Promise<void> {
    if (this.checkpoints.size <= this.options.maxCheckpoints) {
      return;
    }

    const sorted = Array.from(this.checkpoints.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const toRemove = sorted.slice(this.options.maxCheckpoints);

    for (const checkpoint of toRemove) {
      await this.delete(checkpoint.taskId);
    }
  }
}
