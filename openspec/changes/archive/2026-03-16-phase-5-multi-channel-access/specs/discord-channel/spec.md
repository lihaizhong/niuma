## ADDED Requirements

### Requirement: Discord 渠道实现
系统 SHALL 实现 Discord 渠道，使用 WebSocket Gateway。

#### Scenario: 启动 Discord 渠道
- **WHEN** 调用 Discord 渠道的 `start()` 方法
- **THEN** 系统 SHALL 使用 Bot Token 连接到 Discord Gateway

#### Scenario: 接收 Discord 消息
- **WHEN** 收到 Discord 消息事件
- **THEN** 系统 SHALL 将消息转换为 `InboundMessage` 并触发消息处理器

#### Scenario: 发送消息到 Discord
- **WHEN** 调用 Discord 渠道的 `send()` 方法
- **THEN** 系统 SHALL 通过 Discord API 发送消息到指定频道

#### Scenario: 发送嵌入消息
- **WHEN** 消息包含嵌入内容
- **THEN** 系统 SHALL 发送 Discord Embed 格式的消息

#### Scenario: 停止 Discord 渠道
- **WHEN** 调用 Discord 渠道的 `stop()` 方法
- **THEN** 系统 SHALL 断开 WebSocket 连接并释放资源

### Requirement: 健康检查
系统 SHALL 提供 Discord 渠道的健康检查。

#### Scenario: 健康检查成功
- **WHEN** WebSocket 连接状态为 READY
- **THEN** 系统 SHALL 返回 `true`

#### Scenario: 健康检查失败
- **WHEN** WebSocket 连接断开
- **THEN** 系统 SHALL 返回 `false`

## Dependencies

- 依赖 `channel-base` 中的 `BaseChannel` 接口
- 依赖 `types/message.ts` 中的消息类型定义
- 依赖 `discord.js` 库用于 Discord API