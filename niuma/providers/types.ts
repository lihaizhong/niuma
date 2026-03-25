/**
 * Provider 类型定义
 */

import type {
  LLMConfig,
  LLMResponse,
  ChatOptions,
  LLMStreamChunk,
  LLMUsage,
} from "./base";

export interface ProviderInfo {
  name: string;
  displayName: string;
  model: string;
  isCurrent: boolean;
  isAvailable: boolean;
}

export interface ProviderSwitchResult {
  success: boolean;
  message: string;
  modelName?: string;
}

export interface BaseProviderConfig {
  type: string;
  model: string;
  apiKey?: string;
  apiBase?: string;
  timeout?: number;
}

export interface OpenAICompatibleConfig extends BaseProviderConfig {
  type: "openai" | "ollama" | "deepseek" | "openrouter" | "custom";
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

export interface AnthropicConfig extends BaseProviderConfig {
  type: "anthropic";
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

export type ProviderConfig = OpenAICompatibleConfig | AnthropicConfig;
