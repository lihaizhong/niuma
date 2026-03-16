# heartbeat-service Specification

## Purpose
TBD - created by archiving change phase-6-heartbeat-service. Update Purpose after archive.
## Requirements
### Requirement: 心跳服务启动和停止
系统必须提供心跳服务，支持启动和停止操作。心跳服务启动后应按照配置的间隔定期检查 HEARTBEAT.md 并执行任务。

#### Scenario: 成功启动心跳服务
- **WHEN** Agent 初始化完成且配置中心跳服务已启用（`heartbeat.enabled: true`）
- **THEN** 心跳服务应启动并开始运行
- **AND** 应记录启动日志
- **AND** 应返回启动成功状态

#### Scenario: 成功停止心跳服务
- **WHEN** Agent 关闭或显式调用停止方法
- **THEN** 心跳服务应停止运行
- **AND** 应取消所有已调度的任务
- **AND** 应记录停止日志

#### Scenario: 配置禁用时不启动心跳服务
- **WHEN** 配置中心跳服务未启用（`heartbeat.enabled: false`）
- **THEN** 心跳服务不应启动
- **AND** Agent 应正常运行但不执行心跳任务

---

### Requirement: HEARTBEAT.md 文件解析
系统必须能够解析位于 Agent 工作区根目录的 HEARTBEAT.md 文件，提取任务列表和配置信息。

#### Scenario: 成功解析有效的 HEARTBEAT.md
- **WHEN** HEARTBEAT.md 文件存在且格式正确
- **THEN** 系统应解析出 YAML Frontmatter（包括 interval、enabled 等配置）
- **AND** 系统应解析出 Markdown 任务列表
- **AND** 应返回有效的任务配置对象

#### Scenario: HEARTBEAT.md 文件不存在
- **WHEN** HEARTBEAT.md 文件不存在于工作区根目录
- **THEN** 系统应记录警告日志
- **AND** 心跳服务应继续运行但不执行任务

#### Scenario: HEARTBEAT.md 格式错误
- **WHEN** HEARTBEAT.md 文件格式错误（如 YAML Frontmatter 无效）
- **THEN** 系统应记录错误日志，包含详细的错误信息
- **AND** 心跳服务应继续运行但不执行任务
- **AND** 应在日志中提示正确的格式示例

---

### Requirement: 周期性检查调度
系统必须使用 node-cron 库按照 HEARTBEAT.md 中配置的 interval（Cron 表达式）周期性检查任务。

#### Scenario: 按照配置的间隔执行检查
- **WHEN** HEARTBEAT.md 中配置了有效的 Cron 表达式（如 `"0 */30 * * * *"` 表示每 30 分钟）
- **THEN** 系统应按照该间隔定期执行心跳检查
- **AND** 应记录每次执行的日志

#### Scenario: 动态更新检查间隔
- **WHEN** HEARTBEAT.md 文件被修改且 interval 字段发生变化
- **THEN** 系统应在下一次心跳检查时重新加载配置
- **AND** 应按照新的间隔执行后续检查
- **AND** 应记录配置更新日志

#### Scenario: 无效的 Cron 表达式
- **WHEN** HEARTBEAT.md 中的 interval 字段包含无效的 Cron 表达式
- **THEN** 系统应记录错误日志
- **AND** 心跳服务应使用默认间隔（30 分钟）
- **AND** 应在日志中提示使用有效的 Cron 表达式

---

### Requirement: 任务执行
系统必须执行 HEARTBEAT.md 中定义的任务列表。任务应串行执行，避免资源竞争。

#### Scenario: 成功执行单个任务
- **WHEN** HEARTBEAT.md 中包含一个有效的任务
- **THEN** 系统应执行该任务
- **AND** 应记录任务执行日志
- **AND** 应收集任务执行结果

#### Scenario: 成功执行多个任务（串行）
- **WHEN** HEARTBEAT.md 中包含多个有效的任务
- **THEN** 系统应按照任务列表顺序串行执行任务
- **AND** 每个任务执行完成后才开始下一个任务
- **AND** 应记录每个任务的执行日志

#### Scenario: 任务执行失败时继续执行
- **WHEN** 某个任务执行过程中抛出异常
- **THEN** 系统应捕获异常并记录错误日志
- **AND** 心跳服务应继续执行下一个任务
- **AND** 不应中断整个心跳周期

#### Scenario: 任务执行超时
- **WHEN** 任务执行时间超过配置的超时时间（默认 5 分钟）
- **THEN** 系统应终止任务执行
- **AND** 应记录超时错误日志
- **AND** 应继续执行下一个任务

---

### Requirement: 心跳结果发送
系统必须通过最近活跃的渠道发送心跳执行结果，包括成功和失败的任务统计。

#### Scenario: 成功发送心跳结果到活跃渠道
- **WHEN** 心跳任务执行完成且存在最近活跃的渠道
- **THEN** 系统应格式化执行结果为 Markdown 消息
- **AND** 系统应通过该渠道发送消息
- **AND** 应记录消息发送日志

#### Scenario: 渠道离线时记录错误
- **WHEN** 最近活跃的渠道离线或消息发送失败
- **THEN** 系统应记录错误日志
- **AND** 不应阻塞心跳服务的正常运行
- **AND** 应考虑回退到备用渠道（如 CLI）

#### Scenario: 无活跃渠道时使用默认渠道
- **WHEN** 会话管理器中没有最近活跃的渠道记录
- **THEN** 系统应使用 CLI 渠道作为默认渠道
- **AND** 应在 CLI 中输出心跳结果
- **AND** 应记录使用默认渠道的日志

---

### Requirement: 配置管理
系统必须支持通过配置文件管理心跳服务的行为，包括启用/禁用、检查间隔、文件路径等。

#### Scenario: 通过配置启用心跳服务
- **WHEN** 配置文件中设置 `heartbeat.enabled: true`
- **THEN** Agent 启动时应自动启动心跳服务
- **AND** 应使用配置中的其他参数（如 interval、filePath）

#### Scenario: 通过配置禁用心跳服务
- **WHEN** 配置文件中设置 `heartbeat.enabled: false`
- **THEN** Agent 启动时不应启动心跳服务
- **AND** 心跳相关功能应完全禁用

#### Scenario: 自定义 HEARTBEAT.md 路径
- **WHEN** 配置文件中设置了 `heartbeat.filePath`
- **THEN** 系统应从指定路径加载 HEARTBEAT.md 文件
- **AND** 应支持相对路径和绝对路径

#### Scenario: 配置任务执行超时
- **WHEN** 配置文件中设置了 `heartbeat.taskTimeout`
- **THEN** 系统应使用该值作为任务执行超时时间
- **AND** 默认超时时间应为 5 分钟

---

### Requirement: 错误处理和容错
系统必须具备完善的错误处理机制，确保单个任务的失败不会影响整个心跳服务的运行。

#### Scenario: HEARTBEAT.md 解析失败
- **WHEN** HEARTBEAT.md 文件解析失败
- **THEN** 系统应记录详细的错误信息
- **AND** 心跳服务应继续运行
- **AND** 下一次心跳检查时重新尝试解析

#### Scenario: 任务执行异常
- **WHEN** 任务执行过程中抛出未捕获的异常
- **THEN** 系统应捕获异常并记录堆栈信息
- **AND** 应将任务标记为失败
- **AND** 应继续执行下一个任务

#### Scenario: 消息发送失败
- **WHEN** 发送心跳结果消息到渠道失败
- **THEN** 系统应记录发送失败日志
- **AND** 不应影响心跳服务的正常运行
- **AND** 下一次心跳检查时重新尝试发送

#### Scenario: Cron 调度器异常
- **WHEN** node-cron 调度器抛出异常
- **THEN** 系统应捕获异常并记录日志
- **AND** 应尝试重新初始化调度器
- **AND** 必要时应重启心跳服务

---

### Requirement: 日志记录
系统必须记录心跳服务的所有关键事件和操作，便于问题排查和监控。

#### Scenario: 记录心跳服务启动
- **WHEN** 心跳服务启动
- **THEN** 应记录启动日志，包含启动时间、配置信息

#### Scenario: 记录心跳检查执行
- **WHEN** 每次心跳检查执行
- **THEN** 应记录执行日志，包含执行时间、HEARTBEAT.md 文件路径

#### Scenario: 记录任务执行结果
- **WHEN** 每个任务执行完成
- **THEN** 应记录任务执行日志，包含任务名称、执行状态、执行时长

#### Scenario: 记录心跳服务停止
- **WHEN** 心跳服务停止
- **THEN** 应记录停止日志，包含停止时间、已执行的心跳次数

#### Scenario: 记录错误和异常
- **WHEN** 任何错误或异常发生
- **THEN** 应记录详细的错误日志，包含错误类型、错误消息、堆栈信息

---

### Requirement: 心跳结果格式
系统必须以结构化的 Markdown 格式发送心跳结果，包含任务执行统计和详细信息。

#### Scenario: 格式化成功的心跳结果
- **WHEN** 所有任务都成功执行
- **THEN** 结果消息应包含：
  - 执行时间戳
  - 成功任务数量
  - 每个任务的执行结果（任务名称、状态、输出）

#### Scenario: 格式化部分失败的心跳结果
- **WHEN** 部分任务执行失败
- **THEN** 结果消息应包含：
  - 执行时间戳
  - 成功任务数量
  - 失败任务数量
  - 每个任务的执行结果（任务名称、状态、输出或错误信息）

#### Scenario: 格式化完全失败的心跳结果
- **WHEN** 所有任务都执行失败
- **THEN** 结果消息应包含：
  - 执行时间戳
  - 失败任务数量
  - 每个任务的错误信息
  - 建议排查步骤

---

### Requirement: 心跳服务生命周期管理
心跳服务必须与 Agent 生命周期紧密绑定，确保在 Agent 启动时自动启动，在 Agent 关闭时自动停止。

#### Scenario: Agent 启动时自动启动心跳服务
- **WHEN** Agent 初始化完成
- **AND** 配置中心跳服务已启用
- **THEN** 应自动启动心跳服务
- **AND** 应将心跳服务实例存储在 Agent 实例中

#### Scenario: Agent 关闭时自动停止心跳服务
- **WHEN** Agent 调用 shutdown 方法
- **AND** 心跳服务正在运行
- **THEN** 应自动停止心跳服务
- **AND** 应等待所有正在执行的任务完成（超时时间可配置）

#### Scenario: 心跳服务异常时不应影响 Agent 关闭
- **WHEN** 心跳服务停止过程中发生异常
- **THEN** 应记录错误日志
- **AND** Agent 关闭流程应继续执行
- **AND** 不应阻塞 Agent 的正常关闭

---

