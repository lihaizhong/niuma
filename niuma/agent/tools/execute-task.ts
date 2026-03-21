/**
 * 执行任务工具
 *
 * 提供任务执行功能
 */

import { createLogger } from "../../log";
import { TaskTracker } from "../task-tracker";
import { nanoid } from "nanoid";

const logger = createLogger("tool:execute-task");

export interface ExecuteTaskInput {
  /** 任务名称 */
  taskName: string;
  /** 任务描述 */
  description?: string;
  /** 验证命令 */
  verifyCommand?: string;
}

export interface ExecuteTaskOutput {
  success: boolean;
  taskId: string;
  output: string;
  errors: string[];
}

export async function executeTask(
  input: ExecuteTaskInput,
  workspace: string
): Promise<ExecuteTaskOutput> {
  const taskId = nanoid(8);

  logger.info({ taskId, taskName: input.taskName }, "开始执行任务");

  try {
    const taskTracker = new TaskTracker({ workspace });

    const task = await taskTracker.createTask({
      name: input.taskName,
      description: input.description,
    });

    await taskTracker.startTask(task.id);

    logger.info({ taskId: task.id }, "任务已启动");

    return {
      success: true,
      taskId: task.id,
      output: `Task "${input.taskName}" started with ID: ${task.id}`,
      errors: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ taskId, error: message }, "任务执行失败");

    return {
      success: false,
      taskId,
      output: "",
      errors: [message],
    };
  }
}

export const executeTaskTool = {
  name: "execute_task",
  description: "Execute a named task with optional verification",
  inputSchema: {
    type: "object",
    properties: {
      taskName: {
        type: "string",
        description: "Name of the task to execute",
      },
      description: {
        type: "string",
        description: "Detailed description of the task",
      },
      verifyCommand: {
        type: "string",
        description: "Command to verify task completion",
      },
    },
    required: ["taskName"],
  },
};
