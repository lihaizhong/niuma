/**
 * Shell 工具
 * 提供安全的 Shell 命令执行功能，包含危险命令黑名单防护
 */

// ==================== 内置库 ====================
import { spawn, exec as execSync } from "child_process";
import { promisify } from "util";

// ==================== 第三方库 ====================
import * as p from "@clack/prompts";
import chalk from "chalk";
import { z } from "zod";

// ==================== 本地模块 ====================
import { ToolExecutionError } from "../../types/error";

import { BaseTool } from "./base";

// ==================== 常量定义 ====================
const execAsync = promisify(execSync);

/**
 * 危险命令黑名单模式
 */
const DENY_PATTERNS = [
  {
    pattern: /\brm\s+-[rf]{1,2}\b/,
    description: "删除命令（rm -r, rm -rf）",
    requireConfirmation: true,
  },
  {
    pattern: /\bdel\s+[fq]\b/,
    description: "删除命令（del /f, del /q）",
    requireConfirmation: true,
  },
  {
    pattern: /\brmdir\s+\/s\b/,
    description: "删除目录（rmdir /s）",
    requireConfirmation: true,
  },
  {
    pattern: /\b(shutdown|reboot|poweroff)\b/,
    description: "系统电源命令",
    requireConfirmation: false, // 拒绝执行
  },
  {
    pattern: /:\(\)\s*\{.*\};\s*:/,
    description: "Fork Bomb",
    requireConfirmation: false, // 拒绝执行
  },
  {
    pattern: /\bmkfs\b/,
    description: "格式化文件系统",
    requireConfirmation: false,
  },
  {
    pattern: /\bdd\s+if=/,
    description: "直接写入磁盘（dd）",
    requireConfirmation: true,
  },
];

// ==================== 工具函数 ====================

/**
 * 检测非交互环境
 */
function isNonInteractiveEnvironment(): boolean {
  return (
    process.env.CI === "true" ||
    process.env.CI === "1" ||
    process.env.DOCKER === "true" ||
    process.env.TERM === "dumb" ||
    !process.stdout.isTTY
  );
}

/**
 * 检查命令是否危险
 */
function isDangerousCommand(command: string, args?: string[]): {
  isDangerous: boolean;
  description?: string;
  requireConfirmation: boolean;
} {
  // 构建完整的命令字符串用于检测
  const fullCommand = args ? `${command} ${args.join(" ")}` : command;

  for (const deny of DENY_PATTERNS) {
    if (deny.pattern.test(fullCommand)) {
      return {
        isDangerous: true,
        description: deny.description,
        requireConfirmation: deny.requireConfirmation,
      };
    }
  }
  return { isDangerous: false, requireConfirmation: false };
}

// ==================== 类定义 ====================

/**
 * Exec 工具：执行 Shell 命令
 */
export class ExecTool extends BaseTool {
  readonly name = "exec";
  readonly description =
    "执行 Shell 命令。包含危险命令黑名单防护。支持工作目录、环境变量、超时控制等。";
  readonly parameters = z.object({
    command: z.string().describe("要执行的命令"),
    args: z.array(z.string()).optional().describe("命令参数数组"),
    cwd: z.string().optional().describe("工作目录"),
    env: z.record(z.string(), z.string()).optional().describe("环境变量"),
    timeout: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("超时时间（毫秒）"),
    runInBackground: z.boolean().optional().describe("是否在后台运行"),
    strict: z.boolean().optional().describe("严格模式（非零退出码抛出异常）"),
    yes: z.boolean().optional().describe("跳过危险命令确认（--yes/-y）"),
  });

  async execute(args: {
    command: string;
    args?: string[];
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
    runInBackground?: boolean;
    strict?: boolean;
    yes?: boolean;
  }): Promise<string> {
    const {
      command,
      args: cmdArgs = [],
      cwd,
      env,
      timeout = 30000,
      runInBackground = false,
      strict = false,
      yes = false,
    } = args;

    // 检查危险命令
    const dangerCheck = isDangerousCommand(command, cmdArgs);
    if (dangerCheck.isDangerous) {
      if (!dangerCheck.requireConfirmation) {
        throw new ToolExecutionError(
          this.name,
          `拒绝执行危险命令: ${command} (${dangerCheck.description})`,
        );
      }

      // 用户确认机制
      if (!yes && !isNonInteractiveEnvironment()) {
        const confirmation = await p.confirm({
          message: `${chalk.yellow("⚠️ 危险命令警告")}\n\n${chalk.red(dangerCheck.description)}\n\n${chalk.gray(`命令: ${command} ${cmdArgs.join(" ")}`)}\n\n${chalk.yellow("确认执行？")}`,
        });

        if (confirmation !== true) {
          throw new ToolExecutionError(
            this.name,
            `用户取消执行危险命令: ${command}`,
          );
        }
      } else if (isNonInteractiveEnvironment()) {
        // 非交互环境，使用 --yes 参数
        if (!yes) {
          throw new ToolExecutionError(
            this.name,
            `非交互环境，危险命令需要使用 --yes 参数: ${command} (${dangerCheck.description})`,
          );
        }
      }
    }

    try {
      if (runInBackground) {
        // 后台执行
        return new Promise((resolve) => {
          const childProcess = spawn(command, cmdArgs, {
            cwd,
            env: { ...process.env, ...env },
            detached: true,
            stdio: "ignore",
          });

          childProcess.unref();
          resolve(`后台进程已启动，PID: ${childProcess.pid}`);
        });
      } else {
        // 同步执行
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const result = await execAsync(`${command} ${cmdArgs.join(" ")}`, {
            cwd,
            env: { ...process.env, ...env },
            signal: controller.signal as unknown as AbortSignal,
          });

          clearTimeout(timeoutId);

          const output = result.stdout.trim();
          const stderr = result.stderr.trim();

          if (stderr) {
            return `${output}\n[stderr]\n${stderr}`;
          }

          return output;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }

      const execError = error as {
        stdout?: string;
        stderr?: string;
        message?: string;
        code?: number;
        name?: string;
      };
      const stdout = execError.stdout || "";
      const stderr = execError.stderr || "";
      const exitCode = execError.code || -1;

      // 如果是超时错误或严格模式，抛出异常
      if (strict || execError.name === "AbortError") {
        throw new ToolExecutionError(
          this.name,
          `命令执行失败（退出码: ${exitCode}）\n[stdout]\n${stdout}\n[stderr]\n${stderr}\n[错误]\n${execError.message}`,
        );
      }

      // 否则返回错误信息
      return `命令执行失败（退出码: ${exitCode}）\n[stdout]\n${stdout}\n[stderr]\n${stderr}\n[错误]\n${execError.message}`;
    }
  }
}

// 导出工具实例
export const execTool = new ExecTool();
