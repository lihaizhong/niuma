## Why

当前 `SubagentManager` 混合了两种职责：
1. **管理职责**：任务生命周期管理、并发控制、会话关联
2. **执行职责**：LLM 调用、工具执行、循环迭代

这导致：
- 代码耦合度高，难以独立测试
- 违反单一职责原则
- 与 nanobot 的设计模式不一致（nanobot 中 spawn 是工具，subagent 是执行器）

将 SpawnTool 抽离为独立工具，SubagentManager 专注于管理职责，可以更好地分离关注点。

## What Changes

- **SpawnTool**：新建独立工具类，作为 LLM 调用 SubagentManager 的入口
- **SubagentManager**：移除执行逻辑，只保留管理职责（spawn/cancel/list）
- **SubagentExecutor**：新建执行器类，封装子智能体的 LLM 循环和工具调用

### 变更详情

| 模块 | 变更类型 | 说明 |
|------|----------|------|
| `tools/spawn.ts` | 新建 | SpawnTool 工具实现 |
| `agent/subagent.ts` | 重构 | 拆分为 Manager + Executor |
| `agent/subagent/executor.ts` | 新建 | 子智能体执行器 |
| `agent/subagent/manager.ts` | 重构 | 管理器（仅管理职责） |

## Capabilities

### New Capabilities

- `spawn-tool`: SpawnTool 作为 LLM 可调用的工具，创建后台子智能体任务
- `subagent-executor`: 子智能体执行器，封装 LLM 循环和工具调用逻辑

### Modified Capabilities

- `subagent-manager`: SubagentManager 只保留管理职责（spawn/cancel/list/wait），移除执行逻辑

## Impact

### 受影响的文件

- `niuma/agent/subagent.ts` → 拆分为多个文件
- `niuma/agent/tools/spawn.ts` → 实现 SpawnTool
- `niuma/agent/tools/registry.ts` → 注册 spawnTool
- `niuma/__tests__/agent-subagent.test.ts` → 更新测试

### API 变更

**SubagentManager 新接口**：
```typescript
class SubagentManager {
  spawn(options: SpawnOptions): Promise<string>  // 创建任务（委托给 Executor）
  cancel(taskId: string): boolean                // 取消任务
  cancelBySession(sessionKey: string): number    // 取消会话任务
  list(): TaskInfo[]                             // 列出运行中任务
  wait(taskId: string): Promise<TaskResult>     // 等待任务完成
}
```

**SpawnTool 接口**：
```typescript
class SpawnTool extends BaseTool {
  name = "spawn"
  parameters = {
    task: string,      // 任务描述
    label?: string,    // 任务标签
  }
}
```

## Non-goals

- 不改变子智能体的功能行为（迭代次数、工具隔离等保持不变）
- 不添加 subagent profiles 配置（这是后续功能）
- 不修改 EventBus 通知机制
