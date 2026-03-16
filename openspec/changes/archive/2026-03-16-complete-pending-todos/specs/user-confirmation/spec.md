## ADDED Requirements

### Requirement: Shell 工具支持用户确认机制
系统必须在执行危险命令前要求用户确认。

#### Scenario: 执行危险命令时要求确认
- **WHEN** 用户尝试执行危险命令（如 rm -rf）
- **THEN** 系统应显示确认提示
- **AND** 用户确认后才执行命令
- **AND** 用户拒绝时应拒绝执行

#### Scenario: 支持跳过确认的参数
- **WHEN** 用户使用 --yes/-y 参数
- **THEN** 系统应跳过确认直接执行
- **AND** 应记录跳过确认的日志

#### Scenario: 非交互环境自动拒绝
- **WHEN** 系统检测到非交互环境（如 CI/CD）
- **THEN** 系统应自动拒绝危险命令
- **AND** 应建议使用 --yes 参数