## ADDED Requirements

### Requirement: 钉钉渠道实现
系统 SHALL 实现钉钉渠道，使用 Stream Mode。

#### Scenario: 启动钉钉渠道
- **WHEN** 调用钉钉渠道的 `start()` 方法
- **THEN** 系统 SHALL 使用 App Key 和 Secret 连接到钉钉 Stream Mode

#### Scenario: 接收钉钉消息
- **WHEN** 收到钉钉消息事件
- **THEN** 系统 SHALL 将消息转换为 `InboundMessage` 并触发消息处理器

#### Scenario: 发送消息到钉钉
- **WHEN** 调用钉钉渠道的 `send()` 方法
- **THEN** 系统 SHALL 通过钉钉 API 发送消息到指定会话

#### Scenario: 停止钉钉渠道
- **WHEN** 调用钉钉渠道的 `stop()` 方法
- **THEN** 系统 SHALL 断开 Stream Mode 连接并释放资源

### Requirement: 健康检查
系统 SHALL 提供钉钉渠道的健康检查。

#### Scenario: 健康检查成功
- **WHEN** Stream Mode 连接状态正常
- **THEN** 系统 SHALL 返回 `true`

## Dependencies

- 依赖 `channel-base` 中的 `BaseChannel` 接口
- 依赖 `types/message.ts` 中的消息类型定义