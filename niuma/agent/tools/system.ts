/**
 * 系统工具
 * 提供环境变量管理和进程管理功能
 */

// ==================== 内置库 ====================
import process from "node:process";

// ==================== 第三方库 ====================
import { z } from "zod";
import psTree from "ps-tree";

// ==================== 本地模块 ====================
import { BaseTool } from "./base";
import { ToolExecutionError } from "../../types/error";

// ==================== 常量定义 ====================
const MAX_PROCESS_LIMIT = 100; // 最大进程列表数量
const DEFAULT_PROCESS_LIMIT = 50; // 默认进程列表数量

// ==================== 类型定义 ====================

/**
 * 进程信息接口
 * ps-tree 返回的进程对象结构
 */
interface ProcessInfo {
  PID: string | number;
  PPID: string | number;
  COMMAND: string;
  STAT?: string;
}

// ==================== 工具函数 ====================

/**
 * 验证环境变量名称格式
 * 必须以字母或下划线开头，只能包含字母、数字和下划线
 */
function validateEnvName(name: string): void {
  const regex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  if (!regex.test(name)) {
    throw new ToolExecutionError(
      "env_set",
      "环境变量名称格式无效：必须以字母或下划线开头，只能包含字母、数字和下划线",
    );
  }
}

/**
 * 检查进程是否受保护
 */
function isProtectedProcess(pid: number): boolean {
  // PID 1 是 init/systemd 进程
  if (pid === 1) {
    return true;
  }
  // 不能终止自身进程
  if (pid === process.pid) {
    return true;
  }
  return false;
}

/**
 * 获取进程树中的所有进程 PID
 */
async function getProcessTreePids(pid: number): Promise<number[]> {
  return new Promise((resolve, reject) => {
    psTree(pid, (err, children) => {
      if (err) {
        reject(err);
        return;
      }
      const pids = [pid, ...children.map((child) => Number(child.PID))];
      resolve(pids);
    });
  });
}

// ==================== 类定义 ====================

/**
 * EnvGet 工具：读取环境变量
 */
export class EnvGetTool extends BaseTool {
  readonly name = "env_get";
  readonly description = "读取当前进程的环境变量。如果环境变量不存在，返回 null。";
  readonly parameters = z.object({
    name: z.string().min(1, "环境变量名称不能为空").describe("环境变量名称"),
  });

  async execute(args: z.infer<typeof this.parameters>): Promise<string> {
    const { name } = args;

    // 手动验证（双重检查）
    if (!name || name.trim().length === 0) {
      throw new ToolExecutionError(
        "env_get",
        "环境变量名称不能为空",
      );
    }

    const value = process.env[name] ?? null;

    return JSON.stringify({ value }, null, 2);
  }
}

/**
 * EnvSet 工具：设置环境变量
 */
export class EnvSetTool extends BaseTool {
  readonly name = "env_set";
  readonly description = "设置当前进程的环境变量。只修改当前进程的环境变量，不影响子进程或父进程。";
  readonly parameters = z.object({
    name: z.string().min(1, "环境变量名称不能为空").describe("环境变量名称"),
    value: z.string().min(1, "环境变量的值不能为空").describe("环境变量的值"),
  });

  async execute(args: z.infer<typeof this.parameters>): Promise<string> {
    const { name, value } = args;

    // Zod 已经验证了 name 和 value 不为空
    // 验证环境变量名称格式
    validateEnvName(name);

    // 检查是否覆盖现有环境变量
    const isUpdate = process.env[name] !== undefined;

    // 设置环境变量
    process.env[name] = value;

    const message = isUpdate
      ? `环境变量 ${name} 已更新`
      : `环境变量 ${name} 已设置`;

    return JSON.stringify({ success: true, message }, null, 2);
  }
}

/**
 * ProcessList 工具：列出系统进程
 */
export class ProcessListTool extends BaseTool {
  readonly name = "process_list";
  readonly description = "列出系统进程。支持按名称过滤和限制返回数量。";
  readonly parameters = z.object({
    filter: z.string().optional().describe("进程名称过滤（支持部分匹配）"),
    limit: z
      .number()
      .int()
      .nonnegative()
      .max(MAX_PROCESS_LIMIT)
      .optional()
      .describe(`返回进程数量限制（默认 ${DEFAULT_PROCESS_LIMIT}，最大 ${MAX_PROCESS_LIMIT}）`),
  });

  async execute(args: z.infer<typeof this.parameters>): Promise<string> {
    const { filter, limit = DEFAULT_PROCESS_LIMIT } = args;

    if (limit > MAX_PROCESS_LIMIT) {
      throw new ToolExecutionError(
        "process_list",
        `limit 参数不能超过 ${MAX_PROCESS_LIMIT}`,
      );
    }

    // 获取所有进程列表
    const allProcesses = await new Promise<ProcessInfo[]>((resolve, reject) => {
      psTree(process.pid, (err, children) => {
        if (err) {
          reject(err);
          return;
        }
        // 包含自身进程
        const processes: ProcessInfo[] = [
          {
            PID: process.pid,
            PPID: process.ppid,
            COMMAND: process.argv.join(" "),
            STAT: "",
          },
          ...children,
        ];
        resolve(processes);
      });
    });

    // 过滤进程
    let filteredProcesses = allProcesses;
    if (filter) {
      const filterLower = filter.toLowerCase();
      filteredProcesses = allProcesses.filter((p) =>
        p.COMMAND?.toLowerCase().includes(filterLower) ||
        p.PID?.toString().includes(filterLower),
      );
    }

    // 限制数量
    const limitedProcesses = filteredProcesses.slice(0, limit);

    // 格式化输出
    const processes = limitedProcesses.map((p) => ({
      pid: p.PID,
      ppid: p.PPID,
      name: p.COMMAND?.split(" ")[0] || "unknown",
      command: p.COMMAND || "",
      cpu: 0, // ps-tree 不提供 CPU 信息
      memory: 0, // ps-tree 不提供内存信息
    }));

    return JSON.stringify({ processes }, null, 2);
  }
}

/**
 * ProcessKill 工具：终止进程
 */
export class ProcessKillTool extends BaseTool {
  readonly name = "process_kill";
  readonly description = "终止指定进程。支持 SIGTERM 和 SIGKILL 信号，以及终止进程树。";
  readonly parameters = z.object({
    pid: z.number().int().positive().describe("进程 ID"),
    signal: z
      .enum(["SIGTERM", "SIGKILL"])
      .optional()
      .describe("终止信号（SIGTERM 或 SIGKILL，默认 SIGTERM）"),
    killTree: z
      .boolean()
      .optional()
      .describe("是否终止进程树（包括子进程，默认 false）"),
    confirm: z
      .boolean()
      .optional()
      .describe("确认标志（默认 false）"),
  });

  async execute(args: z.infer<typeof this.parameters>): Promise<string> {
    const { pid, signal = "SIGTERM", killTree = false, confirm = false } = args;

    // 预览模式 - 不检查进程是否存在
    if (!confirm) {
      try {
        // 获取进程信息
        const processes = await new Promise<ProcessInfo[]>((resolve, reject) => {
          psTree(pid, (err, children) => {
            if (err) {
              reject(err);
              return;
            }
            resolve([
              {
                PID: pid,
                PPID: 0,
                COMMAND: "unknown",
              },
              ...children,
            ]);
          });
        });

        return JSON.stringify({
          success: false,
          message: "预览模式：设置 confirm 为 true 以实际终止进程",
          processesToKill: processes.map((p) => ({
            pid: p.PID,
            name: p.COMMAND?.split(" ")[0] || "unknown",
          })),
        }, null, 2);
      } catch (error) {
        // 如果无法获取进程信息（进程不存在），仍然返回预览信息
        return JSON.stringify({
          success: false,
          message: "预览模式：设置 confirm 为 true 以实际终止进程",
          processesToKill: [{ pid, name: "unknown" }],
        }, null, 2);
      }
    }

    // 检查进程是否受保护
    if (isProtectedProcess(pid)) {
      throw new ToolExecutionError(
        "process_kill",
        "不能终止受保护的系统进程",
      );
    }

    // 检查进程是否存在
    try {
      process.kill(pid, 0);
    } catch (error) {
      throw new ToolExecutionError(
        "process_kill",
        `未找到 PID 为 ${pid} 的进程`,
      );
    }

    // 确定要终止的进程列表
    const pidsToKill = killTree
      ? await getProcessTreePids(pid)
      : [pid];

    // 移除受保护的进程
    const validPidsToKill = pidsToKill.filter((p) => !isProtectedProcess(p));

    if (validPidsToKill.length === 0) {
      throw new ToolExecutionError(
        "process_kill",
        "没有可终止的进程（所有进程都受保护）",
      );
    }

    // 终止进程
    const killedProcesses: Array<{ pid: number; name: string }> = [];
    const errors: Array<{ pid: number; error: string }> = [];

    for (const p of validPidsToKill) {
      try {
        process.kill(p, signal);
        killedProcesses.push({
          pid: p,
          name: "unknown", // 无法获取名称
        });
      } catch (error) {
        errors.push({
          pid: p,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (errors.length > 0 && killedProcesses.length === 0) {
      throw new ToolExecutionError(
        "process_kill",
        `终止进程失败：${errors[0].error}`,
      );
    }

    const message = killTree
      ? `已终止 ${killedProcesses.length} 个进程（包含子进程）`
      : "已终止进程";

    return JSON.stringify(
      {
        success: true,
        message,
        killedProcesses,
        ...(errors.length > 0 && {
          errors: `部分进程终止失败：${errors.map((e) => e.error).join(", ")}`,
        }),
      },
      null,
      2,
    );
  }
}

// ==================== 导出实例 ====================

export const envGetTool = new EnvGetTool();
export const envSetTool = new EnvSetTool();
export const processListTool = new ProcessListTool();
export const processKillTool = new ProcessKillTool();