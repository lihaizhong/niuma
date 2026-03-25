import type { LLMProvider, LLMConfig } from "./base";

export class ProviderRegistry {
  private providers = new Map<string, LLMProvider>();
  private defaultProvider: LLMProvider | null = null;
  private configs = new Map<string, LLMConfig>();

  register(name: string, provider: LLMProvider, config?: LLMConfig): void {
    this.providers.set(name, provider);
    if (config) {
      this.configs.set(name, config);
    }
    if (!this.defaultProvider) {
      this.defaultProvider = provider;
    }
  }

  getProvider(name: string): LLMProvider | undefined {
    return this.providers.get(name);
  }

  getProviderByName(name: string): LLMProvider | undefined {
    return this.providers.get(name);
  }

  getDefaultProvider(): LLMProvider | null {
    return this.defaultProvider;
  }

  setDefaultProvider(name: string): void {
    const provider = this.providers.get(name);
    if (provider) {
      this.defaultProvider = provider;
    }
  }

  getProviderConfig(name: string): LLMConfig | undefined {
    return this.configs.get(name);
  }

  setProviderConfig(name: string, config: LLMConfig): void {
    this.configs.set(name, config);
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}
