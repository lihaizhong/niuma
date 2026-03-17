## ADDED Requirements

### Requirement: 重构工具代理文件
This change SHALL reorganize tool files by renaming `agent.ts` to `cron.ts` and creating an empty `spawn.ts` placeholder. No functional changes are introduced.

#### Scenario: 文件重命名不影响功能
- **WHEN** the tool files are reorganized
- **THEN** existing functionality remains unchanged
- **AND** no breaking changes to the public API

## Note

此变更为纯技术重构：
- 重命名 `agent.ts` → `cron.ts`
- 创建空的 `spawn.ts` 占位文件

功能变更在 `separate-spawn-tool` 变更中实现。