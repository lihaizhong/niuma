/**
 * 配置类型定义
 */

import { z } from "zod";

export const ProviderConfigSchema = z.object({
  type: z.string(),
  model: z.string(),
  apiKey: z.string().optional(),
  apiBase: z.string().optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
});

export const DeepAgentConfigSchema = z.object({
  provider: ProviderConfigSchema,
  maxIterations: z.number().default(40),
  temperature: z.number().default(0.7),
  memoryWindow: z.number().default(50),
  workspace: z.string().default(".niuma"),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type DeepAgentConfig = z.infer<typeof DeepAgentConfigSchema>;
