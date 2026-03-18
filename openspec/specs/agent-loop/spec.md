# Agent Loop Specification

## Purpose

定义 Agent Loop 的功能规格和行为约束。

## Requirements

### Requirement: 消息处理循环

AgentLoop SHALL 从消息总线接收消息并处理。

#### Scenario: 启动循环

- **WHEN** 调用 `run()`
- **THEN** 开始监听消息总线，处理入站消息

#### Scenario: 停止循环

- **WHEN** 调用 `stop()`
- **THEN** 停止监听，清理资源

#### Scenario: 直接处理消息

- **WHEN** 调用 `processDirect("hello")`
- **THEN** 返回处理结果字符串

### Requirement: 迭代控制

AgentLoop SHALL 支持多轮 LLM ↔ 工具执行迭代，并设置最大迭代次数。

#### Scenario: 工具调用迭代

- **WHEN** LLM 返回工具调用
- **THEN** 执行工具，将结果加入消息，再次调用 LLM

#### Scenario: 达到最大迭代

- **WHEN** 迭代次数达到 maxIterations（默认 20）
- **THEN** 停止迭代，返回当前结果

#### Scenario: 无工具调用

- **WHEN** LLM 未返回工具调用
- **THEN** 结束迭代，返回 LLM 响应

### Requirement: 斜杠命令处理

AgentLoop SHALL 支持内置斜杠命令。

#### Scenario: /new 命令

- **WHEN** 用户发送 `/new`
- **THEN** 清空当前会话，触发记忆整合

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
}

interface AgentLoop {
  run(): Promise<void>
  stop(): void
  processDirect(content: string, options?: ProcessOptions): Promise<string>
}
```

## Dependencies

- `niuma/bus/events.ts` - EventBus
- `niuma/agent/context.ts` - ContextBuilder
- `niuma/agent/memory.ts` - MemoryStore
- `niuma/agent/tools/registry.ts` - ToolRegistry
- `niuma/session/manager.ts` - SessionManager
- `niuma/providers/base.ts` - LLMProvider
