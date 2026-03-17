## Why

删除旧的不完整 SpawnTool 后，LLM 失去了通过工具调用创建子智能体的能力。需要在 SubagentManager 服务的基础上，重新实现一个 LLM 可调用的 spawn 工具，让 LLM 能够通过自然语言指令创建和管理后台子智能体任务。

## What Changes

- 新增 `SpawnTool` 类，作为 `SubagentManager.spawn()` 的 LLM 工具接口
- 在 `ToolRegistry` 注册新的 spawn 工具
- spawn 工具参数：task (任务描述)、label (可选标签)
- 工具执行后返回任务 ID 和状态信息

## Capabilities

### New Capabilities

- `agent-spawn-tool`: LLM 可调用的子智能体创建工具

### Modified Capabilities

无修改现有能力。

## Impact

- **新增文件**: `niuma/agent/tools/spawn.ts` - 新的 SpawnTool 实现
- **修改文件**:
  - `niuma/agent/tools/registry.ts` - 注册 spawn 工具
  - `niuma/agent/tools/context.ts` - 添加 getSubagentManager() 方法
- **测试文件**: `niuma/__tests__/spawn-tool.test.ts`
