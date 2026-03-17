## REMOVED Requirements

### Requirement: spawn 工具创建子智能体

**Reason**: SpawnTool 实现不完整（只创建配置和会话，无真正任务执行），功能已被 `SubagentManager` (agent-subagent 规格) 完整覆盖。

**Migration**: 使用 `SubagentManager` 服务类管理子智能体：
```typescript
import { SubagentManager } from "../agent/subagent";

const manager = new SubagentManager({
  provider: llmProvider,
  tools: toolRegistry,
  bus: eventBus,
});

const taskId = await manager.spawn({
  task: "任务描述",
  label: "任务标签",
  originChannel: "cli",
  originChatId: "chat-123",
  sessionKey: "session-123",
});
```

#### Scenario: 创建子智能体
- **MOVED TO**: `agent-subagent` 规格中的 `Requirement: 生成后台子智能体任务`

#### Scenario: 子智能体继承配置
- **MOVED TO**: `agent-subagent` 规格中的 `Requirement: 配置子智能体`

#### Scenario: 子智能体执行任务
- **MOVED TO**: `agent-subagent` 规格中的 `Requirement: 限制子智能体迭代次数`

#### Scenario: 创建失败
- **MOVED TO**: `agent-subagent` 规格中的错误处理

### Requirement: 子智能体配置

**Reason**: 同上，配置管理已整合到 `SubagentManager`。

**Migration**: 通过 `SubagentManagerConfig` 配置子智能体。

#### Scenario: 设置模型参数
- **MOVED TO**: `agent-subagent` 规格中的模型配置支持

#### Scenario: 设置工具权限
- **MOVED TO**: `agent-subagent` 规格中的 `Requirement: 限制子智能体的能力`

#### Scenario: 设置记忆共享
- **MOVED TO**: `agent-subagent` 规格中的记忆配置

### Requirement: 子智能体通信

**Reason**: 同上，通信机制已通过 EventBus 实现。

**Migration**: 通过 EventBus 监听 `MESSAGE_SENT` 事件接收子智能体结果。

#### Scenario: 父智能体发送消息
- **MOVED TO**: `agent-subagent` 规格中的 `Requirement: 在子智能体完成后通知主 Agent`

#### Scenario: 子智能体通知父智能体
- **MOVED TO**: `agent-subagent` 规格中的事件通知机制

#### Scenario: 双向通信
- **MOVED TO**: `agent-subagent` 规格中的事件系统

### Requirement: 子智能体生命周期

**Reason**: 同上，生命周期管理已完整实现。

**Migration**: 使用 `SubagentManager.spawn()`, `cancel()`, `cancelBySession()` 等方法。

#### Scenario: 子智能体启动
- **MOVED TO**: `agent-subagent` 规格中的 `Requirement: 管理子智能体的生命周期`

#### Scenario: 子智能体停止
- **MOVED TO**: `agent-subagent` 规格中的取消和清理逻辑

#### Scenario: 子智能体超时
- **MOVED TO**: `agent-subagent` 规格中的超时处理 (TASK_TIMEOUT = 10 分钟)

### Requirement: 子智能体资源隔离

**Reason**: 同上，资源隔离已完整实现。

**Migration**: `SubagentManager` 自动创建独立工作区，隔离工具访问。

#### Scenario: 工作区隔离
- **MOVED TO**: `agent-subagent` 规格中的工作区隔离

#### Scenario: 会话隔离
- **MOVED TO**: `agent-subagent` 规格中的会话管理

#### Scenario: 记忆隔离
- **MOVED TO**: `agent-subagent` 规格中的记忆隔离
