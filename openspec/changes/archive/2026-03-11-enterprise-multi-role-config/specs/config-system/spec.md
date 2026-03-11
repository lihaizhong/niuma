## ADDED Requirements

### Requirement: 多角色配置结构
系统 SHALL 支持定义多个角色配置，每个角色有独立的配置和工作区。

#### Scenario: 配置文件包含多个角色
- **WHEN** 配置文件的 `agents.list` 数组包含多个角色定义
- **THEN** 系统解析并创建多个角色配置
- **AND** 每个角色配置包含 `id`、`name` 和可选的配置覆盖

#### Scenario: 角色配置包含唯一 ID
- **WHEN** 配置文件的 `agents.list` 定义角色
- **THEN** 每个角色必须包含唯一的 `id` 字段
- **AND** 如果 ID 重复，系统拒绝启动并显示错误

#### Scenario: 角色配置包含名称
- **WHEN** 配置文件的 `agents.list` 定义角色
- **THEN** 每个角色应该包含 `name` 字段
- **AND** 如果未提供，使用 `id` 作为名称

#### Scenario: 角色配置覆盖全局配置
- **WHEN** 角色配置包含与全局配置相同的字段
- **THEN** 系统使用深度合并策略
- **AND** 角色配置覆盖全局默认配置
- **AND** 未指定的字段继承全局默认值

#### Scenario: 数组字段完全替换
- **WHEN** 角色配置包含数组字段（如 `channels`、`cronTasks`）
- **THEN** 系统完全替换全局数组配置
- **AND** 不执行数组合并

### Requirement: 环境变量引用
系统 SHALL 支持在配置文件中引用环境变量，使用 `${VAR}` 和 `${VAR:default}` 语法。

#### Scenario: 环境变量引用语法
- **WHEN** 配置文件包含 `${VAR}` 语法
- **THEN** 系统从环境变量或 `.env` 文件中读取 `VAR` 的值
- **AND** 替换配置文件中的 `${VAR}` 为实际值

#### Scenario: 环境变量引用带默认值
- **WHEN** 配置文件包含 `${VAR:default}` 语法
- **THEN** 系统从环境变量或 `.env` 文件中读取 `VAR` 的值
- **AND** 如果 `VAR` 不存在，使用 `default` 作为值
- **AND** 替换配置文件中的 `${VAR:default}` 为实际值或默认值

#### Scenario: 环境变量不存在且无默认值
- **WHEN** 配置文件包含 `${VAR}` 语法且 `VAR` 不存在
- **THEN** 系统保持原样（不替换）
- **AND** 或抛出错误（取决于严格模式）

#### Scenario: 嵌套对象中的环境变量
- **WHEN** 配置文件的嵌套对象包含环境变量引用
- **THEN** 系统递归处理所有字符串字段
- **AND** 替换所有匹配的环境变量引用

#### Scenario: 数组中的环境变量
- **WHEN** 配置文件的数组元素包含环境变量引用
- **THEN** 系统处理数组中每个字符串元素
- **AND** 替换所有匹配的环境变量引用

#### Scenario: 从 .env 文件加载环境变量
- **WHEN** 系统加载配置文件时发现 `.env` 文件
- **THEN** 系统从 `.env` 文件读取环境变量
- **AND** `.env` 文件中的变量优先于系统环境变量

### Requirement: 严格配置验证
系统 SHALL 使用 Zod 的 strict 模式进行配置验证，拒绝未知字段。

#### Scenario: 配置包含已知字段
- **WHEN** 配置文件仅包含 Schema 中定义的字段
- **THEN** 系统成功验证配置
- **AND** 返回类型安全的配置对象

#### Scenario: 配置包含未知字段
- **WHEN** 配置文件包含 Schema 中未定义的字段
- **THEN** 系统拒绝启动
- **AND** 显示清晰的错误信息，指出未知字段名称

#### Scenario: 配置字段类型不匹配
- **WHEN** 配置文件的字段类型与 Schema 定义不匹配
- **THEN** 系统拒绝启动
- **AND** 显示清晰的错误信息，指出字段名称和期望类型

#### Scenario: 必填字段缺失
- **WHEN** 配置文件缺少 Schema 中定义的必填字段
- **THEN** 系统拒绝启动
- **AND** 显示清晰的错误信息，指出缺失的字段名称

#### Scenario: 字段值超出范围
- **WHEN** 配置文件的数值字段超出 Schema 定义的范围
- **THEN** 系统拒绝启动
- **AND** 显示清晰的错误信息，指出字段名称和有效范围

### Requirement: 配置 Schema 扩展
系统 SHALL 扩展现有的配置 Schema 以支持多角色架构。

#### Scenario: 扩展 NiumaConfigSchema
- **WHEN** 系统加载配置文件
- **THEN** `NiumaConfigSchema` 包含 `agents` 字段
- **AND** `agents` 字段包含 `list` 数组
- **AND** `list` 数组元素为 `AgentDefinition` 类型

#### Scenario: AgentDefinition Schema
- **WHEN** 系统验证角色定义
- **THEN** `AgentDefinition` Schema 包含 `id`（必填）和 `name`（可选）字段
- **AND** 包含可选的 `agent`、`providers`、`channels`、`cronTasks` 配置覆盖
- **AND** 这些配置覆盖字段与全局配置字段类型一致

## TypeScript Interface Definitions

```typescript
/**
 * 角色定义
 */
interface AgentDefinition {
  /** 角色唯一标识符 */
  id: string
  /** 角色显示名称（可选，默认使用 id） */
  name?: string
  /** Agent 配置覆盖 */
  agent?: Partial<AgentConfig>
  /** 提供商配置覆盖 */
  providers?: Record<string, Partial<ProviderConfig>>
  /** 渠道配置覆盖（完全替换） */
  channels?: ChannelConfig[]
  /** 定时任务配置覆盖（完全替换） */
  cronTasks?: CronTaskConfig[]
}

/**
 * 多角色配置
 */
interface MultiRoleConfig {
  /** 工作目录 */
  workspaceDir: string
  /** 最大 Agent 迭代次数 */
  maxIterations: number
  /** Agent 默认配置 */
  agent: AgentConfig
  /** LLM 提供商默认配置 */
  providers: Record<string, ProviderConfig>
  /** 渠道默认配置 */
  channels: ChannelConfig[]
  /** 定时任务默认配置 */
  cronTasks: CronTaskConfig[]
  /** 调试模式 */
  debug: boolean
  /** 日志级别 */
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  /** 角色列表 */
  agents: {
    list: AgentDefinition[]
  }
}

/**
 * 环境变量解析选项
 */
interface EnvVarResolverOptions {
  /** 是否严格模式（未知环境变量报错） */
  strict?: boolean
  /** 环境变量来源（.env 文件和系统环境变量） */
  env: Record<string, string>
}
```

## Dependencies

- `json5-config-loader`: 依赖 JSON5 配置加载器来加载配置文件
- `config-manager`: 依赖配置系统来提供验证和合并逻辑
- `agent-workspace`: 依赖配置系统来获取角色工作区路径