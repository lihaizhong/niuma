import { OpenAICompatibleProvider } from "./openai-compatible";

import type { LLMConfig } from "../types/llm";

export class DeepSeekProvider extends OpenAICompatibleProvider {
  readonly name = "deepseek";

  constructor(config: LLMConfig) {
    super({ ...config, apiBase: "https://api.deepseek.com/v1" });
  }

  getDefaultModel(): string {
    return "deepseek-chat";
  }

  protected getApiBase(): string {
    return "https://api.deepseek.com/v1";
  }
}
