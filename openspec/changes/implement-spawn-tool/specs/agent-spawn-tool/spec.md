## ADDED Requirements

### Requirement: spawn 工具创建后台任务

系统 SHALL 提供 spawn 工具，允许 LLM 创建后台子智能体任务。

#### Scenario: 创建后台任务
- **WHEN** LLM 调用 spawn 工具并提供任务描述
- **THEN** 系统创建后台子智能体任务
- **AND** 返回任务 ID
- **AND** 任务在后台独立执行

#### Scenario: 提供任务标签
- **WHEN** LLM 调用 spawn 工具并提供任务描述和标签
- **THEN** 系统使用标签作为任务显示名称
- **AND** 在结果通知中显示标签

#### Scenario: 并发限制
- **WHEN** 已达到最大并发任务数 (5个)
- **THEN** 系统拒绝创建新任务
- **AND** 返回错误信息

#### Scenario: 缺少必填参数
- **WHEN** LLM 调用 spawn 工具但未提供 task 参数
- **THEN** 系统返回验证错误
- **AND** 不创建任务

### Requirement: spawn 工具参数定义

系统 SHALL 定义 spawn 工具的参数结构。

#### Scenario: 必填参数 task
- **WHEN** LLM 提供任务描述
- **THEN** 任务描述作为子智能体的初始指令
- **AND** 描述应清晰明确

#### Scenario: 可选参数 label
- **WHEN** LLM 提供任务标签
- **THEN** 标签用于任务显示和结果通知
- **AND** 如果未提供，使用默认标签 "后台任务"

### Requirement: spawn 工具返回结果

系统 SHALL 返回创建结果。

#### Scenario: 成功创建
- **WHEN** 任务创建成功
- **THEN** 返回任务 ID
- **AND** 提示任务完成后将通过系统消息通知

#### Scenario: 创建失败
- **WHEN** 任务创建失败（并发限制等）
- **THEN** 返回错误信息
- **AND** 说明失败原因

### Requirement: spawn 工具上下文依赖

系统 SHALL 通过全局上下文获取 SubagentManager。

#### Scenario: SubagentManager 可用
- **WHEN** 全局上下文中设置了 SubagentManager
- **THEN** spawn 工具可以获取并使用它

#### Scenario: SubagentManager 不可用
- **WHEN** 全局上下文中未设置 SubagentManager
- **THEN** spawn 工具返回错误
- **AND** 提示 SubagentManager 未初始化
