# Session Manager Specification

## Purpose

定义 Session Manager 的功能规格和行为约束。

## Requirements

### Requirement: 会话创建与获取

SessionManager SHALL 支持创建和获取会话。

#### Scenario: 获取现有会话

- **WHEN** 调用 `getOrCreate("cli:user-123")` 且会话存在
- **THEN** 返回现有会话

#### Scenario: 创建新会话

- **WHEN** 调用 `getOrCreate("cli:user-456")` 且会话不存在
- **THEN** 创建并返回新会话

### Requirement: 消息管理

SessionManager SHALL 支持添加和获取会话消息。

#### Scenario: 添加用户消息

- **WHEN** 调用 `addMessage(session, "user", "hello")`
- **THEN** 会话消息列表新增用户消息

#### Scenario: 添加助手消息

- **WHEN** 调用 `addMessage(session, "assistant", "hi!", ["read_file"])`
- **THEN** 会话消息列表新增助手消息，包含 toolsUsed

#### Scenario: 获取历史

- **WHEN** 调用 `getHistory(session, 10)`
- **THEN** 返回最近 10 条消息的 ChatMessage 格式

### Requirement: 会话持久化

SessionManager SHALL 支持会话持久化到文件系统。

#### Scenario: 保存会话

- **WHEN** 调用 `save(session)`
- **THEN** 会话数据写入 `sessions/{sessionKey}.json`

#### Scenario: 加载会话

- **WHEN** `getOrCreate()` 被调用且文件存在
- **THEN** 从文件加载会话数据

### Requirement: 会话清理

SessionManager SHALL 支持清空和使会话失效。

#### Scenario: 清空会话

- **WHEN** 调用 `clear(session)`
- **THEN** 会话消息列表清空，lastConsolidated 重置

#### Scenario: 使缓存失效

- **WHEN** 调用 `invalidate(sessionKey)`
- **THEN** 内存中的会话缓存被移除

### Requirement: 会话数据结构

Session SHALL 包含以下信息：

#### Scenario: 会话标识

- **WHEN** 会话创建
- **THEN** 包含唯一的 key 字段

#### Scenario: 时间戳

- **WHEN** 会话创建或更新
- **THEN** 包含 createdAt 和 updatedAt 时间戳

#### Scenario: 整合标记

- **WHEN** 会话创建
- **THEN** 包含 lastConsolidated 字段，初始为 0

---

## TypeScript Interfaces

```typescript
interface Session {
  key: string
  messages: SessionMessage[]
  lastConsolidated: number
  createdAt: Date
  updatedAt: Date
}

interface SessionMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  toolsUsed?: string[]
}

interface SessionManager {
  getOrCreate(sessionKey: string): Session
  save(session: Session): void
  getHistory(session: Session, maxMessages: number): ChatMessage[]
  addMessage(session: Session, role: string, content: string, toolsUsed?: string[]): void
  clear(session: Session): void
  invalidate(sessionKey: string): void
}
```

## Dependencies

- `niuma/types/message.ts` - ChatMessage
