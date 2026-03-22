## Phase 1: Red（测试先行）

### 1. 编写测试规格

- [x] 1.1 创建 `niuma/__tests__/sandbox-provider.test.ts` 测试文件
- [x] 1.2 实现 Provider 注册表测试（register, get, detect）
- [x] 1.3 实现 Docker Provider 测试（isAvailable, execute）
- [x] 1.4 实现 Noop Provider 测试
- [x] 1.5 实现自动降级测试
- [x] 1.6 运行测试，确认全部失败

### 2. 实现最小代码

### 2.1 创建 Provider 基础结构

- [x] 2.1.1 创建 `niuma/agent/sandbox/providers/index.ts`（Provider 注册表）
- [x] 2.1.2 创建 `niuma/agent/sandbox/providers/base.ts`（AbstractSandboxProvider）
- [x] 2.1.3 运行测试，验证接口定义

### 2.2 实现 Noop Provider

- [x] 2.2.1 创建 `niuma/agent/sandbox/providers/noop.ts`（NoopSandboxProvider）
- [x] 2.2.2 运行测试，验证 Noop Provider 相关测试通过

### 2.3 实现 Docker Provider

- [x] 2.3.1 重命名 `niuma/agent/sandbox/container.ts` 为 `niuma/agent/sandbox/providers/docker-container.ts`
- [x] 2.3.2 创建 `niuma/agent/sandbox/providers/docker.ts`（DockerSandboxProvider）
- [x] 2.3.3 运行测试，验证 Docker Provider 相关测试通过

### 2.4 重构 SandboxManager

- [x] 2.4.1 创建 `SandboxManager.create()` 工厂方法
- [x] 2.4.2 实现 Provider 自动检测和降级逻辑
- [x] 2.4.3 运行测试，验证自动降级测试通过

### 2.5 更新配置 Schema

- [x] 2.5.1 更新 `niuma/config/schema.ts` 的 SandboxConfigSchema，添加 `provider` 字段
- [x] 2.5.2 运行测试，验证配置相关测试通过

## Phase 3: Refactor（优化）

- [x] 3.1 清理旧 `container.ts` 或将其逻辑合并到 Docker Provider
- [x] 3.2 确保所有测试通过
- [x] 3.3 运行 `pnpm lint` 和 `pnpm type-check`
- [ ] 3.4 代码审查（调用 code-reviewer）
