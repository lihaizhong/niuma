## Purpose

定义沙箱 Provider 插件架构，使沙箱执行能力可插拔。无合适 provider 时系统应优雅降级而非失败。

## TypeScript Interfaces

```typescript
interface ExecutionOptions {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}

interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

interface SandboxProvider {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  execute(options: ExecutionOptions): Promise<ExecutionResult>;
  shutdown(): Promise<void>;
}

interface SandboxProviderFactory {
  create(config: SandboxConfig): SandboxProvider | null;
}
```

## ADDED Requirements

### Requirement: Provider 接口

所有沙箱 Provider 必须实现 `SandboxProvider` 接口，提供：
- `name`: Provider 标识符
- `isAvailable()`: 检测 provider 是否可用
- `execute()`: 执行命令
- `shutdown()`: 释放资源

### Requirement: Provider 注册表

系统必须维护一个 Provider 注册表，支持：
- `register(name, factory)`: 注册 Provider
- `get(name)`: 获取指定 Provider
- `detect()`: 自动检测可用 Provider

### Requirement: Docker Provider

内置 `DockerSandboxProvider` 必须：
- 通过 Docker Socket 连接
- 实现容器池管理
- 支持资源限制（CPU、内存、网络隔离）

### Requirement: Noop Provider

内置 `NoopSandboxProvider` 必须：
- `isAvailable()` 始终返回 `true`
- `execute()` 记录日志并返回空结果（exitCode: 0, stdout: "", stderr: ""）
- 作为最后降级选项

### Requirement: 自动检测与降级

当配置的 Provider 不可用时，系统必须自动尝试下一个可用 Provider，直到找到可用的或耗尽所有选项。最终无 Provider 可用时使用 Noop Provider。

### Requirement: 配置驱动选择

用户可通过 `sandbox.provider` 配置显式指定 Provider：
- `"docker"`: 使用 Docker Provider
- `"noop"`: 强制使用 Noop Provider（用于测试/禁用）
- 未指定: 自动检测

## Dependencies

- `niuma/agent/sandbox/types.ts`: ExecutionOptions, ExecutionResult 类型定义
