## ADDED Requirements

### Requirement: 配置加载和解析
ConfigManager SHALL 能够加载、解析和验证配置文件。

#### Scenario: 加载配置文件
- **WHEN** 调用 `load()` 方法
- **THEN** 系统从指定路径加载配置文件（JSON5 格式）
- **AND** 加载 `.env` 文件
- **AND** 解析环境变量引用
- **AND** 验证配置（strict 模式）
- **AND** 返回验证后的配置对象

#### Scenario: 加载失败显示错误
- **WHEN** 配置文件加载失败（文件不存在或解析错误）
- **THEN** 系统抛出清晰的错误信息
- **AND** 错误信息包含文件路径和失败原因

#### Scenario: 验证失败显示错误
- **WHEN** 配置验证失败（未知字段或类型不匹配）
- **THEN** 系统抛出清晰的错误信息
- **AND** 错误信息指出验证失败的具体字段

### Requirement: 环境变量解析
ConfigManager SHALL 能够解析配置中的环境变量引用。

#### Scenario: 解析环境变量引用
- **WHEN** 配置文件包含 `${VAR}` 或 `${VAR:default}` 语法
- **THEN** 系统递归遍历配置对象
- **AND** 替换所有匹配的环境变量引用
- **AND** 使用 `.env` 文件和系统环境变量作为数据源

#### Scenario: 环境变量不存在
- **WHEN** 环境变量引用 `${VAR}` 且 `VAR` 不存在
- **THEN** 系统保持原样（不替换）
- **AND** 或抛出错误（取决于严格模式）

#### Scenario: 环境变量存在默认值
- **WHEN** 环境变量引用 `${VAR:default}` 且 `VAR` 不存在
- **THEN** 系统使用 `default` 作为值
- **AND** 替换引用为默认值

### Requirement: 配置合并
ConfigManager SHALL 能够合并全局默认配置和角色特定配置。

#### Scenario: 合并全局和角色配置
- **WHEN** 调用 `getAgentConfig(agentId)` 方法
- **THEN** 系统查找指定角色的配置
- **AND** 使用深度合并策略合并全局默认配置和角色配置
- **AND** 返回合并后的配置对象

#### Scenario: 对象字段深度合并
- **WHEN** 角色配置包含对象字段（如 `agent`、`providers`）
- **THEN** 系统深度合并对象字段
- **AND** 角色配置覆盖全局配置的对应字段
- **AND** 未指定的字段继承全局配置

#### Scenario: 数组字段完全替换
- **WHEN** 角色配置包含数组字段（如 `channels`、`cronTasks`）
- **THEN** 系统完全替换全局数组配置
- **AND** 不执行数组合并

#### Scenario: 角色不存在
- **WHEN** 调用 `getAgentConfig(agentId)` 且 `agentId` 不存在
- **THEN** 系统抛出错误
- **AND** 错误信息指出角色不存在

### Requirement: 角色工作区路径管理
ConfigManager SHALL 能够计算角色的工作区、日志和会话存储路径。

#### Scenario: 获取角色工作区路径
- **WHEN** 调用 `getAgentWorkspaceDir(agentId)` 方法
- **THEN** 系统返回 `~/.niuma/agents/{agentId}/workspace/`
- **AND** 如果目录不存在，系统自动创建

#### Scenario: 获取角色日志路径
- **WHEN** 调用 `getAgentLogPath(agentId)` 方法
- **THEN** 系统返回 `~/.niuma/logs/{agentId}.log`

#### Scenario: 获取角色会话存储路径
- **WHEN** 调用 `getAgentSessionDir(agentId)` 方法
- **THEN** 系统返回 `~/.niuma/sessions/{agentId}/`
- **AND** 如果目录不存在，系统自动创建

### Requirement: 角色列表管理
ConfigManager SHALL 能够列出所有已定义的角色。

#### Scenario: 列出所有角色
- **WHEN** 调用 `listAgents()` 方法
- **THEN** 系统返回所有角色的信息数组
- **AND** 每个角色信息包含 `id`、`name` 和配置摘要

#### Scenario: 空角色列表
- **WHEN** 配置文件的 `agents.list` 为空数组
- **THEN** 系统返回空数组
- **AND** 不抛出错误

#### Scenario: 角色列表包含配置摘要
- **WHEN** 调用 `listAgents()` 方法
- **THEN** 系统返回的每个角色信息包含配置摘要
- **AND** 配置摘要包含 `agent`、`providers`、`channels` 的覆盖情况

### Requirement: 配置缓存
ConfigManager SHALL 能够缓存已加载的配置以提高性能。

#### Scenario: 缓存配置
- **WHEN** 首次调用 `load()` 方法
- **THEN** 系统缓存已加载的配置
- **AND** 后续调用 `load()` 返回缓存的配置

#### Scenario: 强制重新加载
- **WHEN** 调用 `load()` 方法时指定 `force` 选项
- **THEN** 系统重新加载配置文件
- **AND** 更新缓存

## TypeScript Interface Definitions

```typescript
/**
 * 配置管理器
 */
class ConfigManager {
  /**
   * 创建配置管理器实例
   * @param configPath 配置文件路径
   * @param envPath 环境变量文件路径
   */
  constructor(configPath: string, envPath: string)

  /**
   * 加载并解析配置文件
   * @param force 是否强制重新加载
   * @returns 验证后的配置对象
   */
  load(force?: boolean): MultiRoleConfig

  /**
   * 获取角色配置（合并全局默认配置和角色特定配置）
   * @param agentId 角色唯一标识符
   * @returns 合并后的角色配置
   */
  getAgentConfig(agentId: string): NiumaConfig

  /**
   * 获取角色工作区路径
   * @param agentId 角色唯一标识符
   * @returns 工作区绝对路径
   */
  getAgentWorkspaceDir(agentId: string): string

  /**
   * 获取角色日志路径
   * @param agentId 角色唯一标识符
   * @returns 日志文件绝对路径
   */
  getAgentLogPath(agentId: string): string

  /**
   * 获取角色会话存储路径
   * @param agentId 角色唯一标识符
   * @returns 会话存储目录绝对路径
   */
  getAgentSessionDir(agentId: string): string

  /**
   * 列出所有角色
   * @returns 角色信息数组
   */
  listAgents(): AgentInfo[]

  /**
   * 解析环境变量引用
   * @param value 配置值（可以是对象、数组或字符串）
   * @param options 解析选项
   * @returns 解析后的值
   */
  resolveEnvVars(value: unknown, options?: EnvVarResolverOptions): unknown

  /**
   * 合并配置
   * @param globalConfig 全局默认配置
   * @param agentConfig 角色特定配置
   * @returns 合并后的配置
   */
  mergeConfigs(globalConfig: NiumaConfig, agentConfig: Partial<NiumaConfig>): NiumaConfig
}

/**
 * 角色信息
 */
interface AgentInfo {
  /** 角色唯一标识符 */
  id: string
  /** 角色显示名称 */
  name: string
  /** 配置摘要 */
  config: {
    /** Agent 配置是否有覆盖 */
    agent: boolean
    /** 提供商配置是否有覆盖 */
    providers: boolean
    /** 渠道配置是否有覆盖 */
    channels: boolean
    /** 定时任务配置是否有覆盖 */
    cronTasks: boolean
  }
}
```

## Dependencies

- `json5-config-loader`: 依赖 JSON5 配置加载器来加载配置文件
- `config-system`: 依赖配置系统来提供 Schema 和验证逻辑
- `agent-workspace`: 依赖配置管理器来获取工作区路径