## Why

当前沙箱实现紧耦合 Docker Socket，缺乏灵活性。当 Docker 不可用或需要其他沙箱技术时，系统无法平滑降级。通过引入 Provider 插件架构，使沙箱成为可插拔组件，无合适 provider 时自动禁用。

## What Changes

- 引入 `SandboxProvider` 接口定义，包含 `isAvailable()`、`execute()` 等核心方法
- 实现 `DockerSandboxProvider`（原 Docker 实现）
- 实现 `NoopSandboxProvider`（禁用时的空实现）
- 重构 `SandboxManager` 为策略选择器，根据环境自动或配置选择 provider
- 配置 Schema 支持 `provider` 字段指定 provider 类型
- 向后兼容：无 provider 配置时行为与原来一致

## Capabilities

### New Capabilities
- `sandbox-provider`: 可插拔沙箱提供者架构

## Non-goals

- 不实现其他特定沙箱技术（Firecracker、sysbox 等），但架构支持未来扩展
- 不改变沙箱的工具调用拦截机制
- 不修改沙箱执行的 API 契约

## Impact

- `niuma/agent/sandbox/` 模块重构
- `niuma/config/schema.ts` 的 SandboxConfigSchema 调整
- `niuma/agent/tools/sandbox-exec.ts` 依赖接口调整
