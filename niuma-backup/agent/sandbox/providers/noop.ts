/**
 * Noop Sandbox Provider
 * 
 * 空实现，用于测试或无合适 Provider 时降级
 */

import { createLogger } from "../../../log";

import type { SandboxProvider } from "./base";
import type { ExecutionOptions, ExecutionResult, SandboxConfig } from "./types";

const logger = createLogger("sandbox-noop");

export class NoopSandboxProvider implements SandboxProvider {
  readonly name = "noop";

  static create(_config?: SandboxConfig): NoopSandboxProvider {
    return new NoopSandboxProvider();
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async execute(options: ExecutionOptions): Promise<ExecutionResult> {
    logger.info({ command: options.command }, "NoopProvider 执行（无实际效果）");
    
    return {
      stdout: "",
      stderr: "",
      exitCode: 0,
      duration: 0,
    };
  }

  async shutdown(): Promise<void> {
    // 无资源需要释放
  }
}
