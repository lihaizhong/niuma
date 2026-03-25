import { OpenAICompatibleProvider } from "./openai-compatible";
import type { LLMConfig } from "../types/llm";

export class OllamaProvider extends OpenAICompatibleProvider {
  readonly name = "ollama";

  constructor(config: LLMConfig) {
    super({ ...config, apiBase: config.apiBase || "http://localhost:11434/v1" });
  }

  getDefaultModel(): string {
    return "llama3.1";
  }

  protected getApiBase(): string {
    return this.config.apiBase || "http://localhost:11434/v1";
  }
}
