/**
 * 沙箱执行工具
 *
 * 提供在 Docker 沙箱中安全执行命令的能力
 */

import { z } from "zod";

import { ToolExecutionError } from "../../types/error";

import { BaseTool } from "./base";

import type { SandboxManager } from "../sandbox/manager";

export class SandboxExecTool extends BaseTool {
  readonly name = "sandbox_exec";
  readonly description =
    "在 Docker 沙箱中安全执行 Shell 命令。提供隔离的执行环境，支持资源限制和网络隔离。适用于需要安全执行的命令。";
  readonly parameters = z.object({
    command: z.string().describe("要执行的命令"),
    args: z.array(z.string()).optional().describe("命令参数数组"),
    cwd: z.string().optional().describe("工作目录"),
    env: z.record(z.string(), z.string()).optional().describe("环境变量"),
    timeout: z.number().int().positive().optional().describe("超时时间（毫秒）"),
    network: z.enum(["isolated", "permitted"]).optional().describe("网络模式：isolated（隔离）或 permitted（允许）"),
  });

  private sandboxManager: SandboxManager | null = null;

  setSandboxManager(manager: SandboxManager): void {
    this.sandboxManager = manager;
  }

  async execute(args: {
    command: string;
    args?: string[];
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
    network?: "isolated" | "permitted";
  }): Promise<string> {
    if (!this.sandboxManager) {
      throw new ToolExecutionError(
        this.name,
        "沙箱管理器未初始化"
      );
    }

    try {
      const result = await this.sandboxManager.execute({
        command: args.command,
        args: args.args,
        cwd: args.cwd,
        env: args.env,
        timeout: args.timeout,
      });

      if (result.exitCode === 0) {
        return result.stdout || "命令执行成功（无输出）";
      } else {
        return `命令执行失败（退出码: ${result.exitCode}）\n${result.stderr}\n${result.stdout}`.trim();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ToolExecutionError(this.name, message);
    }
  }
}

export const sandboxExecTool = new SandboxExecTool();
