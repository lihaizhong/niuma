## 历史背景

### 代码演进（Git 历史）

**初始实现（d35cf4e - 2026-03-10）**
- 实现了 Phase 2 Agent Core
- 添加 `readLongTerm()` 和 `writeLongTerm()` 作为公共方法
- 基础双层记忆系统（MEMORY.md + HISTORY.md）

**代码质量重构（50c85d3 - 2026-03-14）**
- 重新组织代码结构，添加清晰的注释分隔符
- 统一导入风格（移除 `node:` 前缀）
- 保留 `readLongTerm()` 和 `writeLongTerm()` 作为公共方法
- memory.ts 改动了 343 行

**安全增强（57de5d5 - 2026-03-14）**
- 用开源库 `fast-clean` 替代自定义对象清理逻辑
- 创建通用 sanitize 工具函数（`niuma/utils/sanitize.ts`）
- 移除 `_sanitizeObject` 方法（76 行）
- 提升可维护性和安全性

**当前状态（未提交）**
- 将 `readLongTerm()` 和 `writeLongTerm()` 改为私有方法
- 原因：这些是内部实现细节
- 重新组织方法顺序，遵循 TypeScript 最佳实践
- 更新所有内部调用点使用私有方法

## 修改的需求

### Requirement: 双层记忆结构

MemoryStore SHALL 维护两个记忆层：
- **MEMORY.md** - 长期结构化知识
- **HISTORY.md** - 时间线日志（grep 可搜索）

#### Scenario: 追加历史条目

- **WHEN** 调用 `appendHistory()` 并提供条目
- **THEN** HISTORY.md 追加新条目，格式为 `[YYYY-MM-DD HH:MM] 内容`

#### Scenario: 获取记忆上下文

- **WHEN** 调用 `getMemoryContext()` 且 MEMORY.md 存在
- **THEN** 返回 "## Long-term Memory\n{内容}"

#### Scenario: 记忆为空

- **WHEN** 调用 `getMemoryContext()` 且 MEMORY.md 不存在或为空
- **THEN** 返回空字符串

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

## REMOVED Requirements

### Requirement: 读取长期记忆

**已移除** - `_readLongTerm()` 现在是私有方法，不属于公共 API

### Requirement: 写入长期记忆

**已移除** - `_writeLongTerm()` 现在是私有方法，不属于公共 API

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