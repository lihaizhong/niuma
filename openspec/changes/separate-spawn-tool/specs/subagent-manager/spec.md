## MODIFIED Requirements

### Requirement: SubagentManager 只保留管理职责
SubagentManager 必须只负责任务的创建、取消、列表和会话关联，不执行具体的 LLM 调用。

#### Scenario: Manager 创建任务委托给 Executor
- **WHEN** 调用 manager.spawn(options)
- **THEN** Manager 创建任务记录
- **AND** 委托给 SubagentExecutor 执行
- **AND** 返回 taskId

#### Scenario: Manager 取消任务
- **WHEN** 调用 manager.cancel(taskId)
- **THEN** Manager 通过 AbortController 取消任务
- **AND** 返回是否成功取消

#### Scenario: Manager 列出运行中任务
- **WHEN** 调用 manager.list()
- **THEN** 返回运行中任务的列表
- **AND** 包含 taskId、task、label、startTime、duration

### Requirement: SubagentManager 接口定义

```typescript
interface SubagentManagerConfig {
  executor: SubagentExecutor;  // 执行器（注入）
  bus: EventBus;               // 事件总线
  maxConcurrent?: number;      // 最大并发数，默认 5
  taskTimeout?: number;        // 任务超时，默认 10 分钟
}

interface SpawnOptions {
  task: string;                // 任务描述
  label?: string;              // 任务标签
  originChannel: string;       // 来源渠道
  originChatId: string;        // 来源聊天 ID
  sessionKey?: string;         // 会话键
}

interface TaskInfo {
  taskId: string;
  task: string;
  label: string;
  startTime: number;
  duration: number;
}

class SubagentManager {
  constructor(config: SubagentManagerConfig);
  
  spawn(options: SpawnOptions): Promise<string>;
  cancel(taskId: string): boolean;
  cancelBySession(sessionKey: string): Promise<number>;
  list(): TaskInfo[];
  wait(taskId: string, timeout?: number): Promise<ExecuteResult>;
}
```

#### Scenario: Manager 注入 Executor
- **WHEN** 创建 SubagentManager 时传入 executor
- **THEN** Manager 使用注入的 executor 执行任务

### Requirement: SubagentManager 并发控制
Manager 必须限制最大并发子智能体数量为 5。

#### Scenario: 达到并发限制
- **WHEN** 已有 5 个任务运行中
- **AND** 尝试创建新任务
- **THEN** 抛出错误：已达到最大并发限制

## REMOVED Requirements

### Requirement: SubagentManager 直接执行 LLM 循环
**Reason**: 执行逻辑已迁移到 SubagentExecutor
**Migration**: 使用 SubagentExecutor.execute() 代替 _runSubagent()

### Requirement: SubagentManager 构建系统提示词
**Reason**: 已迁移到 SubagentExecutor
**Migration**: 使用 SubagentExecutor.buildSystemPrompt() 代替 _buildSubagentPrompt()

### Requirement: SubagentManager 工具隔离
**Reason**: 已迁移到 SubagentExecutor
**Migration**: 使用 SubagentExecutor.getIsolatedTools() 代替 _getIsolatedTools()
