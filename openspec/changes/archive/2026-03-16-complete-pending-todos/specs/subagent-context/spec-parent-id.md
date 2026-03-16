## ADDED Requirements

### Requirement: 工具可以获取父智能体 ID
系统必须提供机制让子智能体工具获取父智能体的 ID，用于建立父子关系。

#### Scenario: Spawn 工具获取父智能体 ID
- **WHEN** Spawn 工具创建子智能体
- **THEN** 系统应获取调用该工具的父智能体 ID
- **AND** 子智能体配置中应记录正确的父智能体 ID

#### Scenario: 子智能体可以识别父智能体
- **WHEN** 子智能体需要与父智能体通信
- **THEN** 系统应提供父智能体 ID
- **AND** 消息中应包含正确的发送者和接收者 ID