import { OpenAICompatibleProvider } from "./openai-compatible";

import type { LLMConfig } from "../types/llm";

export class CustomProvider extends OpenAICompatibleProvider {
  readonly name = "custom";

  constructor(config: LLMConfig) {
    super(config);
  }

  getDefaultModel(): string {
    return this.config.model;
  }

  protected getApiBase(): string {
    if (!this.config.apiBase) {
      throw new Error("Custom provider requires apiBase");
    }
    return this.config.apiBase;
  }
}
