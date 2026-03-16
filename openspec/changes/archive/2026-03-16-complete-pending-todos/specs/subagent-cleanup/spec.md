## ADDED Requirements

### Requirement: 子智能体支持资源清理
系统必须支持子智能体的优雅关闭和资源清理。

#### Scenario: 停止子智能体时清理资源
- **WHEN** 父智能体调用 stopSubagent 方法
- **THEN** 系统应将子智能体状态设置为 "completed"
- **AND** 应清理子智能体的工作区文件
- **AND** 应清理子智能体的会话数据

#### Scenario: 子智能体超时时自动清理
- **WHEN** 子智能体执行超时
- **THEN** 系统应自动停止子智能体
- **AND** 应清理相关资源
- **AND** 应记录超时日志

#### Scenario: 清理失败不影响其他子智能体
- **WHEN** 某个子智能体清理失败
- **THEN** 系统应记录错误日志
- **AND** 不应影响其他子智能体的运行