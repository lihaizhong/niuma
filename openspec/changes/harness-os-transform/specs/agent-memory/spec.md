# Agent Memory Specification (Delta)

## Purpose

扩展 Agent Memory 支持三层记忆架构和 RAG 检索。

## MODIFIED Requirements

### Requirement: 双层记忆结构

**FROM:**
> MemoryStore SHALL 维护两个记忆层：
> - **MEMORY.md** - 长期结构化知识
> - **HISTORY.md** - 时间线日志（grep 可搜索）

**TO:**
> MemoryStore SHALL 维护三层记忆架构：
> - **工作上下文** - 当前会话的工作内存
> - **会话状态** - PROGRESS.json 中的任务进度
> - **长期记忆** - MEMORY.md + HISTORY.md + RAG 检索

#### Scenario: 加载三层记忆
- **WHEN** 构建系统提示
- **THEN** MemoryStore SHALL 加载三层记忆
- **AND** SHALL 按需检索相关长期记忆

## ADDED Requirements

### Requirement: RAG 检索增强

MemoryStore SHALL 支持向量检索相关记忆。

```typescript
interface MemorySearchOptions {
  query: string;
  limit?: number;
  threshold?: number;
}
```

#### Scenario: 检索相关记忆
- **WHEN** Agent 请求相关记忆
- **THEN** MemoryStore SHALL 检索与查询相关的记忆片段
- **AND** SHALL 使用向量相似度排序

#### Scenario: 记忆片段注入
- **WHEN** 检索到相关记忆
- **THEN** MemoryStore SHALL 将记忆片段注入上下文
- **AND** SHALL 标记为检索来源

### Requirement: 任务上下文

MemoryStore SHALL 加载任务进度到上下文。

#### Scenario: 加载任务进度
- **WHEN** Agent 执行任务
- **THEN** MemoryStore SHALL 加载 PROGRESS.json
- **AND** SHALL 注入当前任务状态

### Requirement: 记忆优先级

三层记忆 SHALL 按优先级注入上下文。

#### Scenario: 优先级注入
- **WHEN** 构建上下文
- **THEN** MemoryStore SHALL 按顺序注入:
1. 工作上下文（最高优先级）
2. 任务上下文
3. 长期记忆（RAG 检索）

## Dependencies

- Requires: `task-progress-tracker` for task context
- Uses: Vector store for RAG retrieval
