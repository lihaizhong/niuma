## MODIFIED Requirements

### Requirement: 消息处理循环

AgentLoop SHALL 从消息总线接收消息并处理，支持多渠道消息路由。

#### Scenario: 启动循环

- **WHEN** 调用 `run()`
- **THEN** 开始监听消息总线，处理入站消息

#### Scenario: 停止循环

- **WHEN** 调用 `stop()`
- **THEN** 停止监听，清理资源，停止所有渠道

#### Scenario: 直接处理消息

- **WHEN** 调用 `processDirect("hello")`
- **THEN** 返回处理结果字符串

#### Scenario: 接收多渠道消息
- **WHEN** 从消息总线接收到来自任意渠道的 `InboundMessage`
- **THEN** 系统 SHALL 根据 `channel` 和 `chatId` 生成 SessionKey 并处理消息

### Requirement: 迭代控制

AgentLoop SHALL 支持多轮 LLM ↔ 工具执行迭代，并设置最大迭代次数。

#### Scenario: 工具调用迭代

- **WHEN** LLM 返回工具调用
- **THEN** 执行工具，将结果加入消息，再次调用 LLM

#### Scenario: 达到最大迭代

- **WHEN** 迭代次数达到 maxIterations（默认 40）
- **THEN** 停止迭代，返回当前结果

#### Scenario: 无工具调用

- **WHEN** LLM 未返回工具调用
- **THEN** 结束迭代，返回 LLM 响应

### Requirement: 斜杠命令处理

AgentLoop SHALL 支持内置斜杠命令。

#### Scenario: /new 命令

- **WHEN** 用户发送 `/new`
- **THEN** 清空当前渠道会话，触发记忆整合

#### Scenario: /help 命令

- **WHEN** 用户发送 `/help`
- **THEN** 返回可用命令列表

### Requirement: 进度通知

AgentLoop SHALL 支持进度通知回调。

#### Scenario: 工具调用进度

- **WHEN** 执行工具调用
- **THEN** 通过回调通知工具名称和参数摘要

#### Scenario: 思考进度

- **WHEN** LLM 返回 content（非工具调用）
- **THEN** 通过回调通知内容

### Requirement: 错误处理

AgentLoop SHALL 处理各种错误场景。

#### Scenario: 工具执行失败

- **WHEN** 工具执行抛出异常
- **THEN** 记录错误信息，继续迭代让 LLM 尝试其他方式

#### Scenario: LLM 调用失败

- **WHEN** LLM 调用失败
- **THEN** 按指数退避重试，最多 4 次

#### Scenario: 连续失败

- **WHEN** 连续 4 次 LLM 调用失败
- **THEN** 返回错误消息给用户

### Requirement: 流式响应

AgentLoop SHALL 支持流式响应输出。

#### Scenario: 流式输出

- **WHEN** Provider 支持 chatStream 且启用流式
- **THEN** 逐块输出 LLM 响应

### Requirement: 系统消息处理

AgentLoop SHALL 支持处理系统消息（子智能体通知等）。

#### Scenario: 子智能体结果通知

- **WHEN** 收到 channel="system" 的消息
- **THEN** 解析 chatId 中的渠道信息，直接处理不保存历史

### Requirement: 多渠道消息路由
系统 SHALL 支持根据消息的渠道信息路由到对应的会话。

#### Scenario: 生成 SessionKey
- **WHEN** 接收到 `InboundMessage`
- **THEN** 系统 SHALL 使用 `${channel}:${chatId}` 格式生成 SessionKey

#### Scenario: 渠道会话隔离
- **WHEN** 两个不同渠道的消息使用相同的 chatId
- **THEN** 系统 SHALL 将它们视为不同的会话

#### Scenario: 发送响应到渠道
- **WHEN** Agent Loop 处理完消息生成响应
- **THEN** 系统 SHALL 构造 `OutboundMessage` 并通过渠道注册表发送到对应渠道

### Requirement: 渠道集成
系统 SHALL 在 Agent Loop 初始化时集成渠道注册表。

#### Scenario: 启动渠道
- **WHEN** Agent Loop 初始化
- **THEN** 系统 SHALL 调用渠道注册表的 `startAll()` 方法启动所有启用的渠道

#### Scenario: 停止渠道
- **WHEN** Agent Loop 停止
- **THEN** 系统 SHALL 调用渠道注册表的 `stopAll()` 方法停止所有渠道

#### Scenario: 渠道错误处理
- **WHEN** 渠道发送错误事件
- **THEN** 系统 SHALL 记录错误日志并继续运行

## ADDED Requirements

### Requirement: 渠道消息监听
系统 SHALL 监听所有渠道的消息并通过事件总线转发。

#### Scenario: 监听渠道消息
- **WHEN** 渠道接收到消息
- **THEN** 系统 SHALL 将消息转换为 `InboundMessage` 并发送到事件总线

#### Scenario: 消息格式验证
- **WHEN** 接收到渠道消息
- **THEN** 系统 SHALL 验证消息格式并拒绝无效消息

---

## TypeScript Interfaces

```typescript
interface AgentLoopOptions {
  bus: EventBus
  provider: LLMProvider
  workspace: Path
  tools: ToolRegistry
  sessions: SessionManager
  model?: string
  maxIterations?: number
  temperature?: number
  maxTokens?: number
  memoryWindow?: number
  restrictToWorkspace?: boolean
  channelRegistry?: ChannelRegistry  // 新增：渠道注册表
}

interface ProcessOptions {
  channel?: ChannelType  // 新增：渠道类型
  sessionKey?: string    // 新增：会话键
  onProgress?: ProgressCallback
}
```

## Dependencies

- `niuma/bus/events.ts` - EventBus
- `niuma/agent/context.ts` - ContextBuilder
- `niuma/agent/memory.ts` - MemoryStore
- `niuma/agent/tools/registry.ts` - ToolRegistry
- `niuma/session/manager.ts` - SessionManager
- `niuma/providers/base.ts` - LLMProvider
- `niuma/channels/registry.ts` - ChannelRegistry（新增）
- `niuma/types/message.ts` - InboundMessage, OutboundMessage, ChannelType（新增）