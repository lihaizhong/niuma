/**
 * 沙箱 Provider 基础类型定义
 */

import type { ExecutionOptions, ExecutionResult, SandboxConfig } from "./types";

export interface SandboxProvider {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  execute(options: ExecutionOptions): Promise<ExecutionResult>;
  shutdown(): Promise<void>;
}

export type SandboxProviderFactory = (
  config: SandboxConfig
) => SandboxProvider | null;

export abstract class AbstractSandboxProvider implements SandboxProvider {
  abstract readonly name: string;

  abstract isAvailable(): Promise<boolean>;
  abstract execute(options: ExecutionOptions): Promise<ExecutionResult>;
  abstract shutdown(): Promise<void>;
}
