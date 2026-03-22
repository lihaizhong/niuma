/**
 * Ralph Loops 引擎
 *
 * 实现长周期任务的持续工作循环
 */

import { createLogger } from "../../log";

import { CheckpointManager } from "./checkpoint";
import { DEFAULT_RALPH_CONFIG } from "./types";

import type { RalphLoopConfig, GoalState, RalphLoopState } from "./types";

const logger = createLogger("ralph-loop");

export interface RalphLoopOptions {
  config?: Partial<RalphLoopConfig>;
  checkpointDir?: string;
}

export class RalphLoops {
  private config: RalphLoopConfig;
  private states: Map<string, RalphLoopState> = new Map();
  private checkpointManager: CheckpointManager;

  constructor(options: RalphLoopOptions = {}) {
    this.config = { ...DEFAULT_RALPH_CONFIG, ...options.config };
    this.checkpointManager = new CheckpointManager({
      checkpointDir: options.checkpointDir ?? ".harness/checkpoints",
    });
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  enable(): void {
    this.config.enabled = true;
  }

  disable(): void {
    this.config.enabled = false;
  }

  startLoop(taskId: string, goal: string): void {
    const state: RalphLoopState = {
      taskId,
      iteration: 0,
      goalState: {
        originalGoal: goal,
        contextSummary: "",
        completedSteps: [],
        pendingSteps: [],
        lastCheckpoint: new Date().toISOString(),
      },
      isIdle: false,
      idleCount: 0,
    };

    this.states.set(taskId, state);
    logger.info({ taskId, goal }, "Ralph Loop 已启动");
  }

  shouldContinue(taskId: string, agentResponse: string): { shouldContinue: boolean; reason?: string } {
    const state = this.states.get(taskId);

    if (!state) {
      return { shouldContinue: false, reason: "No active loop" };
    }

    state.iteration++;

    if (state.iteration >= this.config.maxIterations) {
      return { shouldContinue: false, reason: "Max iterations reached" };
    }

    if (this._isCompletionClaim(agentResponse)) {
      return { shouldContinue: false, reason: "Agent claimed completion" };
    }

    if (this._isIdle(agentResponse)) {
      state.idleCount++;
      if (state.idleCount >= 3) {
        return { shouldContinue: false, reason: "Agent is idle" };
      }
    } else {
      state.idleCount = 0;
    }

    const shouldCheckpoint = state.iteration % this.config.checkpointInterval === 0;
    if (shouldCheckpoint) {
      state.goalState.lastCheckpoint = new Date().toISOString();
      logger.debug({ taskId, iteration: state.iteration }, "检查点已保存");
    }

    return { shouldContinue: true };
  }

  injectGoal(taskId: string): string | null {
    const state = this.states.get(taskId);

    if (!state) {
      return null;
    }

    if (!this.config.preserveGoal) {
      return null;
    }

    let inject = `## Current Goal\n${state.goalState.originalGoal}`;

    if (state.goalState.completedSteps.length > 0) {
      inject += `\n\n## Completed Steps\n${state.goalState.completedSteps.map((s) => `- ${s}`).join("\n")}`;
    }

    if (state.goalState.pendingSteps.length > 0) {
      inject += `\n\n## Pending Steps\n${state.goalState.pendingSteps.map((s) => `- ${s}`).join("\n")}`;
    }

    return inject;
  }

  addCompletedStep(taskId: string, step: string): void {
    const state = this.states.get(taskId);
    if (state) {
      state.goalState.completedSteps.push(step);
      state.idleCount = 0;
    }
  }

  setPendingSteps(taskId: string, steps: string[]): void {
    const state = this.states.get(taskId);
    if (state) {
      state.goalState.pendingSteps = steps;
    }
  }

  getState(taskId: string): RalphLoopState | undefined {
    return this.states.get(taskId);
  }

  async saveCheckpoint(taskId: string): Promise<void> {
    const state = this.states.get(taskId);
    if (state) {
      await this.checkpointManager.save(state);
      logger.debug({ taskId }, "检查点已保存");
    }
  }

  async restoreFromCheckpoint(taskId: string): Promise<boolean> {
    const state = await this.checkpointManager.restore(taskId);
    if (state) {
      this.states.set(taskId, state);
      logger.info({ taskId, iteration: state.iteration }, "从检查点恢复");
      return true;
    }
    return false;
  }

  async listCheckpoints(): Promise<string[]> {
    const checkpoints = await this.checkpointManager.list();
    return checkpoints.map((c) => c.taskId);
  }

  endLoop(taskId: string): void {
    this.states.delete(taskId);
    this.checkpointManager.delete(taskId).catch(() => {});
    logger.info({ taskId }, "Ralph Loop 已结束");
  }

  private _isCompletionClaim(response: string): boolean {
    const patterns = [
      /task\s+(?:is\s+)?complete/i,
      /all\s+done/i,
      /finished\s+successfully/i,
      /no\s+further\s+(?:action|task)/i,
    ];

    return patterns.some((p) => p.test(response));
  }

  private _isIdle(response: string): boolean {
    const lower = response.toLowerCase();
    const idlePatterns = [
      /^(?:ok|okay|sure|alright|done|no\s+problem)/i,
      /^(?:let\s+me|i'll|i\s+will)\s+check/i,
    ];

    return idlePatterns.some((p) => p.test(lower.trim()));
  }
}
