import type { LLMProvider, ProviderInfo, ProviderSwitchResult } from "./types";

export interface ProviderManager {
  listProviders(): ProviderInfo[];
  getProvider(name: string): LLMProvider | undefined;
  switchProvider(name: string): Promise<ProviderSwitchResult>;
}

export function createProviderManager(
  providers: Map<string, LLMProvider>,
  currentProvider: LLMProvider,
): ProviderManager {
  return {
    listProviders(): ProviderInfo[] {
      return Array.from(providers.entries()).map(([name, provider]) => ({
        name,
        displayName: provider.name,
        model: provider.getDefaultModel(),
        isCurrent: provider === currentProvider,
        isAvailable: true,
      }));
    },

    getProvider(name: string): LLMProvider | undefined {
      return providers.get(name);
    },

    async switchProvider(name: string): Promise<ProviderSwitchResult> {
      const provider = providers.get(name);
      if (!provider) {
        return {
          success: false,
          message: `Provider '${name}' not found`,
        };
      }
      return {
        success: true,
        message: `Switched to ${name}`,
        modelName: provider.getDefaultModel(),
      };
    },
  };
}
