## ADDED Requirements

### Requirement: CLI 渠道实现
系统 SHALL 实现 CLI 渠道，支持 stdin/stdout 交互。

#### Scenario: 启动 CLI 渠道
- **WHEN** 调用 CLI 渠道的 `start()` 方法
- **THEN** 系统 SHALL 开始监听 stdin 输入

#### Scenario: 接收用户输入
- **WHEN** 用户在终端输入文本
- **THEN** 系统 SHALL 将输入转换为 `InboundMessage` 并触发消息处理器

#### Scenario: 发送响应到终端
- **WHEN** 调用 CLI 渠道的 `send()` 方法
- **THEN** 系统 SHALL 将消息输出到 stdout

#### Scenario: 停止 CLI 渠道
- **WHEN** 调用 CLI 渠道的 `stop()` 方法
- **THEN** 系统 SHALL 停止监听 stdin

### Requirement: 健康检查
系统 SHALL 提供 CLI 渠道的健康检查。

#### Scenario: 健康检查成功
- **WHEN** 调用 CLI 渠道的 `healthCheck()` 方法
- **THEN** 系统 SHALL 返回 `true`（CLI 渠道始终可用）

## Dependencies

- 依赖 `channel-base` 中的 `BaseChannel` 接口
- 依赖 `types/message.ts` 中的消息类型定义