## ADDED Requirements

### Requirement: Cron 任务支持精确的下次执行时间计算
系统必须能够准确计算 Cron 表达式的下次执行时间。

#### Scenario: 创建任务时计算下次执行时间
- **WHEN** 用户创建 Cron 任务
- **THEN** 系统应根据 Cron 表达式计算下次执行时间
- **AND** 应在任务信息中显示下次执行时间

#### Scenario: 更新任务时重新计算下次执行时间
- **WHEN** 用户更新任务的 Cron 表达式
- **THEN** 系统应重新计算下次执行时间
- **AND** 应更新任务信息

#### Scenario: 支持标准 Cron 表达式
- **WHEN** 用户使用标准 Cron 表达式（6 段）
- **THEN** 系统应正确解析并计算执行时间
- **AND** 应支持秒、分、时、日、月、周等字段