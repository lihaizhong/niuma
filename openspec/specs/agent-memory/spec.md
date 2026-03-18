# Agent Memory Specification

## Purpose

定义 Agent Memory 的功能规格和行为约束。

## Historical Context

### Code Evolution (Git History)

**Initial Implementation (d35cf4e - 2026-03-10)**
- Implemented Phase 2 Agent Core
- Added `readLongTerm()` and `writeLongTerm()` as public methods
- Basic dual-layer memory system (MEMORY.md + HISTORY.md)

**Code Quality Refactor (50c85d3 - 2026-03-14)**
- Reorganized code structure with clear comment separators
- Unified import style (removed `node:` prefix)
- Kept `readLongTerm()` and `writeLongTerm()` as public methods
- 343 lines changed in memory.ts

**Security Enhancement (57de5d5 - 2026-03-14)**
- Replaced custom object sanitization with `fast-clean` library
- Created common sanitize utility (`niuma/utils/sanitize.ts`)
- Removed `_sanitizeObject` method (76 lines)
- Improved maintainability and security

**Current State (Uncommitted)**
- Changed `readLongTerm()` and `writeLongTerm()` to private methods
- Reason: These are internal implementation details
- Reorganized method order to follow TypeScript best practices
- Updated all internal call sites to use private methods

## Requirements

### Requirement: 双层记忆结构

MemoryStore SHALL 维护两个记忆层：
- **MEMORY.md** - 长期结构化知识
- **HISTORY.md** - 时间线日志（grep 可搜索）

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
  appendHistory(entry: string): Promise<void>
  getMemoryContext(): Promise<string>
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

## Implementation Notes

- `_readLongTerm()` 和 `_writeLongTerm()` 是私有方法，仅内部使用
- 所有公共方法都是异步的（返回 Promise）
- `appendHistory()` 使用原子写入（通过 fs-extra 确保目录存在）
- `getMemoryContext()` 直接调用私有方法 `_readLongTerm()` 获取内容
