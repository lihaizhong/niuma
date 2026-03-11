## ADDED Requirements

### Requirement: CLI 支持 --agent 参数
系统 SHALL 支持 `--agent` 参数来选择运行的角色。

#### Scenario: 使用 --agent 参数启动角色
- **WHEN** 用户执行 `niuma chat --agent developer "message"`
- **THEN** 系统加载 `developer` 角色的配置
- **AND** 系统使用 `developer` 角色的工作区
- **AND** 系统将日志写入 `developer.log` 文件
- **AND** 系统处理用户消息

#### Scenario: 未指定 --agent 参数使用默认角色
- **WHEN** 用户执行 `niuma chat "message"` 且未指定 `--agent` 参数
- **THEN** 系统使用第一个角色或 `default` 角色
- **AND** 系统显示提示信息，说明使用的角色

#### Scenario: 指定的角色不存在
- **WHEN** 用户执行 `niuma chat --agent nonexistent "message"` 且角色不存在
- **THEN** 系统显示错误信息
- **AND** 错误信息指出角色不存在
- **AND** 系统列出所有可用的角色

#### Scenario: --agent 参数格式验证
- **WHEN** 用户执行 `niuma chat --agent "" "message"` 且角色 ID 为空
- **THEN** 系统显示错误信息
- **AND** 错误信息指出角色 ID 不能为空

### Requirement: agents list 命令
系统 SHALL 提供 `niuma agents list` 命令来列出所有已定义的角色。

#### Scenario: 列出所有角色
- **WHEN** 用户执行 `niuma agents list`
- **THEN** 系统显示所有角色的列表
- **AND** 每个角色显示 `id`、`name` 和配置摘要

#### Scenario: 列表显示格式化输出
- **WHEN** 用户执行 `niuma agents list`
- **THEN** 系统以表格形式输出角色列表
- **AND** 表格包含 `ID`、`Name`、`Progress Mode`、`Model` 等列
- **AND** 输出格式美观，易于阅读

#### Scenario: 空角色列表
- **WHEN** 用户执行 `niuma agents list` 且没有定义角色
- **THEN** 系统显示提示信息
- **AND** 提示信息指出没有定义角色

#### Scenario: JSON 格式输出
- **WHEN** 用户执行 `niuma agents list --json`
- **THEN** 系统以 JSON 格式输出角色列表
- **AND** JSON 格式易于程序解析

### Requirement: agents get 命令
系统 SHALL 提供 `niuma agents get --id <id>` 命令来获取指定角色的详细信息。

#### Scenario: 获取角色详情
- **WHEN** 用户执行 `niuma agents get --id developer`
- **THEN** 系统显示 `developer` 角色的详细信息
- **AND** 详细信息包含所有配置项

#### Scenario: 角色不存在
- **WHEN** 用户执行 `niuma agents get --id nonexistent` 且角色不存在
- **THEN** 系统显示错误信息
- **AND** 错误信息指出角色不存在
- **AND** 系统列出所有可用的角色

#### Scenario: 未指定 --id 参数
- **WHEN** 用户执行 `niuma agents get` 且未指定 `--id` 参数
- **THEN** 系统显示错误信息
- **AND** 错误信息指出需要指定 `--id` 参数
- **AND** 系统显示命令帮助信息

#### Scenario: JSON 格式输出
- **WHEN** 用户执行 `niuma agents get --id developer --json`
- **THEN** 系统以 JSON 格式输出角色详细信息
- **AND** JSON 格式易于程序解析

### Requirement: agents 命令帮助信息
系统 SHALL 为 agents 命令提供清晰的帮助信息。

#### Scenario: 显示 agents 命令帮助
- **WHEN** 用户执行 `niuma agents --help`
- **THEN** 系统显示 agents 命令的帮助信息
- **AND** 帮助信息包含所有可用的子命令
- **AND** 帮助信息包含每个子命令的描述和用法

#### Scenario: 显示 list 子命令帮助
- **WHEN** 用户执行 `niuma agents list --help`
- **THEN** 系统显示 list 子命令的帮助信息
- **AND** 帮助信息包含命令描述和可选参数

#### Scenario: 显示 get 子命令帮助
- **WHEN** 用户执行 `niuma agents get --help`
- **THEN** 系统显示 get 子命令的帮助信息
- **AND** 帮助信息包含命令描述和必需参数

### Requirement: 命令错误处理
系统 SHALL 为所有 agents 命令提供清晰的错误处理。

#### Scenario: 配置文件不存在
- **WHEN** 用户执行 `niuma agents list` 且配置文件不存在
- **THEN** 系统显示错误信息
- **AND** 错误信息指出配置文件不存在
- **AND** 系统提示用户创建配置文件

#### Scenario: 配置文件格式错误
- **WHEN** 用户执行 `niuma agents list` 且配置文件格式错误
- **THEN** 系统显示错误信息
- **AND** 错误信息指出配置文件格式错误
- **AND** 错误信息包含具体的错误位置

#### Scenario: 角色配置验证失败
- **WHEN** 用户执行 `niuma agents list` 且角色配置验证失败
- **THEN** 系统显示错误信息
- **AND** 错误信息指出角色配置验证失败
- **AND** 错误信息包含具体的验证错误

## TypeScript Interface Definitions

```typescript
/**
 * CLI 命令选项
 */
interface AgentCLIOptions {
  /** 角色唯一标识符 */
  agent?: string
  /** JSON 格式输出 */
  json?: boolean
  /** 详细输出 */
  verbose?: boolean
}

/**
 * 角色列表输出（表格格式）
 */
interface AgentListOutput {
  /** 角色列表 */
  agents: Array<{
    id: string
    name: string
    progressMode: string
    model?: string
    channels: number
    cronTasks: number
  }>
  /** 角色总数 */
  total: number
}

/**
 * 角色详情输出
 */
interface AgentDetailOutput {
  /** 角色唯一标识符 */
  id: string
  /** 角色显示名称 */
  name: string
  /** 工作区路径 */
  workspace: string
  /** 日志文件路径 */
  logFile: string
  /** 会话存储路径 */
  sessionDir: string
  /** Agent 配置 */
  agent: AgentConfig
  /** 提供商配置 */
  providers: Record<string, ProviderConfig>
  /** 渠道配置 */
  channels: ChannelConfig[]
  /** 定时任务配置 */
  cronTasks: CronTaskConfig[]
}

/**
 * CLI 命令处理器
 */
interface AgentCommandHandlers {
  /**
   * 列出所有角色
   * @param options 命令选项
   */
  list(options: AgentCLIOptions): Promise<void>

  /**
   * 获取角色详情
   * @param agentId 角色唯一标识符
   * @param options 命令选项
   */
  get(agentId: string, options: AgentCLIOptions): Promise<void>

  /**
   * 显示帮助信息
   * @param command 命令名称（可选）
   */
  help(command?: string): void
}
```

## Dependencies

- `config-manager`: 依赖配置管理器来获取角色信息
- `agent-workspace`: 依赖工作区管理器来获取路径信息
- `config-system`: 依赖配置系统来验证角色配置