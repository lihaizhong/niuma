## ADDED Requirements

### Requirement: 后台任务生成

SubagentManager SHALL 支持生成后台子智能体任务。

#### Scenario: 生成子智能体

- **WHEN** 调用 `spawn()` 并提供任务描述
- **THEN** 创建异步任务，返回任务 ID

#### Scenario: 任务标签

- **WHEN** 生成子智能体并提供 label
- **THEN** 使用 label 作为任务显示名称

### Requirement: 子智能体隔离

SubagentManager SHALL 限制子智能体的能力。

#### Scenario: 禁用 message 工具

- **WHEN** 子智能体执行
- **THEN** 不包含 message 工具

#### Scenario: 禁用 spawn 工具

- **WHEN** 子智能体执行
- **THEN** 不包含 spawn 工具

### Requirement: 结果通知

SubagentManager SHALL 在子智能体完成后通知主 Agent。

#### Scenario: 任务成功

- **WHEN** 子智能体任务完成
- **THEN** 通过消息总线发送系统消息到原渠道

#### Scenario: 任务失败

- **WHEN** 子智能体任务抛出异常
- **THEN** 发送包含错误信息的系统消息

### Requirement: 任务生命周期

SubagentManager SHALL 管理子智能体的生命周期。

#### Scenario: 获取运行中任务数

- **WHEN** 调用 `getRunningCount()`
- **THEN** 返回当前运行中的子智能体数量

#### Scenario: 取消会话任务

- **WHEN** 调用 `cancelBySession(sessionKey)`
- **THEN** 取消该会话关联的所有子智能体

#### Scenario: 任务自动清理

- **WHEN** 子智能体任务完成（成功或失败）
- **THEN** 从运行列表中移除

### Requirement: 迭代限制

SubagentManager SHALL 限制子智能体的迭代次数。

#### Scenario: 最大迭代次数

- **WHEN** 子智能体执行
- **THEN** 最大迭代次数为 15 次

---

## TypeScript Interfaces

```typescript
interface SubagentManager {
  spawn(options: {
    task: string
    label?: string
    originChannel: string
    originChatId: string
    sessionKey?: string
  }): Promise<string>
  cancelBySession(sessionKey: string): Promise<number>
  getRunningCount(): number
}
```

## Dependencies

- `niuma/bus/events.ts` - EventBus, InboundMessage
- `niuma/agent/tools/registry.ts` - ToolRegistry
- `niuma/providers/base.ts` - LLMProvider
