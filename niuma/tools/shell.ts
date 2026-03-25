import { spawn } from "child_process";

import { z } from "zod";

import type { ToolSpec } from "./types";

export const shellTool: ToolSpec<{ command: string; timeout?: number }> = {
  name: "shell",
  description: "Execute shell command",
  parameters: z.object({
    command: z.string(),
    timeout: z.number().optional(),
  }),
  async execute({ command, timeout }) {
    return new Promise((resolve, reject) => {
      const child = spawn("bash", ["-c", command], {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      if (timeout) {
        timeoutId = setTimeout(() => {
          child.kill();
          reject(new Error(`Command timed out after ${timeout}ms`));
        }, timeout);
      }

      child.on("close", (code) => {
        if (timeoutId) clearTimeout(timeoutId);
        if (code === 0) {
          resolve(stdout || "(no output)");
        } else {
          reject(new Error(`Exit code ${code}: ${stderr || stdout}`));
        }
      });

      child.on("error", reject);
    });
  },
};
