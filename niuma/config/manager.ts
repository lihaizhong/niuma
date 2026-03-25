import { readFileSync, existsSync } from "fs";

import { DeepAgentConfigSchema } from "./schema";

import type { DeepAgentConfig } from "./schema";

export class ConfigManager {
  private config: DeepAgentConfig | null = null;

  load(configPath: string): DeepAgentConfig {
    if (!existsSync(configPath)) {
      return this.getDefaultConfig();
    }

    const content = readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(content);
    this.config = DeepAgentConfigSchema.parse(parsed);
    return this.config;
  }

  getDefaultConfig(): DeepAgentConfig {
    return {
      provider: {
        type: "openai",
        model: "gpt-4o",
      },
      maxIterations: 40,
      temperature: 0.7,
      memoryWindow: 50,
      workspace: ".niuma",
    };
  }
}
