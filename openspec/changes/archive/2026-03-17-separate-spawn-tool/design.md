## Context

### 当前架构

```
┌─────────────────────────────────────────────────────────┐
│                    SubagentManager                       │
├─────────────────────────────────────────────────────────┤
│  管理职责：                                               │
│  - spawn() 创建任务                                      │
│  - cancel() 取消任务                                     │
│  - list() 列出任务                                       │
│  - cancelBySession() 会话关联                            │
├─────────────────────────────────────────────────────────┤
│  执行职责（混合）：                                       │
│  - _runSubagent() LLM 循环                               │
│  - _executeToolCall() 工具调用                           │
│  - _buildSubagentPrompt() 构建提示词                     │
│  - _getIsolatedTools() 工具隔离                          │
└─────────────────────────────────────────────────────────┘
```

### 问题
- 职责混合，难以独立测试
- 与 nanobot 的 spawn tool + subagent executor 模式不一致

## Goals / Non-Goals

**Goals:**
- 将 SpawnTool 抽离为独立工具，作为 LLM 调用入口
- SubagentManager 只保留管理职责
- 创建 SubagentExecutor 封装执行逻辑
- 保持现有功能行为不变

**Non-Goals:**
- 不改变子智能体的功能行为
- 不添加 subagent profiles 配置
- 不修改 EventBus 通知机制

## Decisions

### 1. 文件组织结构

**决策**：采用目录结构组织 subagent 相关代码

```
niuma/agent/
├── subagent/
│   ├── index.ts        # 统一导出
│   ├── manager.ts      # SubagentManager（仅管理）
│   ├── executor.ts     # SubagentExecutor（执行逻辑）
│   └── types.ts        # 共享类型定义
├── tools/
│   └── spawn.ts        # SpawnTool 工具
```

**备选方案**：
- 方案 A：单文件拆分 → 文件过大，不推荐
- 方案 B：目录结构 → **采用**，便于扩展

### 2. 职责分离边界

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    SpawnTool     │────▶│ SubagentManager  │────▶│ SubagentExecutor │
│   (LLM 入口)     │     │    (任务管理)     │     │    (执行逻辑)    │
└──────────────────┘     └──────────────────┘     └──────────────────┘
        │                        │                        │
        │ 接收 LLM 调用           │ 创建/取消任务           │ LLM 循环
        │ 返回 taskId            │ 维护任务映射            │ 工具调用
        │                        │ 会话关联               │ 结果通知
```

**决策**：
- `SpawnTool`：接收 LLM 调用，返回 taskId，无状态
- `SubagentManager`：管理任务生命周期，不执行 LLM 调用
- `SubagentExecutor`：执行具体任务，调用 LLM 和工具

### 3. 依赖注入方式

**决策**：SubagentManager 通过构造函数注入 SubagentExecutor

```typescript
interface SubagentManagerConfig {
  executor: SubagentExecutor;  // 注入执行器
  bus: EventBus;
  maxConcurrent?: number;
}

class SubagentManager {
  constructor(config: SubagentManagerConfig) {
    this.executor = config.executor;
    this.bus = config.bus;
  }
}
```

**理由**：
- 便于测试时 mock executor
- 符合依赖注入原则
- 解耦管理器和执行器

### 4. SpawnTool 与 SubagentManager 的关联

**决策**：使用全局上下文模式（与 ToolRegistry 相同）

```typescript
// tools/context.ts 已有模式
let globalManager: SubagentManager | null = null;

export function setGlobalManager(manager: SubagentManager): void {
  globalManager = manager;
}

export function getGlobalManager(): SubagentManager {
  if (!globalManager) {
    throw new Error("SubagentManager not initialized");
  }
  return globalManager;
}

// tools/spawn.ts
class SpawnTool extends BaseTool {
  async execute(args: { task: string; label?: string }) {
    const manager = getGlobalManager();
    const taskId = await manager.spawn({
      task: args.task,
      label: args.label,
      // ...其他参数
    });
    return `后台任务已创建（ID: ${taskId}）`;
  }
}
```

## Risks / Trade-offs

### Risk 1: 循环依赖
**风险**：SpawnTool 需要引用 SubagentManager，而 Manager 注册 Tool 时需要引用 SpawnTool

**缓解**：
- 使用全局上下文模式解耦
- 在 `registerBuiltinTools` 时设置全局 manager

### Risk 2: 测试覆盖
**风险**：拆分后测试需要调整

**缓解**：
- Executor 可独立测试
- Manager 可 mock executor 测试
- SpawnTool 可 mock manager 测试

### Trade-off: 复杂度 vs 可维护性
- 增加 3 个文件，但每个文件职责单一
- 更易于理解和维护
- 符合 nanobot 的设计模式

## Migration Plan

### 阶段 1：创建新结构
1. 创建 `niuma/agent/subagent/` 目录
2. 提取类型定义到 `types.ts`
3. 创建 `executor.ts`，迁移执行逻辑
4. 创建 `manager.ts`，保留管理逻辑

### 阶段 2：实现 SpawnTool
1. 在 `tools/spawn.ts` 实现 SpawnTool
2. 添加全局上下文函数
3. 注册 spawnTool 到 registry

### 阶段 3：更新测试
1. 拆分测试文件
2. 添加 SpawnTool 测试
3. 更新导入路径

### 阶段 4：清理
1. 删除旧的 `subagent.ts`
2. 更新所有导入
3. 运行测试验证
