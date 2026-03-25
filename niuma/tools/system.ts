import { z } from "zod";

import type { ToolSpec } from "./types";

export const getEnvTool: ToolSpec<{ name: string }> = {
  name: "get_env",
  description: "Get environment variable",
  parameters: z.object({
    name: z.string(),
  }),
  async execute({ name }) {
    return process.env[name] || "";
  },
};

export const getCwdTool: ToolSpec<Record<string, never>> = {
  name: "get_cwd",
  description: "Get current working directory",
  parameters: z.object({}),
  async execute() {
    return process.cwd();
  },
};
