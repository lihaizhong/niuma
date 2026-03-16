## ADDED Requirements

### Requirement: 工具可以获取当前 Agent ID
系统必须提供机制让工具在运行时获取当前 Agent 的 ID，而不是硬编码为 "default"。

#### Scenario: Spawn 工具获取当前 Agent ID
- **WHEN** Spawn 工具被调用
- **THEN** 系统应返回调用该工具的 Agent 的实际 ID
- **AND** 不应硬编码为 "default"

#### Scenario: Message 工具获取当前 Agent ID
- **WHEN** Message 工具被调用
- **THEN** 系统应返回调用该工具的 Agent 的实际 ID
- **AND** 消息历史中应记录正确的 Agent ID

#### Scenario: 工具无法获取 Agent ID 时使用默认值
- **WHEN** 工具尝试获取 Agent ID 但无法获取
- **THEN** 系统应返回 "default" 作为默认值
- **AND** 应记录警告日志