import { OpenAICompatibleProvider } from "./openai-compatible";
import type { LLMConfig } from "../types/llm";

export class OpenRouterProvider extends OpenAICompatibleProvider {
  readonly name = "openrouter";

  constructor(config: LLMConfig) {
    super({ ...config, apiBase: "https://openrouter.ai/api/v1" });
  }

  getDefaultModel(): string {
    return "anthropic/claude-3.5-sonnet";
  }

  protected getApiBase(): string {
    return "https://openrouter.ai/api/v1";
  }
}
