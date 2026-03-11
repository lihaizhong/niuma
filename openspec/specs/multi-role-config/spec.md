## ADDED Requirements

### Requirement: 多角色配置系统整体功能
系统 SHALL 提供完整的企业级多角色配置功能，包括多角色配置、独立工作区、环境变量引用和严格验证。

#### Scenario: 完整的多角色配置流程
- **WHEN** 用户创建包含多个角色的配置文件
- **AND** 配置文件使用 JSON5 格式
- **AND** 配置文件包含环境变量引用
- **AND** 配置文件包含角色配置覆盖
- **THEN** 系统成功加载并验证配置
- **AND** 系统为每个角色创建独立的工作区
- **AND** 系统支持通过 CLI 选择和切换角色

#### Scenario: 角色完全隔离运行
- **WHEN** 多个角色同时运行
- **THEN** 每个角色使用独立的工作区
- **AND** 每个角色的会话、记忆、日志完全隔离
- **AND** 角色之间无数据污染

#### Scenario: 配置验证和错误处理
- **WHEN** 配置文件包含错误（未知字段、类型不匹配等）
- **THEN** 系统拒绝启动
- **AND** 系统显示清晰的错误信息
- **AND** 错误信息指出具体的错误位置和原因

### Requirement: 向后兼容性
系统 SHALL 保持向后兼容，支持现有的单一配置模式。

#### Scenario: 旧版本配置文件兼容
- **WHEN** 用户使用旧版本的 JSON 配置文件（不含 `agents.list`）
- **THEN** 系统成功加载配置
- **AND** 系统使用默认角色（`default`）
- **AND** 不影响现有功能

#### Scenario: 新旧配置共存
- **WHEN** 用户同时使用 JSON 和 JSON5 格式的配置文件
- **THEN** 系统支持两种格式
- **AND** 优先使用 JSON5 格式（如果存在）

### Requirement: 环境变量集成
系统 SHALL 无缝集成环境变量，支持 `.env` 文件和系统环境变量。

#### Scenario: 从 .env 文件加载环境变量
- **WHEN** 系统启动时发现 `.env` 文件
- **THEN** 系统从 `.env` 文件加载环境变量
- **AND** 环境变量用于替换配置文件中的引用

#### Scenario: 系统环境变量优先级
- **WHEN** 环境变量在 `.env` 文件和系统环境中都存在
- **THEN** `.env` 文件的值优先
- **AND** 系统环境变量作为后备

#### Scenario: 环境变量安全处理
- **WHEN** 环境变量包含敏感信息（如 API 密钥）
- **THEN** 系统正确处理敏感信息
- **AND** 不在日志中输出敏感信息

### Requirement: 配置验证严格性
系统 SHALL 使用严格模式验证配置，拒绝未知字段。

#### Scenario: 严格模式验证
- **WHEN** 配置文件包含未知字段
- **THEN** 系统拒绝启动
- **AND** 系统显示错误信息，指出未知字段名称

#### Scenario: 类型安全验证
- **WHEN** 配置文件的字段类型与 Schema 不匹配
- **THEN** 系统拒绝启动
- **AND** 系统显示错误信息，指出字段名称和期望类型

#### Scenario: 必填字段验证
- **WHEN** 配置文件缺少必填字段
- **THEN** 系统拒绝启动
- **AND** 系统显示错误信息，指出缺失的字段名称

### Requirement: 配置合并策略
系统 SHALL 使用明确的配置合并策略，确保配置覆盖行为可预测。

#### Scenario: 对象字段深度合并
- **WHEN** 角色配置包含对象字段
- **THEN** 系统深度合并对象字段
- **AND** 角色配置覆盖全局配置的对应字段
- **AND** 未指定的字段继承全局配置

#### Scenario: 数组字段完全替换
- **WHEN** 角色配置包含数组字段
- **THEN** 系统完全替换全局数组配置
- **AND** 不执行数组合并

#### Scenario: 合并策略一致性
- **WHEN** 多个角色使用相同的合并策略
- **THEN** 系统确保合并行为一致
- **AND** 不出现意外的配置覆盖

### Requirement: CLI 用户体验
系统 SHALL 提供良好的 CLI 用户体验，包括清晰的错误信息和帮助文档。

#### Scenario: 友好的错误信息
- **WHEN** 用户输入错误的命令或参数
- **THEN** 系统显示友好的错误信息
- **AND** 错误信息包含问题原因和解决建议

#### Scenario: 完整的帮助文档
- **WHEN** 用户执行 `--help` 命令
- **THEN** 系统显示完整的帮助文档
- **AND** 帮助文档包含所有可用命令和参数

#### Scenario: 交互式提示
- **WHEN** 用户未指定角色且需要选择
- **THEN** 系统显示角色列表供用户选择
- **AND** 系统支持默认选择

## TypeScript Interface Definitions

```typescript
/**
 * 多角色配置系统接口
 */
interface MultiRoleConfigSystem {
  /**
   * 初始化配置系统
   * @param configPath 配置文件路径
   * @param envPath 环境变量文件路径
   */
  initialize(configPath: string, envPath: string): Promise<void>

  /**
   * 加载配置
   * @param agentId 角色唯一标识符（可选，默认使用第一个角色）
   * @returns 角色配置
   */
  loadAgentConfig(agentId?: string): Promise<NiumaConfig>

  /**
   * 获取角色列表
   * @returns 角色信息数组
   */
  listAgents(): Promise<AgentInfo[]>

  /**
   * 获取角色详情
   * @param agentId 角色唯一标识符
   * @returns 角色详细信息
   */
  getAgent(agentId: string): Promise<AgentDetailOutput>

  /**
   * 验证配置
   * @param config 配置对象
   * @returns 验证结果
   */
  validateConfig(config: unknown): { valid: boolean; errors?: string[] }

  /**
   * 清理资源
   */
  cleanup(): Promise<void>
}

/**
 * 多角色配置系统选项
 */
interface MultiRoleConfigOptions {
  /** 配置文件路径 */
  configPath?: string
  /** 环境变量文件路径 */
  envPath?: string
  /** 是否严格模式 */
  strict?: boolean
  /** 是否启用缓存 */
  cache?: boolean
}
```

## Dependencies

- `json5-config-loader`: 依赖 JSON5 配置加载器来加载配置文件
- `config-system`: 依赖配置系统来提供 Schema 和验证逻辑
- `config-manager`: 依赖配置管理器来管理配置
- `agent-workspace`: 依赖工作区管理器来管理工作区
- `agent-cli-commands`: 依赖 CLI 命令来提供用户界面

## Integration Scenarios

### Scenario: 首次启动多角色配置
- **WHEN** 用户首次使用多角色配置系统
- **AND** 用户创建了 `~/.niuma/niuma.json` 配置文件
- **AND** 配置文件包含多个角色定义
- **THEN** 系统自动创建所有角色的工作区目录
- **AND** 系统自动创建所有角色的会话存储目录
- **AND** 系统自动创建所有角色的日志文件
- **AND** 系统显示成功信息，说明配置已加载

### Scenario: 切换角色运行
- **WHEN** 用户使用 `niuma chat --agent developer` 启动开发者角色
- **AND** 然后使用 `niuma chat --agent manager` 启动项目经理角色
- **THEN** 两个角色使用独立的工作区
- **AND** 两个角色的会话互不干扰
- **AND** 两个角色的日志分别写入不同的文件

### Scenario: 环境变量动态更新
- **WHEN** 用户修改 `.env` 文件
- **AND** 系统重启后重新加载配置
- **THEN** 系统使用新的环境变量值
- **AND** 配置文件中的环境变量引用被正确替换

### Scenario: 配置错误恢复
- **WHEN** 用户修改配置文件后引入错误
- **AND** 系统启动时验证失败
- **THEN** 系统显示清晰的错误信息
- **AND** 系统指出具体的错误位置
- **AND** 用户修复配置后系统正常启动