# message-tool Specification

## Purpose
TBD - created by archiving change builtin-tools-implementation. Update Purpose after archive.
## Requirements
### Requirement: message 工具发送消息

系统 SHALL 提供 message 工具，能够通过配置的渠道发送消息。

#### Scenario: 发送文本消息
- **WHEN** Agent 调用 message 并提供文本内容
- **THEN** 系统通过渠道发送消息
- **AND** 返回发送确认
- **AND** 包含消息 ID

#### Scenario: 发送富文本消息
- **WHEN** Agent 提供格式化的内容（Markdown 等）
- **THEN** 系统解析格式
- **AND** 发送富文本消息
- **AND** 保留格式

#### Scenario: 发送失败
- **WHEN** 渠道不可用或发送失败
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息包含失败原因
- **AND** 记录失败日志

#### Scenario: 消息队列
- **WHEN** 消息需要排队发送
- **THEN** 系统将消息加入队列
- **AND** 按顺序发送
- **AND** 返回队列位置

### Requirement: 多渠道支持

系统 SHALL 支持通过多个渠道发送消息。

#### Scenario: 指定渠道
- **WHEN** Agent 提供渠道名称
- **THEN** 系统使用指定渠道发送
- **AND** 返回发送结果

#### Scenario: 默认渠道
- **WHEN** Agent 未指定渠道
- **THEN** 系统使用默认渠道（CLI）
- **AND** 发送消息

#### Scenario: 广播消息
- **WHEN** Agent 提供多个渠道
- **THEN** 系统向所有渠道发送
- **AND** 返回每个渠道的发送结果

#### Scenario: 渠道不可用
- **WHEN** 指定的渠道未配置或不可用
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息说明渠道不可用

### Requirement: 消息优先级

系统 SHALL 支持消息优先级控制。

#### Scenario: 高优先级消息
- **WHEN** Agent 设置消息优先级为 high
- **THEN** 系统优先发送该消息
- **AND** 跳过队列中的低优先级消息

#### Scenario: 默认优先级
- **WHEN** Agent 未设置优先级
- **THEN** 系统使用默认优先级（normal）
- **AND** 按正常顺序发送

#### Scenario: 低优先级消息
- **WHEN** Agent 设置消息优先级为 low
- **THEN** 系统在发送完高优先级消息后发送
- **AND** 可能被延迟

### Requirement: 消息状态跟踪

系统 SHALL 跟踪消息发送状态。

#### Scenario: 消息已发送
- **WHEN** 消息成功发送
- **THEN** 系统标记为已发送
- **AND** 记录发送时间
- **AND** 存储消息 ID

#### Scenario: 消息已送达
- **WHEN** 渠道确认消息已送达
- **THEN** 系统更新状态为已送达
- **AND** 记录送达时间

#### Scenario: 消息已读
- **WHEN** 渠道确认消息已读
- **THEN** 系统更新状态为已读
- **AND** 记录已读时间

#### Scenario: 消息失败
- **WHEN** 消息发送失败
- **THEN** 系统标记为失败
- **AND** 记录失败原因
- **AND** 支持重试

### Requirement: 消息历史

系统 SHALL 维护消息发送历史。

#### Scenario: 记录消息
- **WHEN** 发送任何消息
- **THEN** 系统记录消息内容
- **AND** 记录发送时间
- **AND** 记录目标渠道
- **AND** 记录发送状态

#### Scenario: 查询历史
- **WHEN** Agent 请求消息历史
- **THEN** 系统返回历史消息列表
- **AND** 按时间倒序排列
- **AND** 支持过滤和分页

#### Scenario: 历史清理
- **WHEN** 消息历史超过保留期限
- **THEN** 系统自动清理过期消息
- **AND** 保留重要消息标记

