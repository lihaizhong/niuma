## Why

当前用户只能在配置文件中预设 provider，运行时无法动态切换。当用户需要测试不同模型或应对 API 限流时，必须修改配置文件并重启服务，体验不够流畅。

CLI 作为主要交互渠道，应支持运行时切换已配置的 provider，提升开发调试效率。

## What Changes

- 新增 CLI 斜杠命令 `/provider` 用于查看和切换 provider
- 新增 `/model` 命令用于快速切换模型（可选）
- 切换操作基于 `niuma.config.json` 中已配置的 providers，不新增 provider
- 切换后即时生效，无需重启

## Capabilities

### New Capabilities

- `cli-provider-commands`: CLI 中的 provider 切换命令，包括 `/provider` 和 `/model` 斜杠命令

### Modified Capabilities

- `agent-cli-commands`: 新增 provider 相关的斜杠命令支持

## Impact

- **Affected Files**:
  - `niuma/channels/cli/index.ts` - 新增斜杠命令处理
  - `niuma/config/manager.ts` - 可能需要新增运行时 provider 切换方法
  - `niuma/providers/registry.ts` - 支持动态切换默认 provider
- **Affected APIs**: CLI 斜杠命令接口
- **Dependencies**: 无新增依赖

## Non-goals

- 不支持运行时新增 provider（必须预先在配置文件中定义）
- 不修改 provider 的配置参数（如 temperature、maxTokens）
- 不持久化切换结果（每次启动使用配置文件中的默认值）

## Acceptance Criteria

1. `/provider` 命令列出所有已配置的 provider 及当前激活的 provider
2. `/provider <name>` 切换到指定的 provider
3. `/model <model-name>` 可根据模型名自动匹配 provider 并切换
4. 切换后后续对话使用新的 provider
5. 切换操作显示确认信息
