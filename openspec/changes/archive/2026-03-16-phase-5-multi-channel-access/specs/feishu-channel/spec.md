## ADDED Requirements

### Requirement: 飞书渠道实现
系统 SHALL 实现飞书渠道，使用 WebSocket 长连接。

#### Scenario: 启动飞书渠道
- **WHEN** 调用飞书渠道的 `start()` 方法
- **THEN** 系统 SHALL 使用 App ID 和 Secret 连接到飞书 WebSocket

#### Scenario: 接收飞书消息
- **WHEN** 收到飞书消息事件
- **THEN** 系统 SHALL 将消息转换为 `InboundMessage` 并触发消息处理器

#### Scenario: 发送消息到飞书
- **WHEN** 调用飞书渠道的 `send()` 方法
- **THEN** 系统 SHALL 通过飞书 API 发送消息到指定会话

#### Scenario: 停止飞书渠道
- **WHEN** 调用飞书渠道的 `stop()` 方法
- **THEN** 系统 SHALL 断开 WebSocket 连接并释放资源

### Requirement: 健康检查
系统 SHALL 提供飞书渠道的健康检查。

#### Scenario: 健康检查成功
- **WHEN** WebSocket 连接状态正常
- **THEN** 系统 SHALL 返回 `true`

## Dependencies

- 依赖 `channel-base` 中的 `BaseChannel` 接口
- 依赖 `types/message.ts` 中的消息类型定义