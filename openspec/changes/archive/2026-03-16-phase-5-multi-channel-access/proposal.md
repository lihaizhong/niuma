## Why

Niuma 目前仅支持 CLI 渠道，用户无法通过 Telegram、Discord、飞书、钉钉、Slack、WhatsApp、Email、QQ 等主流消息平台使用 AI 助手。多渠道接入可以大幅提升用户体验和可访问性，让用户在任何平台都能方便地使用 Niuma 的功能。

## What Changes

- 新增渠道抽象层（`channels/base.ts`）定义统一的渠道接口
- 实现 9 个渠道：CLI、Telegram、Discord、飞书、钉钉、Slack、WhatsApp、Email、QQ
- 实现渠道注册表（`channels/registry.ts`）管理渠道生命周期
- 扩展配置系统支持渠道配置（`config/schema.ts`）
- 集成渠道到 Agent Loop，支持多渠道消息接收和发送
- 实现渠道会话管理和消息路由

## Capabilities

### New Capabilities

- `channel-base`: 渠道抽象接口，定义统一的渠道行为规范
- `cli-channel`: CLI 渠道实现，支持 stdin/stdout 交互
- `telegram-channel`: Telegram Bot API 渠道实现
- `discord-channel`: Discord WebSocket Gateway 渠道实现
- `feishu-channel`: 飞书 WebSocket 长连接渠道实现
- `dingtalk-channel`: 钉钉 Stream Mode 渠道实现
- `slack-channel`: Slack Socket Mode 渠道实现
- `whatsapp-channel`: WhatsApp WebSocket Bridge 渠道实现
- `email-channel`: Email IMAP/SMTP 渠道实现
- `qq-channel`: QQ WebSocket 渠道实现
- `channel-registry`: 渠道注册表，管理渠道注册、启动、停止和消息路由

### Modified Capabilities

- `agent-loop`: 扩展 Agent Loop 支持多渠道消息接收和处理
- `session-manager`: 扩展会话管理器支持渠道会话隔离和路由

## Impact

**新增代码：**
- `niuma/channels/` - 新模块目录
  - `base.ts` - 渠道抽象接口
  - `cli/` - CLI 渠道实现
  - `telegram/` - Telegram 渠道实现
  - `discord/` - Discord 渠道实现
  - `feishu/` - 飞书渠道实现
  - `dingtalk/` - 钉钉渠道实现
  - `slack/` - Slack 渠道实现
  - `whatsapp/` - WhatsApp 渠道实现
  - `email/` - Email 渠道实现
  - `qq/` - QQ 渠道实现
  - `registry.ts` - 渠道注册表

**受影响模块：**
- `niuma/agent/loop.ts` - 需集成渠道消息接收
- `niuma/session/manager.ts` - 需扩展会话管理支持渠道
- `niuma/config/schema.ts` - 需添加渠道配置段
- `niuma/cli/` - 需扩展 CLI 支持多渠道启动

**新增依赖：**
- `telegraf` - Telegram Bot API 框架
- `discord.js` - Discord Bot API 框架
- `@slack/bolt` - Slack Bolt API 框架
- `nodemailer` - Email 发送（SMTP）
- `imapflow` - Email 接收（IMAP）

**配置：**
- 新增 `channels` 配置段（每个渠道的独立配置）
- 支持启用/禁用各个渠道
- 支持渠道优先级和消息路由规则

**无破坏性变更**