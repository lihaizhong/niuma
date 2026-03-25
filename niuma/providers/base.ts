export type {
  LLMConfig,
  LLMResponse,
  ChatOptions,
  LLMStreamChunk,
  LLMUsage,
  ToolDefinition,
  ToolCall,
} from "../types/llm";

import type { LLMConfig, ChatOptions, LLMResponse, LLMStreamChunk } from "../types/llm";

export interface LLMProvider {
  readonly name: string;
  getConfig(): LLMConfig;
  chat(options: ChatOptions): Promise<LLMResponse>;
  chatStream?(options: ChatOptions): AsyncIterable<LLMStreamChunk>;
  getDefaultModel(): string;
  isAvailable?(): Promise<boolean>;
}
