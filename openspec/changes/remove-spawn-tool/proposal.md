## Why

项目中存在两套子智能体实现：`SpawnTool` (agent/tools/agent.ts) 和 `SubagentManager` (agent/subagent.ts)。`SpawnTool` 是一个半成品实现，只创建配置和会话，没有真正的任务执行逻辑，会造成误导和维护负担。`SubagentManager` 有完整的规格定义和功能实现，应保留并独占子智能体管理职责。

## What Changes

- **BREAKING** 删除 `SpawnTool` 类及其相关代码
- 删除未使用的 `AgentMessage` 接口和 `agentMessages` 数组
- 删除未使用的 `SubagentConfig`、`SubagentStatus`、`ModelConfig` 类型
- 从 `ToolRegistry` 移除 `spawnTool` 注册
- 删除 `agent-spawn-tool` 规格
- 更新测试文件移除 SpawnTool 相关测试
- 更新文档示例移除 SpawnTool 使用示例

## Capabilities

### New Capabilities

无新增能力。

### Modified Capabilities

- `agent-spawn-tool`: 删除此规格，功能已被 `agent-subagent` 完整覆盖

## Impact

- **代码文件**:
  - `niuma/agent/tools/agent.ts` - 移除 SpawnTool 类和相关类型
  - `niuma/agent/tools/registry.ts` - 移除 spawnTool 注册
  - `niuma/__tests__/agent-tools.test.ts` - 移除 SpawnTool 测试
  - `niuma/__tests__/tools-acceptance.test.ts` - 移除 SpawnTool 相关断言
  - `niuma/__tests__/integration-context.test.ts` - 移除 SpawnTool 集成测试
  - `docs/tool-security-guide.md` - 移除 SpawnTool 示例
  - `docs/tool-usage-examples.md` - 移除 SpawnTool 示例
  - `openspec/specs/agent-spawn-tool/` - 删除整个目录

- **保留**: `SubagentManager` (agent/subagent.ts) 及其规格 `agent-subagent`
