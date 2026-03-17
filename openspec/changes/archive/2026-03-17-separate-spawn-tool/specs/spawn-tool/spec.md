## ADDED Requirements

### Requirement: SpawnTool 作为 LLM 可调用工具
SpawnTool SHALL inherit from BaseTool class and provide an LLM-callable tool interface for creating background subagent tasks.

#### Scenario: LLM 调用 spawn 工具创建任务
- **WHEN** LLM 调用 spawn 工具，参数为 `{ task: "分析项目结构", label: "项目分析" }`
- **THEN** 工具返回 taskId 字符串，格式为 `subagent-{uuid}`
- **AND** 返回消息包含任务创建确认信息

#### Scenario: spawn 工具缺少必填参数
- **WHEN** LLM 调用 spawn 工具，缺少 task 参数
- **THEN** 工具返回参数验证错误

#### Scenario: spawn 工具达到并发限制
- **WHEN** LLM 调用 spawn 工具时，已有 5 个子智能体在运行
- **THEN** 工具返回错误消息：已达到最大并发限制

### Requirement: SpawnTool 参数定义
SpawnTool SHALL define the following parameters:
- `task`: string（必填）- 任务描述
- `label`: string（可选）- 任务标签

#### Scenario: 验证参数 schema
- **WHEN** 检查 SpawnTool.parameters
- **THEN** 参数 schema 包含 task（必填）和 label（可选）

### Requirement: SpawnTool 通过全局上下文获取 SubagentManager
SpawnTool SHALL obtain the SubagentManager instance through the `getGlobalManager()` function for decoupling.

#### Scenario: 全局 Manager 未初始化
- **WHEN** 调用 spawn 工具时全局 Manager 未设置
- **THEN** 抛出错误："SubagentManager not initialized"

### Requirement: SpawnTool 接口定义
SpawnTool SHALL implement the following interface:

```typescript
interface SpawnToolArgs {
  task: string;      // 任务描述（必填）
  label?: string;    // 任务标签（可选）
}

class SpawnTool extends BaseTool {
  readonly name = "spawn";
  readonly description = "创建后台子智能体任务，独立执行复杂操作";
  readonly parameters: ZodSchema<SpawnToolArgs>;
  
  execute(args: SpawnToolArgs): Promise<string>;
}
```

#### Scenario: 接口符合 TypeScript 定义
- **WHEN** 检查 SpawnTool 类实现
- **THEN** 类包含 name、description、parameters 属性
- **AND** execute 方法接受 SpawnToolArgs 参数并返回 Promise<string>
