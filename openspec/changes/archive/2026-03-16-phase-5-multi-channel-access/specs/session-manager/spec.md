## MODIFIED Requirements

### Requirement: 会话创建与获取

SessionManager SHALL 支持创建和获取会话，支持多渠道会话隔离。

#### Scenario: 获取现有会话

- **WHEN** 调用 `getOrCreate("cli:user-123")` 且会话存在
- **THEN** 返回现有会话

#### Scenario: 创建新会话

- **WHEN** 调用 `getOrCreate("cli:user-456")` 且会话不存在
- **THEN** 创建并返回新会话

#### Scenario: 多渠道会话隔离
- **WHEN** 使用不同的渠道标识创建会话（如 "cli:user-123" 和 "telegram:user-123"）
- **THEN** 系统 SHALL 创建两个独立的会话

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
- **THEN** 包含唯一的 key 字段，格式为 `{channel}:{chatId}`

#### Scenario: 时间戳

- **WHEN** 会话创建或更新
- **THEN** 包含 createdAt 和 updatedAt 时间戳

#### Scenario: 整合标记

- **WHEN** 会话创建
- **THEN** 包含 lastConsolidated 字段，初始为 0

## ADDED Requirements

### Requirement: 最近活跃渠道记录
系统 SHALL 记录最近活跃的渠道和会话。

#### Scenario: 记录活跃会话
- **WHEN** 处理来自渠道的消息
- **THEN** 系统 SHALL 更新最近活跃的渠道和会话键

#### Scenario: 获取活跃渠道
- **WHEN** 调用 `getLastActiveChannel()` 方法
- **THEN** 系统 SHALL 返回最近活跃的渠道类型和会话键

#### Scenario: 无活跃渠道
- **WHEN** 从未处理过任何消息
- **THEN** 系统 SHALL 返回默认渠道（cli）和空会话键

### Requirement: 渠道会话查询
系统 SHALL 支持按渠道查询会话。

#### Scenario: 查询特定渠道的所有会话
- **WHEN** 调用 `listSessionsByChannel("telegram")`
- **THEN** 系统 SHALL 返回所有 Telegram 渠道的会话列表

#### Scenario: 查询特定渠道和用户的会话
- **WHEN** 调用 `getSession("telegram", "user-123")`
- **THEN** 系统 SHALL 返回该用户在 Telegram 渠道的会话

### Requirement: 会话统计
系统 SHALL 支持获取会话统计信息。

#### Scenario: 获取渠道会话数量
- **WHEN** 调用 `getChannelStats("telegram")`
- **THEN** 系统 SHALL 返回 Telegram 渠道的会话总数和消息总数

#### Scenario: 获取全局统计
- **WHEN** 调用 `getGlobalStats()`
- **THEN** 系统 SHALL 返回所有渠道的会话和消息统计

### Requirement: 会话过期清理
系统 SHALL 支持清理过期的会话。

#### Scenario: 清理过期会话
- **WHEN** 调用 `cleanupExpiredSessions(30)`（30 天）
- **THEN** 系统 SHALL 删除所有超过 30 天未使用的会话

#### Scenario: 清理空闲会话
- **WHEN** 调用 `cleanupIdleSessions(7)`（7 天）
- **THEN** 系统 SHALL 删除所有超过 7 天无消息的会话

---

## TypeScript Interfaces

```typescript
interface Session {
  key: string  // 格式："{channel}:{chatId}"
  messages: SessionMessage[]
  lastConsolidated: number
  createdAt: Date
  updatedAt: Date
  channel: ChannelType  // 新增：渠道类型
  chatId: string  // 新增：聊天 ID
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
  getLastActiveChannel(): { channel: ChannelType; sessionKey: string }  // 新增
  listSessionsByChannel(channel: ChannelType): Session[]  // 新增
  getSession(channel: ChannelType, chatId: string): Session | undefined  // 新增
  getChannelStats(channel: ChannelType): { sessionCount: number; messageCount: number }  // 新增
  getGlobalStats(): Record<ChannelType, { sessionCount: number; messageCount: number }>  // 新增
  cleanupExpiredSessions(days: number): void  // 新增
  cleanupIdleSessions(days: number): void  // 新增
}
```

## Dependencies

- `niuma/types/message.ts` - ChatMessage, ChannelType（新增）
- `niuma/types/index.ts` - Session 相关类型