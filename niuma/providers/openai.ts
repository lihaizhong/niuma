import { OpenAICompatibleProvider } from "./openai-compatible";

import type { LLMConfig } from "../types/llm";

export class OpenAIProvider extends OpenAICompatibleProvider {
  readonly name = "openai";

  constructor(config: LLMConfig) {
    super(config);
  }

  getDefaultModel(): string {
    return "gpt-4o";
  }

  protected getApiBase(): string {
    return this.config.apiBase || "https://api.openai.com/v1";
  }
}
