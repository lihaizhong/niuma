## ADDED Requirements

### Requirement: 渠道注册表初始化
系统 SHALL 初始化渠道注册表并支持注册多个渠道实例。

#### Scenario: 创建注册表
- **WHEN** 创建 `ChannelRegistry` 实例
- **THEN** 系统 SHALL 初始化空的渠道映射

#### Scenario: 注册渠道
- **WHEN** 调用 `register()` 方法传入渠道 ID 和渠道实例
- **THEN** 系统 SHALL 将渠道添加到注册表中

#### Scenario: 注册重复渠道
- **WHEN** 尝试注册已存在的渠道 ID
- **THEN** 系统 SHALL 抛出错误并拒绝注册

### Requirement: 渠道注销
系统 SHALL 支持从注册表中注销渠道。

#### Scenario: 注销渠道
- **WHEN** 调用 `unregister()` 方法传入渠道 ID
- **THEN** 系统 SHALL 停止该渠道并从注册表中移除

#### Scenario: 注销不存在的渠道
- **WHEN** 尝试注销不存在的渠道 ID
- **THEN** 系统 SHALL 记录警告但不报错

### Requirement: 批量启动渠道
系统 SHALL 支持批量启动所有已注册的渠道。

#### Scenario: 启动所有渠道
- **WHEN** 调用 `startAll()` 方法
- **THEN** 系统 SHALL 依次启动所有已注册的渠道

#### Scenario: 部分渠道启动失败
- **WHEN** 某个渠道启动失败
- **THEN** 系统 SHALL 记录错误并继续启动其他渠道

#### Scenario: 并发启动渠道
- **WHEN** 调用 `startAll()` 方法
- **THEN** 系统 SHALL 按照配置的顺序或并发启动渠道

### Requirement: 批量停止渠道
系统 SHALL 支持批量停止所有已注册的渠道。

#### Scenario: 停止所有渠道
- **WHEN** 调用 `stopAll()` 方法
- **THEN** 系统 SHALL 依次停止所有已注册的渠道

#### Scenario: 优雅关闭
- **WHEN** 调用 `stopAll()` 方法
- **THEN** 系统 SHALL 等待正在处理的消息完成后再关闭

#### Scenario: 强制关闭超时
- **WHEN** 某个渠道在超时时间内未停止
- **THEN** 系统 SHALL 强制关闭该渠道

### Requirement: 渠道查找和获取
系统 SHALL 支持通过渠道 ID 查找和获取渠道实例。

#### Scenario: 查找存在的渠道
- **WHEN** 调用 `get()` 方法传入存在的渠道 ID
- **THEN** 系统 SHALL 返回对应的渠道实例

#### Scenario: 查找不存在的渠道
- **WHEN** 调用 `get()` 方法传入不存在的渠道 ID
- **THEN** 系统 SHALL 返回 `undefined`

#### Scenario: 列出所有渠道
- **WHEN** 调用 `list()` 方法
- **THEN** 系统 SHALL 返回所有已注册渠道的 ID 列表

### Requirement: 消息路由
系统 SHALL 支持根据消息路由到对应的渠道。

#### Scenario: 路由到目标渠道
- **WHEN** 接收到 `OutboundMessage`
- **THEN** 系统 SHALL 根据 `channel` 字段找到对应的渠道并调用其 `send()` 方法

#### Scenario: 目标渠道不存在
- **WHEN** 目标渠道不存在
- **THEN** 系统 SHALL 记录错误并丢弃消息

#### Scenario: 消息发送失败处理
- **WHEN** 渠道发送消息失败
- **THEN** 系统 SHALL 记录错误并通知事件总线

### Requirement: 事件通知
系统 SHALL 在渠道状态变化时通过事件总线通知。

#### Scenario: 渠道启动通知
- **WHEN** 渠道启动成功
- **THEN** 系统 SHALL 发送 `channel.started` 事件

#### Scenario: 渠道停止通知
- **WHEN** 渠道停止成功
- **THEN** 系统 SHALL 发送 `channel.stopped` 事件

#### Scenario: 渠道错误通知
- **WHEN** 渠道发生错误
- **THEN** 系统 SHALL 发送 `channel.error` 事件

### Requirement: 健康检查聚合
系统 SHALL 支持对所有注册渠道进行健康检查。

#### Scenario: 检查所有渠道健康状态
- **WHEN** 调用 `healthCheckAll()` 方法
- **THEN** 系统 SHALL 返回每个渠道的健康状态

#### Scenario: 自动恢复失败渠道
- **WHEN** 检测到渠道健康状态为 false
- **THEN** 系统 SHALL 尝试自动重启该渠道（可选）

## Dependencies

- 依赖 `channel-base` 中的 `BaseChannel` 接口
- 依赖 `bus/events.ts` 中的事件总线
- 依赖 `types/message.ts` 中的消息类型定义