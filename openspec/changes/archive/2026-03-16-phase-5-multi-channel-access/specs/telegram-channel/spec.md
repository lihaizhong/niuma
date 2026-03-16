## ADDED Requirements

### Requirement: Telegram 渠道实现
系统 SHALL 实现 Telegram 渠道，使用 HTTP Bot API 或 Webhook。

#### Scenario: 启动 Telegram 渠道（轮询模式）
- **WHEN** 调用 Telegram 渠道的 `start()` 方法
- **THEN** 系统 SHALL 使用 Bot Token 连接到 Telegram API 并开始轮询消息

#### Scenario: 启动 Telegram 渠道（Webhook 模式）
- **WHEN** 配置启用 Webhook
- **THEN** 系统 SHALL 设置 Webhook URL 并通过 HTTP POST 接收消息

#### Scenario: 接收 Telegram 消息
- **WHEN** 收到 Telegram 消息
- **THEN** 系统 SHALL 将消息转换为 `InboundMessage` 并触发消息处理器

#### Scenario: 发送消息到 Telegram
- **WHEN** 调用 Telegram 渠道的 `send()` 方法
- **THEN** 系统 SHALL 通过 Telegram API 发送消息到指定 Chat ID

#### Scenario: 发送媒体消息
- **WHEN** 调用 `send()` 方法传入包含媒体的消息
- **THEN** 系统 SHALL 上传媒体并发送到 Telegram

#### Scenario: 停止 Telegram 渠道
- **WHEN** 调用 Telegram 渠道的 `stop()` 方法
- **THEN** 系统 SHALL 停止轮询或删除 Webhook 并释放资源

### Requirement: 健康检查
系统 SHALL 提供 Telegram 渠道的健康检查。

#### Scenario: 健康检查成功
- **WHEN** 调用 `getMe()` API 成功
- **THEN** 系统 SHALL 返回 `true`

#### Scenario: 健康检查失败
- **WHEN** 调用 `getMe()` API 失败
- **THEN** 系统 SHALL 返回 `false`

## Dependencies

- 依赖 `channel-base` 中的 `BaseChannel` 接口
- 依赖 `types/message.ts` 中的消息类型定义
- 依赖 `telegraf` 库用于 Telegram Bot API