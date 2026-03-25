import { z } from "zod";
import type { ToolSpec } from "./types";
import { spawn } from "child_process";

export const gitStatusTool: ToolSpec<{ cwd?: string }> = {
  name: "git_status",
  description: "Get git status",
  parameters: z.object({
    cwd: z.string().optional(),
  }),
  async execute({ cwd }) {
    return execGit(["status", "--short"], cwd);
  },
};

export const gitLogTool: ToolSpec<{ cwd?: string; count?: number }> = {
  name: "git_log",
  description: "Get git commit log",
  parameters: z.object({
    cwd: z.string().optional(),
    count: z.number().default(10),
  }),
  async execute({ cwd, count }) {
    return execGit(["log", `--max-count=${count}`, "--oneline"], cwd);
  },
};

function execGit(args: string[], cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(stderr.trim() || stdout.trim()));
      }
    });

    child.on("error", reject);
  });
}
