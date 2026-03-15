/**
 * Git 操作工具
 * 提供 Git 版本控制操作功能，包括状态查看、代码提交、推送拉取、分支管理和日志查询
 */

// ==================== 第三方库 ====================
import { spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { z } from "zod";
import RE2 from "re2";

// ==================== 本地模块 ====================
import { SimpleTool } from "./base";
import { ToolExecutionError } from "../../types/error";

// ==================== 常量定义 ====================
const GIT_COMMAND_TIMEOUT = 30000; // 30 秒超时
const DEFAULT_LOG_COUNT = 10; // 默认显示 10 条提交
const MAX_LOG_COUNT = 50; // 最大显示 50 条提交

// ==================== 工具函数 ====================

/**
 * Git 命令执行辅助函数
 */
async function execGit(
  args: string[],
  cwd: string = process.cwd(),
): Promise<string> {
  return new Promise((resolve, reject) => {
    const gitProcess = spawn("git", args, {
      cwd,
      env: process.env,
      timeout: GIT_COMMAND_TIMEOUT,
    });

    let stdout = "";
    let stderr = "";

    gitProcess.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    gitProcess.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    gitProcess.on("close", (code) => {
      if (code === 0) {
        // Git 命令有时会将错误信息输出到 stderr，但命令仍然成功
        if (stderr && !stdout) {
          reject(new Error(stderr.trim()));
        } else {
          resolve(stdout.trim());
        }
      } else {
        reject(new Error(stderr.trim() || `Git 命令失败，退出码: ${code}`));
      }
    });

    gitProcess.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * Git 仓库检测函数
 */
async function isGitRepository(cwd: string = process.cwd()): Promise<boolean> {
  const gitDir = join(cwd, ".git");
  return existsSync(gitDir);
}

/**
 * 输出格式化函数（清理 ANSI 颜色代码）
 */
function formatGitOutput(output: string): string {
  // 移除 ANSI 颜色代码（使用 RE2 以避免控制字符问题）
  const ansiEscapeRegex = new RE2("\\x1b\\[[0-9;]*m", "g");
  return output.replace(ansiEscapeRegex, "");
}

// ==================== 工具实例导出 ====================

/**
 * GitStatus 工具：查看 Git 仓库状态
 */
export const gitStatusTool = new SimpleTool({
  name: "git_status",
  description:
    "查看 Git 仓库状态，包括修改的文件、暂存的文件、未跟踪的文件和分支信息。",
  parameters: z.object({}),
  handler: async () => {
    const cwd = process.cwd();

    // 检查是否为 Git 仓库
    if (!(await isGitRepository(cwd))) {
      throw new ToolExecutionError(
        "git_status",
        "当前目录不是 Git 仓库，请先初始化 Git 仓库（git init）",
      );
    }

    try {
      const output = await execGit(["status", "--porcelain", "--branch"], cwd);
      const formatted = formatGitOutput(output);

      if (!formatted) {
        return "工作区干净，没有未提交的更改";
      }

      // 解析状态输出
      const lines = formatted.split("\n");
      let branch = "";
      const changes: string[] = [];

      for (const line of lines) {
        if (line.startsWith("##")) {
          // 分支信息
          branch = line.substring(2).split("...")[0];
        } else if (line) {
          // 文件状态
          const status = line.substring(0, 2).trim();
          const file = line.substring(3);
          changes.push(`${status} ${file}`);
        }
      }

      let result = `当前分支: ${branch || "未知"}\n\n`;

      if (changes.length > 0) {
        result += "文件状态:\n";
        result += changes.map((c) => `  ${c}`).join("\n");
      } else {
        result += "工作区干净";
      }

      return result;
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }
      throw new ToolExecutionError(
        "git_status",
        `获取 Git 状态失败: ${(error as Error).message}`,
      );
    }
  },
});

/**
 * GitCommit 工具：创建 Git 提交
 */
export const gitCommitTool = new SimpleTool({
  name: "git_commit",
  description:
    "创建 Git 提交。可以提交所有暂存的更改，或指定文件路径提交特定文件。",
  parameters: z.object({
    message: z.string().min(1).describe("提交消息（必填）"),
    files: z
      .array(z.string())
      .optional()
      .describe("要提交的文件路径列表（可选，不指定则提交所有暂存的更改）"),
  }),
  handler: async (args) => {
    const { message, files } = args;
    const cwd = process.cwd();

    // 检查是否为 Git 仓库
    if (!(await isGitRepository(cwd))) {
      throw new ToolExecutionError("git_commit", "当前目录不是 Git 仓库");
    }

    // 检查提交消息
    if (!message.trim()) {
      throw new ToolExecutionError("git_commit", "提交消息不能为空");
    }

    try {
      // 如果指定了文件，先暂存这些文件
      if (files && files.length > 0) {
        await execGit(["add", ...files], cwd);
      }

      // 检查是否有暂存的更改
      const status = await execGit(["diff", "--cached", "--name-only"], cwd);
      if (!status) {
        throw new ToolExecutionError(
          "git_commit",
          "没有暂存的更改可以提交。请先使用 git add 暂存文件，或检查文件状态。",
        );
      }

      // 创建提交
      const result = await execGit(["commit", "-m", message], cwd);
      const formatted = formatGitOutput(result);

      // 提取 commit hash
      const hashMatch = formatted.match(/\[([a-f0-9]+)\]/);
      const hash = hashMatch ? hashMatch[1] : "未知";

      return `提交成功\n提交哈希: ${hash}\n提交消息: ${message}`;
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }
      throw new ToolExecutionError(
        "git_commit",
        `提交失败: ${(error as Error).message}`,
      );
    }
  },
});

/**
 * GitPush 工具：推送提交到远程仓库
 */
export const gitPushTool = new SimpleTool({
  name: "git_push",
  description: "推送本地提交到远程仓库。默认推送到 origin 和当前分支。",
  parameters: z.object({
    remote: z.string().optional().describe("远程仓库名称（默认：origin）"),
    branch: z.string().optional().describe("分支名称（默认：当前分支）"),
  }),
  handler: async (args) => {
    const { remote = "origin", branch } = args;
    const cwd = process.cwd();

    // 检查是否为 Git 仓库
    if (!(await isGitRepository(cwd))) {
      throw new ToolExecutionError("git_push", "当前目录不是 Git 仓库");
    }

    try {
      // 获取当前分支（如果未指定）
      let targetBranch = branch;
      if (!targetBranch) {
        const branchOutput = await execGit(["branch", "--show-current"], cwd);
        targetBranch = branchOutput.trim();
        if (!targetBranch) {
          throw new ToolExecutionError("git_push", "无法确定当前分支");
        }
      }

      // 推送到远程
      const result = await execGit(["push", remote, targetBranch], cwd);
      const formatted = formatGitOutput(result);

      return `推送成功\n远程: ${remote}\n分支: ${targetBranch}\n${formatted}`;
    } catch (error) {
      const errorMessage = (error as Error).message || "未知错误";

      // 处理常见错误
      if (errorMessage.includes("authentication")) {
        throw new ToolExecutionError(
          "git_push",
          "认证失败，请检查您的凭据或使用 SSH",
        );
      }
      if (errorMessage.includes("behind")) {
        throw new ToolExecutionError(
          "git_push",
          "本地分支落后于远程，请先拉取最新更改（git pull）",
        );
      }
      if (errorMessage.includes("does not exist")) {
        throw new ToolExecutionError("git_push", `远程仓库 "${remote}" 不存在`);
      }

      throw new ToolExecutionError("git_push", `推送失败: ${errorMessage}`);
    }
  },
});

/**
 * GitPull 工具：从远程仓库拉取更改
 */
export const gitPullTool = new SimpleTool({
  name: "git_pull",
  description: "从远程仓库拉取并合并更改。默认从 origin 和当前分支拉取。",
  parameters: z.object({
    remote: z.string().optional().describe("远程仓库名称（默认：origin）"),
    branch: z.string().optional().describe("分支名称（默认：当前分支）"),
  }),
  handler: async (args) => {
    const { remote = "origin", branch } = args;
    const cwd = process.cwd();

    // 检查是否为 Git 仓库
    if (!(await isGitRepository(cwd))) {
      throw new ToolExecutionError("git_pull", "当前目录不是 Git 仓库");
    }

    try {
      // 获取当前分支（如果未指定）
      let targetBranch = branch;
      if (!targetBranch) {
        const branchOutput = await execGit(["branch", "--show-current"], cwd);
        targetBranch = branchOutput.trim();
        if (!targetBranch) {
          throw new ToolExecutionError("git_pull", "无法确定当前分支");
        }
      }

      // 从远程拉取
      const result = await execGit(["pull", remote, targetBranch], cwd);
      const formatted = formatGitOutput(result);

      if (formatted.includes("Already up to date")) {
        return `远程: ${remote}\n分支: ${targetBranch}\n状态: 已经是最新`;
      }

      return `拉取成功\n远程: ${remote}\n分支: ${targetBranch}\n${formatted}`;
    } catch (error) {
      const errorMessage = (error as Error).message || "未知错误";

      // 处理常见错误
      if (errorMessage.includes("authentication")) {
        throw new ToolExecutionError(
          "git_pull",
          "认证失败，请检查您的凭据或使用 SSH",
        );
      }
      if (errorMessage.includes("conflict")) {
        throw new ToolExecutionError(
          "git_pull",
          "合并冲突，请手动解决冲突后继续",
        );
      }
      if (errorMessage.includes("does not exist")) {
        throw new ToolExecutionError("git_pull", `远程仓库 "${remote}" 不存在`);
      }

      throw new ToolExecutionError("git_pull", `拉取失败: ${errorMessage}`);
    }
  },
});

/**
 * GitBranch 工具：管理 Git 分支（列出、创建、删除）
 */
export const gitBranchTool = new SimpleTool({
  name: "git_branch",
  description: "管理 Git 分支。可以列出所有分支、创建新分支或删除现有分支。",
  parameters: z.object({
    operation: z
      .enum(["list", "create", "delete"])
      .describe("操作类型：list（列出）、create（创建）、delete（删除）"),
    name: z.string().optional().describe("分支名称（创建或删除时必填）"),
  }),
  handler: async (args) => {
    const { operation, name } = args;
    const cwd = process.cwd();

    // 检查是否为 Git 仓库
    if (!(await isGitRepository(cwd))) {
      throw new ToolExecutionError("git_branch", "当前目录不是 Git 仓库");
    }

    try {
      switch (operation) {
        case "list": {
          const output = await execGit(
            ["branch", "--format=%(refname:short)"],
            cwd,
          );
          const branches = output.split("\n").filter(Boolean);
          const current = await execGit(["branch", "--show-current"], cwd);

          let result = "所有分支:\n";
          result += branches
            .map((b) => (b === current.trim() ? `* ${b} (当前)` : `  ${b}`))
            .join("\n");

          return result;
        }

        case "create": {
          if (!name) {
            throw new ToolExecutionError(
              "git_branch",
              "创建分支需要指定分支名称",
            );
          }

          // 检查分支是否已存在
          const existing = await execGit(["branch", "--list", name], cwd);
          if (existing.trim()) {
            throw new ToolExecutionError("git_branch", `分支 "${name}" 已存在`);
          }

          await execGit(["branch", name], cwd);
          return `成功创建分支: ${name}`;
        }

        case "delete": {
          if (!name) {
            throw new ToolExecutionError(
              "git_branch",
              "删除分支需要指定分支名称",
            );
          }

          // 检查是否为当前分支
          const current = await execGit(["branch", "--show-current"], cwd);
          if (current.trim() === name) {
            throw new ToolExecutionError(
              "git_branch",
              "无法删除当前分支，请先切换到其他分支",
            );
          }

          // 检查分支是否存在
          const existing = await execGit(["branch", "--list", name], cwd);
          if (!existing.trim()) {
            throw new ToolExecutionError("git_branch", `分支 "${name}" 不存在`);
          }

          await execGit(["branch", "-D", name], cwd);
          return `成功删除分支: ${name}`;
        }

        default:
          throw new ToolExecutionError(
            "git_branch",
            `不支持的操作: ${operation}`,
          );
      }
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }
      throw new ToolExecutionError(
        "git_branch",
        `分支操作失败: ${(error as Error).message}`,
      );
    }
  },
});

/**
 * GitLog 工具：查看提交历史
 */
export const gitLogTool = new SimpleTool({
  name: "git_log",
  description: "查看 Git 提交历史。可以指定显示的提交数量和分支。",
  parameters: z.object({
    count: z
      .number()
      .int()
      .positive()
      .max(MAX_LOG_COUNT)
      .optional()
      .describe("显示的提交数量（默认：10，最大：50）"),
    branch: z.string().optional().describe("分支名称（默认：当前分支）"),
  }),
  handler: async (args) => {
    const { count = DEFAULT_LOG_COUNT, branch } = args;
    const cwd = process.cwd();

    // 检查是否为 Git 仓库
    if (!(await isGitRepository(cwd))) {
      throw new ToolExecutionError("git_log", "当前目录不是 Git 仓库");
    }

    try {
      // 确定目标分支
      let targetBranch = branch;
      if (!targetBranch) {
        const branchOutput = await execGit(["branch", "--show-current"], cwd);
        targetBranch = branchOutput.trim();
      }

      // 检查分支是否存在
      if (targetBranch) {
        const existing = await execGit(["branch", "--list", targetBranch], cwd);
        if (!existing.trim()) {
          throw new ToolExecutionError(
            "git_log",
            `分支 "${targetBranch}" 不存在`,
          );
        }
      }

      // 获取提交历史
      const format = "%h|%an|%ad|%s";
      const output = await execGit(
        ["log", `-${count}`, `--pretty=format:${format}`, targetBranch],
        cwd,
      );
      const lines = output.split("\n").filter(Boolean);

      if (lines.length === 0) {
        return `分支 "${targetBranch || "当前"}" 没有提交历史`;
      }

      // 格式化输出
      let result = `提交历史 (${lines.length} 条):\n\n`;
      result += lines
        .map((line) => {
          const [hash, author, date, message] = line.split("|");
          return `${hash} | ${author} | ${date} | ${message}`;
        })
        .join("\n");

      // 检查是否有更多提交
      const totalCount = await execGit(
        ["rev-list", "--count", targetBranch],
        cwd,
      );
      const total = parseInt(totalCount.trim(), 10);
      if (total > count) {
        result += `\n\n... (还有 ${total - count} 条提交未显示)`;
      }

      return result;
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }
      throw new ToolExecutionError(
        "git_log",
        `获取提交历史失败: ${(error as Error).message}`,
      );
    }
  },
});
