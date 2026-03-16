## Why

Niuma 代码库中有 24 个未完成的 TODO，阻碍了项目的完整性和功能完整性。这些 TODO 涵盖 SessionManager 文件系统集成、6 个渠道的 SDK 集成、以及配置管理优化。现在完成这些功能可以提升系统的健壮性、扩展性和可维护性，为用户提供完整的多渠道接入体验。

## What Changes

- **SessionManager 文件系统集成**: 实现从文件系统加载和查询会话的功能
- **QQ 渠道完整实现**: 集成 oicq SDK，实现消息收发
- **WhatsApp 渠道完整实现**: 集成 Baileys SDK，实现消息收发
- **Email 渠道完整实现**: 实现 IMAP 监听和 SMTP 发送
- **飞书渠道完整实现**: 集成飞书官方 SDK，实现消息收发
- **Slack 渠道完整实现**: 集成 Slack Bolt SDK，实现消息收发
- **钉钉渠道完整实现**: 集成钉钉官方 SDK，实现消息收发
- **Agent ID 配置优化**: 从配置中获取 Agent ID，避免硬编码
- **渠道配置加载器**: 实现从配置动态加载渠道的功能

## Capabilities

### New Capabilities
- `session-filesystem-query`: SessionManager 文件系统查询功能，支持按渠道和用户查询会话
- `qq-channel-sdk`: QQ Bot SDK 集成，实现消息监听和发送
- `whatsapp-channel-sdk`: WhatsApp Business API 集成，实现消息监听和发送
- `email-channel-complete`: Email 渠道完整实现，支持 IMAP 监听和 SMTP 发送
- `feishu-channel-sdk`: 飞书开放平台 SDK 集成，实现消息监听和发送
- `slack-channel-complete`: Slack Bolt SDK 集成，实现消息监听和发送
- `dingtalk-channel-sdk`: 钉钉开放平台 SDK 集成，实现消息监听和发送
- `agent-id-config`: Agent ID 配置管理，支持从配置中获取 Agent ID
- `channel-config-loader`: 渠道配置加载器，支持从配置动态创建渠道实例

### Modified Capabilities

## Non-Goals

- 不实现实时消息推送优化（未来扩展）
- 不实现渠道级别的消息持久化（已有 SessionManager）
- 不实现跨渠道消息转发（未来扩展）
- 不实现渠道级别的权限控制（未来扩展）

## Impact

**受影响的代码模块**:
- `niuma/session/manager.ts` - 添加文件系统查询方法
- `niuma/channels/qq/index.ts` - 完整实现
- `niuma/channels/whatsapp/index.ts` - 完整实现
- `niuma/channels/email/index.ts` - 完整实现
- `niuma/channels/feishu/index.ts` - 完整实现
- `niuma/channels/slack/index.ts` - 完整实现
- `niuma/channels/dingtalk/index.ts` - 完整实现
- `niuma/agent/loop.ts` - 优化 Agent ID 配置
- `niuma/channels/registry.ts` - 添加配置加载方法
- `niuma/index.ts` - 完善 CLI 入口

**新增依赖**:
- `oicq` - QQ Bot SDK
- `@whiskeysockets/baileys` - WhatsApp Web API
- `@larksuiteoapi/node-sdk` - 飞书官方 SDK
- `dingtalk-sdk` - 钉钉官方 SDK

**受影响的 API**:
- SessionManager 新增公共方法：`getSessionsByChannel()`, `getSessionsByUser()`, `getSessionStats()`
- ChannelRegistry 新增公共方法：`loadFromConfig()`
- AgentLoopOptions 新增可选字段：`agentId`

**受影响的配置**:
- 渠道配置支持完整的 SDK 参数配置
- Agent 配置支持 Agent ID 字段

## Acceptance Criteria

- 所有 24 个 TODO 已完成并移除
- 所有新增的渠道能够正常启动、接收和发送消息
- SessionManager 能够从文件系统查询会话
- Agent ID 能够从配置中正确获取
- 渠道配置加载器能够正确创建渠道实例
- 所有测试通过（单元测试覆盖率 >= 80%）
- 代码风格检查通过（无警告）
- 类型检查通过（无错误）
- 手动测试验证功能正常
- 文档更新完整（CHANGELOG、AGENTS.md、README.md）