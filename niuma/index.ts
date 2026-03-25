export { createAgent, type Agent } from "./core/agent";
export { runLoop } from "./core/loop";
export type {
  AgentContext,
  AgentState,
  CreateAgentOptions,
  ProgressCallback,
  ProgressEvent,
} from "./core/types";

export type { LLMProvider } from "./providers/base";
export { OpenAICompatibleProvider } from "./providers/openai-compatible";
export { OpenAIProvider } from "./providers/openai";
export { AnthropicProvider } from "./providers/anthropic";
export { OllamaProvider } from "./providers/ollama";
export { DeepSeekProvider } from "./providers/deepseek";
export { OpenRouterProvider } from "./providers/openrouter";
export { CustomProvider } from "./providers/custom";
export { ProviderRegistry } from "./providers/registry";

export { ToolRegistry } from "./tools/registry";
export type { ToolSpec, ToolContext } from "./tools/types";
export * from "./tools";

export { BaseChannel } from "./channels/base";
export { ChannelRegistry } from "./channels/registry";
export { CLIChannel } from "./channels/cli";
export type { Channel, ChannelConfig } from "./channels/types";

export { ConfigManager } from "./config/manager";
export { resolveEnvVars } from "./config/env";
export type { DeepAgentConfig, ProviderConfig } from "./config/schema";
