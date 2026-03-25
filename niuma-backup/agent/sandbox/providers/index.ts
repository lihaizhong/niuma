/**
 * Provider 注册表
 */

import { createLogger } from "../../../log";

import { DockerSandboxProvider } from "./docker";
import { NoopSandboxProvider } from "./noop";

import type { SandboxProvider, SandboxProviderFactory } from "./base";
import type { SandboxConfig } from "./types";

const logger = createLogger("sandbox-registry");

const providers: Map<string, SandboxProviderFactory> = new Map();

// 内置 providers 注册
providers.set("docker", DockerSandboxProvider.create);
providers.set("noop", NoopSandboxProvider.create);

export class SandboxRegistry {
  static register(name: string, factory: SandboxProviderFactory): void {
    providers.set(name, factory);
    logger.debug({ name }, "Provider 注册");
  }

  static get(name: string): SandboxProviderFactory | null {
    return providers.get(name) ?? null;
  }

  static async detect(config?: SandboxConfig): Promise<SandboxProvider | null> {
    const providerNames = ["docker", "noop"];

    for (const name of providerNames) {
      const factory = providers.get(name);
      if (!factory) {
        continue;
      }

      const provider = factory(config ?? {} as SandboxConfig);
      if (!provider) {
        continue;
      }

      const available = await provider.isAvailable();
      if (available) {
        logger.info({ name }, "使用 Provider");
        return provider;
      }

      logger.debug({ name }, "Provider 不可用");
    }

    logger.warn("无可用 Provider");
    return null;
  }

  static clear(): void {
    providers.clear();
  }
}