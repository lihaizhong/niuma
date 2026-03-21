/**
 * Ralph Loops 类型定义
 */

export interface RalphLoopConfig {
  enabled: boolean;
  maxIterations: number;
  idleTimeout: number;
  checkpointInterval: number;
  preserveGoal: boolean;
}

export interface GoalState {
  originalGoal: string;
  contextSummary: string;
  completedSteps: string[];
  pendingSteps: string[];
  lastCheckpoint: string;
}

export interface RalphLoopState {
  taskId: string;
  iteration: number;
  goalState: GoalState;
  isIdle: boolean;
  idleCount: number;
}

export const DEFAULT_RALPH_CONFIG: RalphLoopConfig = {
  enabled: false,
  maxIterations: 100,
  idleTimeout: 300000,
  checkpointInterval: 10,
  preserveGoal: true,
};
