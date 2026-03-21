/**
 * 沙箱类型定义
 */

export interface SandboxConfig {
  image: string;
  cpuLimit?: number;
  memoryLimit?: string;
  networkIsolation: boolean;
  timeout: number;
}

export interface ResourceLimits {
  cpuLimit: number;
  memoryLimit: string;
  timeout: number;
  maxOutputSize: number;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: "running" | "stopped" | "removed";
  createdAt: Date;
}

export interface ExecutionOptions {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}

export const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
  image: "ubuntu:22.04",
  cpuLimit: 1,
  memoryLimit: "512m",
  networkIsolation: true,
  timeout: 60000,
};

export const DEFAULT_RESOURCE_LIMITS: ResourceLimits = {
  cpuLimit: 1,
  memoryLimit: "512m",
  timeout: 60000,
  maxOutputSize: 1024 * 1024,
};
