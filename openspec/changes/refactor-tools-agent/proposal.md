## Why

`tools/agent.ts` 文件命名不清晰，实际只包含 CronTool。应重命名为 `tools/cron.ts` 以提高代码可读性。同时创建 `tools/spawn.ts` 占位文件，为后续实现 SpawnTool 做准备。

## What Changes

- 将 `niuma/agent/tools/agent.ts` 重命名为 `niuma/agent/tools/cron.ts`
- 创建 `niuma/agent/tools/spawn.ts` 占位文件
- 更新 `registry.ts` 的导入路径
- 更新测试文件的导入路径

## Capabilities

### New Capabilities

无新增能力。

### Modified Capabilities

无修改现有能力（仅文件重命名）。

## Impact

- **重命名文件**: `agent.ts` → `cron.ts`
- **新增文件**: `spawn.ts`（占位）
- **修改文件**: `registry.ts`, 测试文件
