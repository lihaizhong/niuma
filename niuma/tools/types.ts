/**
 * 工具类型定义
 */

import type { z } from "zod";

export interface ToolSpec<T = unknown> {
  name: string;
  description: string;
  parameters: z.ZodType<T>;
  execute: (args: T, context?: ToolContext) => Promise<string>;
}

export interface ToolContext {
  cwd: string;
  env: Record<string, string>;
  agentId: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  result: string;
  error?: string;
}
