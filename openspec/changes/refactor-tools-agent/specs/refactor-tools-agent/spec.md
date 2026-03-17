## ADDED Requirements

无新增需求。此变更仅涉及文件重命名，不改变系统功能。

## Note

此变更为纯技术重构：
- 重命名 `agent.ts` → `cron.ts`
- 创建空的 `spawn.ts` 占位文件

功能变更在以下变更中实现：
- `remove-spawn-tool`: 删除旧的 SpawnTool
- `implement-spawn-tool`: 实现新的 SpawnTool
