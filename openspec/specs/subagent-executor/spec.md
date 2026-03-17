# subagent-executor Specification

## Purpose
TBD - created by archiving change separate-spawn-tool. Update Purpose after archive.
## Requirements
### Requirement: SubagentExecutor 封装执行逻辑
SubagentExecutor SHALL encapsulate the LLM loop and tool invocation logic for subagents, decoupled from SubagentManager.

#### Scenario: Executor 执行任务
- **WHEN** Executor.run() 被调用，传入任务描述和配置
- **THEN** Executor 启动 LLM 循环，最多迭代 15 次
- **AND** 执行工具调用并返回结果

#### Scenario: Executor 工具隔离
- **WHEN** Executor 获取可用工具列表
- **THEN** 排除 message、spawn 等工具
- **AND** 子智能体不能发送消息或创建子智能体

### Requirement: SubagentExecutor 接口定义
SubagentExecutor SHALL implement the following interface:

```typescript
interface SubagentExecutorConfig {
  provider: LLMProvider;       // LLM 提供商
  tools: ToolRegistry;         // 工具注册表
  workspace?: string;          // 工作空间路径
  model?: string;              // 模型名称
  temperature?: number;        // 采样温度
  maxTokens?: number;          // 最大 token 数
}

interface ExecuteOptions {
  taskId: string;              // 任务 ID
  task: string;                // 任务描述
  signal?: AbortSignal;        // 取消信号
}

interface ExecuteResult {
  status: 'success' | 'error' | 'cancelled';
  content: string;
  error?: string;
}

class SubagentExecutor {
  constructor(config: SubagentExecutorConfig);
  
  execute(options: ExecuteOptions): Promise<ExecuteResult>;
  
  getIsolatedTools(): ToolDefinition[];
  buildSystemPrompt(): string;
}
```

#### Scenario: Executor 返回执行结果
- **WHEN** Executor 完成任务执行
- **THEN** 返回 ExecuteResult 对象
- **AND** 包含 status、content 字段

### Requirement: SubagentExecutor 支持任务取消
Executor SHALL support task cancellation through AbortSignal.

#### Scenario: 任务被取消
- **WHEN** AbortSignal 被触发
- **THEN** Executor 停止 LLM 循环
- **AND** 返回 status 为 'cancelled' 的结果

### Requirement: SubagentExecutor 构建系统提示词
Executor SHALL construct the system prompt for subagents, including workspace and available tool information.

#### Scenario: 生成系统提示词
- **WHEN** 调用 buildSystemPrompt()
- **THEN** 返回包含工作空间路径和可用工具列表的提示词

### Requirement: SubagentExecutor 最大迭代次数
Executor SHALL limit the maximum iteration count to 15.

#### Scenario: 达到最大迭代次数
- **WHEN** LLM 循环达到 15 次迭代
- **THEN** 停止循环并返回当前结果
- **AND** 结果中说明达到最大迭代次数

