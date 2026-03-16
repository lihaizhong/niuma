## ADDED Requirements

### Requirement: Email 渠道实现
系统 SHALL 实现 Email 渠道，使用 IMAP/SMTP。

#### Scenario: 启动 Email 渠道
- **WHEN** 调用 Email 渠道的 `start()` 方法
- **THEN** 系统 SHALL 使用 IMAP 连接到邮箱服务器

#### Scenario: 接收 Email 消息
- **WHEN** 收到新邮件
- **THEN** 系统 SHALL 将邮件转换为 `InboundMessage` 并触发消息处理器

#### Scenario: 发送 Email 消息
- **WHEN** 调用 Email 渠道的 `send()` 方法
- **THEN** 系统 SHALL 通过 SMTP 发送邮件到指定地址

#### Scenario: 停止 Email 渠道
- **WHEN** 调用 Email 渠道的 `stop()` 方法
- **THEN** 系统 SHALL 断开 IMAP/SMTP 连接并释放资源

### Requirement: 健康检查
系统 SHALL 提供 Email 渠道的健康检查。

#### Scenario: 健康检查成功
- **WHEN** IMAP/SMTP 连接状态正常
- **THEN** 系统 SHALL 返回 `true`

## Dependencies

- 依赖 `channel-base` 中的 `BaseChannel` 接口
- 依赖 `types/message.ts` 中的消息类型定义
- 依赖 `nodemailer` 库用于 SMTP
- 依赖 `imapflow` 库用于 IMAP