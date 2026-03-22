## Context

当前沙箱实现紧耦合 Docker Socket（`niuma/agent/sandbox/manager.ts`），`SandboxManager` 直接创建 `Docker` 实例并管理容器生命周期。问题：

1. 无 Docker 时初始化直接失败
2. 无法替换为其他沙箱技术（Firecracker、sysbox、云原生方案）
3. 测试困难（需要真实 Docker 环境）

## Goals / Non-Goals

**Goals:**
- 沙箱可插拔，provider 负责具体实现
- 无合适 provider 时优雅降级（NoopSandboxProvider）
- 向后兼容：默认使用 Docker，行为与现有代码一致

**Non-Goals:**
- 不实现 Firecracker、sysbox 等特定 provider
- 不改变沙箱的 API 契约（execute、executeToolCall 接口不变）
- 不修改 ToolInterceptor 逻辑

## Decisions

### 1. Provider 接口设计

```typescript
interface SandboxProvider {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  execute(options: ExecutionOptions): Promise<ExecutionResult>;
  shutdown(): Promise<void>;
}
```

关键设计：
- `isAvailable()` 用于检测 provider 是否可用
- `execute()` 统一执行接口，与现有 `ExecutionOptions`/`ExecutionResult` 兼容
- `shutdown()` 资源清理

### 2. Provider 注册机制

采用工厂模式 + 配置驱动：

```typescript
type ProviderFactory = (config: SandboxConfig) => SandboxProvider | null;

const providers: Map<string, ProviderFactory> = new Map();

// 内置 providers
providers.set("docker", DockerSandboxProvider.create);
providers.set("noop", NoopSandboxProvider.create);

// 自动选择
SandboxManager.create(workspace, config);
```

选择策略：
1. 显式配置 `provider` 字段 → 使用指定 provider
2. 未配置 → 按序尝试可用 provider（docker → noop）

### 3. 目录结构

```
niuma/agent/sandbox/
├── index.ts              # 导出
├── types.ts              # 现有类型（保持）
├── manager.ts            # 重构为策略选择器
├── interceptor.ts         # 保持不变
├── container.ts          # Docker 容器管理（移到 providers/）
└── providers/
    ├── index.ts          # Provider 注册表
    ├── base.ts           # AbstractSandboxProvider
    ├── docker.ts         # Docker 实现
    └── noop.ts           # Noop 实现
```

### 4. 向后兼容

`SandboxConfig` 新增 `provider?: "docker" | "noop"` 字段，默认 `"docker"`。

旧配置无 `provider` 字段时：
- 尝试 Docker
- Docker 不可用时降级 Noop
- 行为与原来一致

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SandboxManager                         │
│  - 选择并管理 Provider                                      │
│  - create() 工厂方法根据配置创建合适 provider               │
│  - execute() 委托给 Provider                                │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │ DockerSandbox│    │ NoopSandbox   │    │ Future       │
  │ Provider     │    │ Provider      │    │ Providers... │
  └──────────────┘    └──────────────┘    └──────────────┘
          │                   │
          ▼                   ▼
   Docker Socket         (空实现)
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Docker provider 代码与原 manager 耦合 | 将 `container.ts` 逻辑封装为 `DockerSandboxProvider`，保持内部实现独立 |
| Provider 注册表全局状态 | 使用模块级 `providers` Map，惰性初始化 |
| Noop provider 返回结果不确定 | 明确文档说明：Noop 只做日志记录，返回空结果 |

## Migration Plan

1. 创建 `providers/` 目录和基础类型
2. 实现 `DockerSandboxProvider`（从 `manager.ts` 提取容器逻辑）
3. 实现 `NoopSandboxProvider`
4. 重构 `SandboxManager` 为工厂 + 委托模式
5. 更新 `config/schema.ts` 的 `SandboxConfigSchema`
6. 现有测试兼容性调整
