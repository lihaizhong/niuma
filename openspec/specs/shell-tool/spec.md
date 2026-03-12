# shell-tool Specification

## Purpose
TBD - created by archiving change builtin-tools-implementation. Update Purpose after archive.
## Requirements
### Requirement: exec 工具执行 Shell 命令

系统 SHALL 提供 exec 工具，能够安全地执行 Shell 命令并返回结果。

#### Scenario: 执行简单命令
- **WHEN** Agent 调用 exec 并提供有效命令
- **THEN** 系统执行命令
- **AND** 返回 stdout、stderr 和退出码

#### Scenario: 执行带参数的命令
- **WHEN** Agent 提供命令和参数数组
- **THEN** 系统正确传递参数
- **AND** 执行命令
- **AND** 返回结果

#### Scenario: 命令执行成功
- **WHEN** 命令成功执行（退出码 0）
- **THEN** 系统返回 stdout
- **AND** stderr 可能为空
- **AND** exitCode 为 0

#### Scenario: 命令执行失败
- **WHEN** 命令执行失败（非零退出码）
- **THEN** 系统返回 stdout 和 stderr
- **AND** exitCode 为非零值
- **AND** 不抛出异常（除非设置了严格模式）

#### Scenario: 命令超时
- **WHEN** 命令执行超过指定超时时间
- **THEN** 系统终止命令进程
- **AND** 返回部分输出
- **AND** 标记为超时

#### Scenario: 后台执行
- **WHEN** Agent 设置 runInBackground 为 true
- **THEN** 系统在后台启动命令
- **AND** 返回进程 ID
- **AND** Agent 可以通过进程 ID 获取输出

### Requirement: 危险命令防护

系统 SHALL 实现危险命令黑名单，防止执行危险操作。

#### Scenario: 检测删除命令
- **WHEN** 命令包含 `rm -rf` 或 `rm -r`
- **THEN** 系统识别为危险命令
- **AND** 要求用户确认
- **AND** 确认后才执行

#### Scenario: 检测系统关机命令
- **WHEN** 命令包含 `shutdown`、`reboot` 或 `poweroff`
- **THEN** 系统识别为危险命令
- **AND** 拒绝执行
- **AND** 返回错误信息

#### Scenario: 检测 Fork Bomb
- **WHEN** 命令包含 fork bomb 模式（`:(){ :|:& };:`）
- **THEN** 系统识别为危险命令
- **AND** 拒绝执行
- **AND** 返回错误信息

#### Scenario: 自定义黑名单
- **WHEN** 配置文件定义了额外的黑名单模式
- **THEN** 系统加载自定义黑名单
- **AND** 同时检查默认和自定义黑名单

#### Scenario: 绕过黑名单
- **WHEN** 命令包含危险模式但不在黑名单中
- **THEN** 系统记录警告到日志
- **AND** 执行命令（不阻止）

### Requirement: 工作目录控制

系统 SHALL 允许控制命令执行的工作目录。

#### Scenario: 指定工作目录
- **WHEN** Agent 提供 cwd 参数
- **THEN** 系统在指定目录执行命令
- **AND** 返回结果

#### Scenario: 默认工作目录
- **WHEN** Agent 未提供 cwd 参数
- **THEN** 系统使用 Agent 工作目录
- **AND** 执行命令

#### Scenario: 工作目录不存在
- **WHEN** 指定的工作目录不存在
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息说明目录不存在

### Requirement: 环境变量控制

系统 SHALL 允许为命令设置自定义环境变量。

#### Scenario: 使用默认环境变量
- **WHEN** Agent 未提供环境变量
- **THEN** 系统继承进程环境变量
- **AND** 执行命令

#### Scenario: 设置自定义环境变量
- **WHEN** Agent 提供 env 参数
- **THEN** 系统合并自定义和默认环境变量
- **AND** 执行命令

#### Scenario: 覆盖环境变量
- **WHEN** 自定义环境变量与默认同名
- **THEN** 自定义值覆盖默认值
- **AND** 执行命令

### Requirement: 命令日志记录

系统 SHALL 记录所有执行的命令到日志。

#### Scenario: 记录命令
- **WHEN** 执行任何命令
- **THEN** 系统记录命令内容
- **AND** 记录执行时间
- **AND** 记录退出码
- **AND** 记录执行用户（Agent ID）

#### Scenario: 记录危险命令
- **WHEN** 执行危险命令（即使已确认）
- **THEN** 系统标记为危险操作
- **AND** 记录确认信息
- **AND** 发送告警通知

#### Scenario: 记录失败命令
- **WHEN** 命令执行失败
- **THEN** 系统记录错误信息
- **AND** 记录 stderr 输出
- **AND** 便于调试

