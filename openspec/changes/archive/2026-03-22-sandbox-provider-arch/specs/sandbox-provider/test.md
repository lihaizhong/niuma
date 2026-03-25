## Purpose

验证沙箱 Provider 插件架构的正确性，包括接口实现、注册机制、自动检测和降级逻辑。

## Acceptance Criteria

1. Provider 接口方法正确实现
2. 注册表能正确注册和获取 Provider
3. Docker Provider 在 Docker 不可用时 `isAvailable()` 返回 `false`
4. Noop Provider `isAvailable()` 始终返回 `true`
5. 自动检测能找到可用 Provider
6. 配置的 Provider 不可用时自动降级

## Coverage Target

- Normal cases: Provider 注册、获取、执行
- Boundary cases: Docker 不可用降级、无 Provider 时使用 Noop
- Error cases: 无效 Provider 名称、execute 超时

## Test Cases

### Requirement: Provider 接口

### Requirement: Provider 注册表

#### Scenario: 注册和获取 Provider
- **WHEN** 调用 `register("test", factory)` 注册 Provider
- **THEN** 调用 `get("test")` 返回该 Provider

#### Scenario: 获取不存在的 Provider
- **WHEN** 调用 `get("nonexistent")`
- **THEN** 返回 `null`

#### Scenario: 自动检测返回可用 Provider
- **WHEN** 调用 `detect()` 且 Docker 可用
- **THEN** 返回 Docker Provider

#### Scenario: Docker 不可用时降级到 Noop
- **WHEN** Docker Provider `isAvailable()` 返回 `false`
- **THEN** `detect()` 返回 Noop Provider

### Requirement: Docker Provider

#### Scenario: Docker 可用时 isAvailable 返回 true
- **WHEN** Docker Socket 可访问
- **THEN** `dockerProvider.isAvailable()` 返回 `true`

#### Scenario: Docker 不可用时 isAvailable 返回 false
- **WHEN** Docker Socket 不可访问
- **THEN** `dockerProvider.isAvailable()` 返回 `false`

#### Scenario: 执行命令返回结果
- **WHEN** 调用 `dockerProvider.execute({ command: "echo", args: ["hello"] })`
- **THEN** 返回包含 stdout 为 "hello\n" 的 ExecutionResult

### Requirement: Noop Provider

#### Scenario: Noop Provider 始终可用
- **WHEN** 调用 `noopProvider.isAvailable()`
- **THEN** 返回 `true`

#### Scenario: Noop Provider 执行只记录日志
- **WHEN** 调用 `noopProvider.execute({ command: "any" })`
- **THEN** 返回 `{ stdout: "", stderr: "", exitCode: 0, duration: 0 }`

### Requirement: 自动检测与降级

#### Scenario: 配置 docker 但不可用时自动降级
- **WHEN** 配置 `provider: "docker"` 但 Docker 不可用
- **THEN** `SandboxManager.create()` 返回使用 Noop Provider 的实例

#### Scenario: 配置 noop 强制使用
- **WHEN** 配置 `provider: "noop"`
- **THEN** `SandboxManager.create()` 返回使用 Noop Provider 的实例

### Requirement: 配置驱动选择

#### Scenario: 未配置 provider 时自动检测
- **WHEN** 未配置 `provider` 字段且 Docker 可用
- **THEN** 使用 Docker Provider

#### Scenario: 未配置 provider 且 Docker 不可用
- **WHEN** 未配置 `provider` 字段且 Docker 不可用
- **THEN** 使用 Noop Provider
