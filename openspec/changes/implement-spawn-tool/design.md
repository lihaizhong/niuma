## Context

当前架构：
- `SubagentManager` (agent/subagent.ts) - 服务类，管理子智能体生命周期
- `BaseTool` (agent/tools/base.ts) - 工具基类，提供上下文访问
- `ToolRegistry` (agent/tools/registry.ts) - 工具注册表
- `ToolContext` (agent/tools/context.ts) - 全局上下文管理

SubagentManager 需要以下依赖：
- `LLMProvider` - 调用 LLM 执行任务
- `ToolRegistry` - 获取工具定义
- `EventBus` - 发送事件通知

## Goals / Non-Goals

**Goals:**
- 实现 LLM 可调用的 spawn 工具
- 工具调用 SubagentManager.spawn() 创建后台任务
- 返回任务 ID 供 LLM 跟踪

**Non-Goals:**
- 不实现任务结果查询（通过 EventBus 通知）
- 不实现任务取消接口（可在后续迭代添加）

## Decisions

### D1: 工具作为 SubagentManager 的薄包装层

**理由**:
- SubagentManager 已有完整的任务管理逻辑
- 工具只需负责参数解析和调用代理
- 保持单一职责原则

**设计**:
```
SpawnTool.execute(args)
  → 获取 SubagentManager 实例
  → 解析参数 (task, label)
  → 调用 manager.spawn()
  → 返回任务 ID
```

### D2: 通过全局上下文获取 SubagentManager

**理由**:
- 与 SessionManager、ToolRegistry 的获取方式一致
- 避免工具直接依赖外部服务

**设计**:
```typescript
// context.ts
function setGlobalSubagentManager(manager: SubagentManager): void
function getGlobalSubagentManager(): SubagentManager | null
```

### D3: 工具参数设计

**参数**:
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| task | string | 是 | 任务描述 |
| label | string | 否 | 任务标签（用于显示） |

**返回**:
```
已创建后台任务（ID: subagent-xxx，任务: 分析代码结构）
任务完成后将通过系统消息通知结果。
```

## Risks / Trade-offs

- **风险**: LLM 可能滥用 spawn 创建大量任务
  - 缓解: SubagentManager 已有并发限制 (MAX_CONCURRENT_TASKS = 5)

- **风险**: 任务执行失败时 LLM 无法感知
  - 缓解: 通过 EventBus 发送 MESSAGE_SENT 事件通知结果
