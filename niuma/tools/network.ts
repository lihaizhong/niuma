import { z } from "zod";

import type { ToolSpec } from "./types";

export const fetchTool: ToolSpec<{ url: string; method?: string; headers?: Record<string, string>; body?: string }> = {
  name: "fetch",
  description: "Make HTTP request",
  parameters: z.object({
    url: z.string().url(),
    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("GET"),
    headers: z.record(z.string(), z.string()).optional(),
    body: z.string().optional(),
  }),
  async execute({ url, method, headers, body }) {
    const response = await fetch(url, { method, headers, body });
    return response.text();
  },
};
