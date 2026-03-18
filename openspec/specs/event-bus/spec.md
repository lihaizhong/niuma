# Event Bus Specification

## Purpose

定义 Event Bus 的功能规格和行为约束。

## Requirements

### Requirement: 类型安全的事件系统

系统 SHALL 提供基于 Node.js EventEmitter 的类型安全事件发射器。

#### Scenario: 定义事件类型
- **WHEN** 定义事件
- **THEN** EventType SHALL 包括 MESSAGE_RECEIVED、MESSAGE_SENT、TOOL_CALL_START、TOOL_CALL_END、LLM_REQUEST_START、LLM_RESPONSE、ERROR、HEARTBEAT

#### Scenario: 事件数据是类型化的
- **WHEN** 发出或监听事件
- **THEN** EventMap SHALL 为每个事件类型的数据提供类型安全

### Requirement: 事件发射器单例

系统 SHALL 提供单例 EventEmitter 实例和辅助函数。

#### Scenario: 导出单例发射器
- **WHEN** 从 bus/events 导入
- **THEN** 模块级单例 `bus` SHALL 可用

#### Scenario: 使用辅助函数发射
- **WHEN** 调用 `emit(type, data)`
- **THEN** 事件 SHALL 被发出，并自动添加时间戳

#### Scenario: 使用辅助函数监听
- **WHEN** 调用 `on(type, handler)` 或 `once(type, handler)`
- **THEN** handler SHALL 接收类型化的事件数据

### Requirement: 异步消息队列

系统 SHALL 提供用于消息缓冲的异步队列。

#### Scenario: 入队消息
- **WHEN** 调用 `queue.enqueue(item)`
- **THEN** item SHALL 被添加到队列

#### Scenario: 出队消息
- **WHEN** 调用 `queue.dequeue()`
- **THEN** SHALL 按 FIFO 顺序返回下一个 item

#### Scenario: 队列大小
- **WHEN** 访问 `queue.size`
- **THEN** SHALL 返回当前队列长度