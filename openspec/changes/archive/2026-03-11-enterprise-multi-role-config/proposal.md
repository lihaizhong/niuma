## Why

当前 Niuma 配置系统仅支持单一全局配置，无法满足企业级场景下多角色、多工作区的需求。开发团队中的项目经理、开发工程师、测试工程师等角色需要完全隔离的工作环境，以避免会话、记忆和日志相互污染。引入企业级多角色配置系统能够支持多个独立角色配置，每个角色拥有专属的工作区、会话存储和日志文件，同时提供灵活的默认值覆盖机制。

## What Changes

- 引入 JSON5 格式作为配置文件格式，支持注释和尾随逗号
- 扩展配置架构支持 `agents.list` 结构，定义多个角色及其独立配置
- 实现 defaults-with-overrides 模式：全局默认配置 + 角色特定配置覆盖
- 实现环境变量引用功能，支持 `${VAR}` 和 `${VAR:default}` 语法
- 实现完全的会话、记忆、技能、日志隔离，每个角色使用独立的工作区
- 扩展 CLI 支持 `--agent` 参数选择角色
- 添加 `niuma agents list` 和 `niuma agents get --id <id>` 命令
- 使用 Zod 实现严格的配置验证，未知字段拒绝启动

## Capabilities

### New Capabilities

- `multi-role-config`: 支持多个角色配置、独立工作区、环境变量引用和严格验证
- `json5-config-loader`: JSON5 格式配置文件加载和解析
- `config-manager`: 配置管理类，处理环境变量解析、配置合并和验证
- `agent-workspace`: 角色工作区管理，包括会话存储、日志和配置隔离
- `agent-cli-commands`: 角色相关的 CLI 命令（list、get）

### Modified Capabilities

- `config-system`: 扩展配置 Schema 以支持多角色架构

## Impact

- 新增依赖：`json5` 库用于解析 JSON5 格式配置
- 修改 `niuma/config/` 模块：扩展 Schema、实现 ConfigManager 类、更新 loader.ts
- 修改 CLI 入口：添加 `--agent` 参数支持和新的 agents 子命令
- 新增配置文件结构：`~/.niuma/niuma.json`（全局配置）、`~/.niuma/.env`（环境变量）、`~/.niuma/agents/{agent-id}/`（角色工作区）
- 新增目录结构：会话存储 `~/.niuma/sessions/{agent-id}/`、日志存储 `~/.niuma/logs/{agent-id}.log`
- 运行时行为变更：启动时必须指定角色或使用默认角色，角色之间完全隔离

## Non-goals

- 不支持角色之间的权限管理或访问控制
- 不支持角色配置的热重载（需要重启）
- 不支持跨角色的会话共享或记忆迁移
- 不支持角色模板的创建和复制（仅手动配置）

## Acceptance Criteria

- [ ] 能成功加载和验证 JSON5 格式的配置文件
- [ ] 支持多个角色配置，每个角色有独立的工作区
- [ ] 环境变量引用 `${VAR}` 和 `${VAR:default}` 正确解析
- [ ] 角色配置能正确覆盖全局默认配置
- [ ] 会话、记忆、技能、日志完全隔离，角色之间无污染
- [ ] CLI 支持 `--agent` 参数选择角色
- [ ] `niuma agents list` 和 `niuma agents get --id <id>` 命令正常工作
- [ ] 未知配置字段导致启动失败并显示清晰错误信息
- [ ] 所有新功能有对应的单元测试覆盖