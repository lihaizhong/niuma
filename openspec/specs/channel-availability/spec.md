# Channel Availability Specification

## Purpose

定义 Channel Availability 的功能规格和行为约束。

This spec defines the requirements for channel availability and the handling of disabled channels.

## Currently Disabled Channels

The following channels are temporarily disabled:

| Channel | Reason | Migration |
|---------|--------|-----------|
| Telegram | 暂时禁用 Telegram 渠道，减少依赖加载 | 取消 `niuma/channels/index.ts` 和 `niuma/channels/registry.ts` 中 Telegram 相关代码的注释即可重新启用 |
| Slack | 暂时禁用 Slack 渠道，减少依赖加载 | 取消 `niuma/channels/index.ts` 和 `niuma/channels/registry.ts` 中 Slack 相关代码的注释即可重新启用 |
| WhatsApp | 暂时禁用 WhatsApp 渠道，减少依赖加载 | 取消 `niuma/channels/index.ts` 和 `niuma/channels/registry.ts` 中 WhatsApp 相关代码的注释即可重新启用 |
| Dingtalk | dingtalk-sdk 需要钉钉运行环境，在 Node.js 中无法正常工作 | 取消 `niuma/channels/index.ts` 和 `niuma/channels/registry.ts` 中 Dingtalk 相关代码的注释即可重新启用（需确保运行环境支持） |

## Requirements

### Requirement: 禁用渠道不影响其他渠道
禁用特定渠道后，其他正常启用的渠道 MUST 能够正常工作。

#### Scenario: CLI 启动成功
- **WHEN** 执行 `niuma --help`
- **THEN** 系统 MUST 正常显示帮助信息
- **THEN** 系统 MUST 不抛出任何错误

#### Scenario: 构建成功
- **WHEN** 执行 `pnpm build`
- **THEN** 构建 MUST 成功完成
- **THEN** 输出文件 MUST 不包含禁用渠道的代码

### Requirement: 禁用渠道代码保留
禁用渠道的实现代码 MUST 保留，不得删除。

#### Scenario: 文件保留
- **WHEN** 渠道被禁用
- **THEN** 渠道的实现文件（如 `niuma/channels/telegram/index.ts`）MUST 保持存在
- **THEN** 渠道的类型定义 MUST 保持存在

#### Scenario: 注释标记
- **WHEN** 禁用渠道的导入语句
- **THEN** 注释 MUST 说明禁用原因
