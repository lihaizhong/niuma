## Context

当前 `tools/agent.ts` 只包含 `CronTool`，文件名与内容不匹配。

## Goals / Non-Goals

**Goals:**
- 重命名文件以提高可读性
- 创建 spawn.ts 占位文件

**Non-Goals:**
- 不修改工具功能
- 不实现 SpawnTool（在 implement-spawn-tool 变更中实现）

## Decisions

### D1: 重命名 agent.ts 为 cron.ts

**理由**: 文件只包含 CronTool，命名应反映实际内容。

### D2: 创建空的 spawn.ts

**理由**: 为 implement-spawn-tool 变更预留位置，避免后续创建新文件。

## Risks / Trade-offs

- **风险**: 导入路径变更可能遗漏
  - 缓解: 全局搜索 `from "./agent"` 并更新
