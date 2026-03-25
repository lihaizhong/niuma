/**
 * 初始化项目工具
 *
 * 提供项目初始化功能
 */

import { nanoid } from "nanoid";

import { createLogger } from "../../log";
import { Initializer } from "../init-exec/initializer";

const logger = createLogger("tool:initialize-project");

export interface InitializeProjectInput {
  /** 项目规范描述 */
  projectSpec?: string;
  /** 项目名称 */
  projectName?: string;
  /** 目录结构 */
  structure?: string[];
  /** 初始化命令 */
  initCommands?: string[];
}

export interface InitializeProjectOutput {
  success: boolean;
  projectId: string;
  created: string[];
  errors: string[];
}

export async function initializeProject(
  input: InitializeProjectInput,
  workspace: string
): Promise<InitializeProjectOutput> {
  const projectId = nanoid(8);

  logger.info({ projectId, workspace }, "开始初始化项目");

  try {
    const initializer = new Initializer({
      workspace,
      config: {
        projectSpec: input.projectSpec ?? "",
        projectName: input.projectName ?? "new-project",
        structure: input.structure ?? ["src", "tests", "docs"],
        initialFiles: {},
        initCommands: input.initCommands ?? [],
      },
    });

    const result = await initializer.initialize();

    return {
      success: result.success,
      projectId,
      created: result.created,
      errors: result.errors,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ projectId, error: message }, "项目初始化失败");

    return {
      success: false,
      projectId,
      created: [],
      errors: [message],
    };
  }
}

export const initializeProjectTool = {
  name: "initialize_project",
  description: "Initialize a new project with specified structure and configuration",
  inputSchema: {
    type: "object",
    properties: {
      projectSpec: {
        type: "string",
        description: "Project specification or description",
      },
      projectName: {
        type: "string",
        description: "Name of the project",
        default: "new-project",
      },
      structure: {
        type: "array",
        items: { type: "string" },
        description: "Directory structure to create",
        default: ["src", "tests", "docs"],
      },
      initCommands: {
        type: "array",
        items: { type: "string" },
        description: "Commands to run during initialization",
      },
    },
  },
};
