/**
 * 子智能体模块 - 统一导出
 */

// ==================== 类型导出 ====================
export {
  type TaskStatus,
  type TaskResult,
  type SubagentSpawnOptions,
  type RunningTask,
  type TaskInfo,
  type TaskOrigin,
  type SubagentExecutorConfig,
  type ExecuteOptions,
  type ExecuteResult,
  type SubagentManagerConfig,
  MAX_ITERATIONS,
  MAX_CONCURRENT_TASKS,
  TASK_TIMEOUT,
  SUBAGENT_SYSTEM_PROMPT,
  EXCLUDED_TOOLS,
} from "./types";

// ==================== 类导出 ====================
export { SubagentExecutor } from "./executor";
export { SubagentManager } from "./manager";
