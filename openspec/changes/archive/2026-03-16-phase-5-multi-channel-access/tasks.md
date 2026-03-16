## 1. 基础设施准备

- [x] 1.1 创建 channels 模块目录结构
  - 创建 `niuma/channels/` 目录
  - 创建各渠道子目录（cli、telegram、discord 等）
  - 创建 `index.ts` 统一导出文件

- [x] 1.2 添加渠道依赖包到 package.json
  - 添加 `telegraf`（Telegram Bot API）
  - 添加 `discord.js`（Discord Bot API）
  - 添加 `@slack/bolt`（Slack Bolt API）
  - 添加 `nodemailer`（Email SMTP）
  - 添加 `imapflow`（Email IMAP）

- [x] 1.3 更新配置 Schema 添加 channels 段
  - 在 `config/schema.ts` 中添加 `channels` 配置段
  - 定义 channels 配置的验证规则（使用 zod）
  - 添加默认值（enabled、defaults、各渠道配置）

## 2. 渠道抽象层实现

- [x] 2.1 实现渠道基类接口
  - 在 `channels/base.ts` 中定义 `BaseChannel` 抽象类
  - 定义生命周期方法（start、stop）
  - 定义消息发送方法（send）
  - 定义消息接收方法（onMessage）
  - 定义健康检查方法（healthCheck）

- [x] 2.2 实现渠道类型定义
  - 在 `channels/types.ts` 中定义渠道相关类型
  - 定义 `ChannelConfig` 接口
  - 定义 `ChannelStatus` 枚举
  - 定义 `ChannelOptions` 接口

- [x] 2.3 实现错误处理和重试逻辑
  - 实现指数退避重试机制
  - 实现错误分类和处理策略
  - 实现错误日志记录

## 3. 渠道注册表实现

- [x] 3.1 实现 ChannelRegistry 类
  - 在 `channels/registry.ts` 中实现 `ChannelRegistry` 类
  - 实现渠道注册方法（register）
  - 实现渠道注销方法（unregister）
  - 实现渠道查找方法（get）
  - 实现渠道列表方法（list）

- [x] 3.2 实现批量启动和停止
  - 实现 `startAll()` 方法
  - 实现 `stopAll()` 方法
  - 实现优雅关闭逻辑
  - 实现超时处理机制

- [x] 3.3 实现消息路由
  - 实现消息路由逻辑
  - 处理目标渠道不存在的情况
  - 实现消息发送失败处理

- [x] 3.4 实现事件通知
  - 实现渠道状态变化通知
  - 发送 channel.started 事件
  - 发送 channel.stopped 事件
  - 发送 channel.error 事件

- [x] 3.5 实现健康检查聚合
  - 实现 `healthCheckAll()` 方法
  - 返回每个渠道的健康状态
  - 实现自动恢复机制（可选）

## 4. CLI 渠道实现

- [x] 4.1 实现 CLIChannel 类
  - 继承 `BaseChannel` 抽象类
  - 实现 `start()` 方法（监听 stdin）
  - 实现 `stop()` 方法（停止监听）
  - 实现 `send()` 方法（输出到 stdout）
  - 实现 `onMessage()` 方法（接收用户输入）

- [x] 4.2 实现消息格式转换
  - 将 stdin 输入转换为 `InboundMessage`
  - 将 `OutboundMessage` 转换为 stdout 输出
  - 处理特殊字符和换行

- [x] 4.3 实现 CLI 渠道健康检查
  - 始终返回 `true`（CLI 渠道始终可用）

## 5. Telegram 渠道实现

- [x] 5.1 实现 TelegramChannel 类
  - 继承 `BaseChannel` 抽象类
  - 实现 `start()` 方法（连接 Telegram API）
  - 实现 `stop()` 方法（断开连接）
  - 实现 `send()` 方法（发送消息）
  - 实现 `onMessage()` 方法（接收消息）

- [x] 5.2 实现消息格式转换
  - 将 Telegram 消息转换为 `InboundMessage`
  - 将 `OutboundMessage` 转换为 Telegram 消息
  - 处理媒体消息

- [x] 5.3 实现 Webhook 支持
  - 支持 Webhook 模式
  - 支持 Polling 模式
  - 实现 Webhook URL 设置

- [x] 5.4 实现 Telegram 渠道健康检查
  - 调用 `getMe()` API 检查连接状态

## 6. Discord 渠道实现

- [x] 6.1 实现 DiscordChannel 类
  - 继承 `BaseChannel` 抽象类
  - 实现 `start()` 方法（连接 Discord Gateway）
  - 实现 `stop()` 方法（断开连接）
  - 实现 `send()` 方法（发送消息）
  - 实现 `onMessage()` 方法（接收消息）

- [x] 6.2 实现消息格式转换
  - 将 Discord 消息转换为 `InboundMessage`
  - 将 `OutboundMessage` 转换为 Discord 消息
  - 处理 Embed 消息

- [x] 6.3 实现 Discord 渠道健康检查
  - 检查 WebSocket 连接状态

## 7. 复杂渠道实现

- [x] 7.1 实现飞书渠道
  - 在 `channels/feishu/index.ts` 中实现 `FeishuChannel` 类
  - 基础框架（待完善）

- [x] 7.2 实现钉钉渠道
  - 在 `channels/dingtalk/index.ts` 中实现 `DingtalkChannel` 类
  - 基础框架（待完善）

- [x] 7.3 实现 Slack 渠道
  - 在 `channels/slack/index.ts` 中实现 `SlackChannel` 类
  - 基础框架（待完善）

- [x] 7.4 实现 Email 渠道
  - 在 `channels/email/index.ts` 中实现 `EmailChannel` 类
  - 基础框架（待完善）

- [x] 7.5 实现 WhatsApp 渠道
  - 在 `channels/whatsapp/index.ts` 中实现 `WhatsAppChannel` 类
  - 基础框架（待完善）

- [x] 7.6 实现 QQ 渠道
  - 在 `channels/qq/index.ts` 中实现 `QQChannel` 类
  - 基础框架（待完善）

## 8. Agent Loop 集成

- [x] 8.1 更新 AgentLoopOptions 接口
  - 添加 channelsConfig 字段
  - 添加 channelRegistry 字段

- [x] 8.2 实现多渠道消息接收
  - 在 AgentLoop 中集成渠道注册表
  - 实现从渠道接收消息的逻辑

- [x] 8.3 实现消息发送到渠道
  - 更新 MESSAGE_SENT 事件处理
  - 实现通过渠道发送响应

- [x] 8.4 实现渠道生命周期管理
  - 在 initialize() 中启动渠道
  - 在 shutdown() 中停止渠道

- [x] 8.5 扩展 ProcessOptions
  - 添加渠道相关选项
  - 支持渠道特定的配置

## 9. SessionManager 扩展

- [x] 9.1 实现 SessionKey 生成逻辑
  - 使用 `${channel}:${chatId}` 格式
  - 确保会话隔离

- [x] 9.2 实现最近活跃渠道记录
  - 实现 `getLastActiveChannel()` 方法
  - 返回最近活跃的渠道类型和会话键
  - 更新活跃状态

- [x] 9.3 实现渠道会话查询
  - 实现 `listSessionsByChannel()` 方法
  - 实现 `getSession()` 方法

- [x] 9.4 实现会话统计
  - 实现 `getChannelStats()` 方法
  - 实现 `getGlobalStats()` 方法

- [x] 9.5 实现会话过期清理
  - 实现 `cleanupExpiredSessions()` 方法
  - 实现 `cleanupIdleSessions()` 方法

- [x] 9.6 更新 Session 接口
  - 添加 `channel` 字段
  - 添加 `chatId` 字段

## 10. CLI 扩展

- [ ] 10.1 更新 CLI 入口
  - 添加渠道配置参数
  - 支持选择性启动渠道

- [ ] 10.2 实现渠道状态显示
  - 添加渠道状态命令
  - 显示每个渠道的健康状态

- [ ] 10.3 实现渠道管理命令
  - 添加渠道启动/停止命令
  - 添加渠道列表命令

## 11. 测试

- [ ] 11.1 编写渠道抽象层测试
  - 测试 BaseChannel 接口
  - 测试 ChannelRegistry 功能
  - 测试消息路由逻辑

- [ ] 11.2 编写 CLI 渠道测试
  - 测试 stdin/stdout 交互
  - 测试消息格式转换

- [ ] 11.3 编写 Telegram 渠道测试
  - 测试消息发送和接收
  - 测试 Webhook 模式
  - 测试 Polling 模式

- [ ] 11.4 编写 Discord 渠道测试
  - 测试消息发送和接收
  - 测试 Embed 消息

- [ ] 11.5 编写集成测试
  - 测试 Agent Loop 与渠道集成
  - 测试 SessionManager 与渠道集成
  - 测试多渠道并发处理

## 12. 文档

- [ ] 12.1 创建渠道配置示例
  - 提供完整的配置示例
  - 说明各渠道的配置参数
  - 添加环境变量示例

- [ ] 12.2 更新项目文档
  - 在 `AGENTS.md` 中添加渠道说明
  - 在 `docs/niuma-development-plan.md` 中更新 Phase 5 状态
  - 在 `CHANGELOG.md` 中记录新功能

- [ ] 12.3 创建用户指南
  - 说明如何配置和使用渠道
  - 提供各渠道的配置示例
  - 提供常见问题和故障排查指南

## 13. 验证和清理

- [ ] 13.1 运行所有测试
  - 执行单元测试（pnpm test）
  - 执行集成测试
  - 确保所有测试通过

- [ ] 13.2 代码审查
  - 检查代码风格（使用 ESLint）
  - 检查 TypeScript 类型（pnpm type-check）
  - 优化代码结构和性能

- [ ] 13.3 手动测试
  - 启动 Agent 并启用多个渠道
  - 测试各渠道的消息发送和接收
  - 测试会话隔离功能
  - 测试渠道健康检查

- [ ] 13.4 性能测试
  - 测试多渠道并发性能
  - 测试消息吞吐量
  - 测试内存占用

- [ ] 13.5 归档变更
  - 使用 `/opsx:archive` 归档变更
  - 验证规格同步到 `openspec/specs/`
  - 更新开发计划文档