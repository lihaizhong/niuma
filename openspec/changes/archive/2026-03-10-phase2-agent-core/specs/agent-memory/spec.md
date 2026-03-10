## ADDED Requirements

### Requirement: 双层记忆结构

MemoryStore SHALL 维护两个记忆层：
- **MEMORY.md** - 长期结构化知识
- **HISTORY.md** - 时间线日志（grep 可搜索）

#### Scenario: 读取长期记忆

- **WHEN** 调用 `readLongTerm()` 且 MEMORY.md 存在
- **THEN** 返回文件内容

#### Scenario: 写入长期记忆

- **WHEN** 调用 `writeLongTerm()` 并提供内容
- **THEN** MEMORY.md 被覆盖写入

#### Scenario: 追加历史条目

- **WHEN** 调用 `appendHistory()` 并提供条目
- **THEN** HISTORY.md 追加新条目，格式为 `[YYYY-MM-DD HH:MM] 内容`

### Requirement: 记忆整合

MemoryStore SHALL 通过 LLM 工具调用整合会话历史到记忆系统。

#### Scenario: 触发记忆整合

- **WHEN** 调用 `consolidate()` 并提供会话和 Provider
- **THEN** LLM 被调用并返回 `save_memory` 工具调用

#### Scenario: 整合成功

- **WHEN** LLM 返回有效的 `save_memory` 工具调用
- **THEN** history_entry 追加到 HISTORY.md，memory_update 写入 MEMORY.md

#### Scenario: 整合失败

- **WHEN** LLM 未返回工具调用或工具调用参数无效
- **THEN** 返回 false，会话的 lastConsolidated 不更新

### Requirement: 记忆上下文注入

MemoryStore SHALL 提供格式化的记忆上下文用于 System Prompt。

#### Scenario: 获取记忆上下文

- **WHEN** 调用 `getMemoryContext()` 且 MEMORY.md 存在
- **THEN** 返回 "## Long-term Memory\n{内容}"

#### Scenario: 记忆为空

- **WHEN** 调用 `getMemoryContext()` 且 MEMORY.md 不存在或为空
- **THEN** 返回空字符串

### Requirement: 整合时机控制

MemoryStore SHALL 支持两种整合模式：
- **增量整合** - 整合超出阈值的消息，保留最近的
- **全量归档** - 整合所有消息（/new 命令触发）

#### Scenario: 增量整合

- **WHEN** 调用 `consolidate()` 并设置 archiveAll=false
- **THEN** 只整合超出 memoryWindow 的旧消息

#### Scenario: 全量归档

- **WHEN** 调用 `consolidate()` 并设置 archiveAll=true
- **THEN** 整合所有消息，会话清空

---

## TypeScript Interfaces

```typescript
interface MemoryStore {
  readLongTerm(): string
  writeLongTerm(content: string): void
  appendHistory(entry: string): void
  getMemoryContext(): string
  consolidate(options: {
    session: Session
    provider: LLMProvider
    model: string
    archiveAll?: boolean
    memoryWindow: number
  }): Promise<boolean>
}
```

## Dependencies

- `niuma/session/manager.ts` - Session
- `niuma/providers/base.ts` - LLMProvider
