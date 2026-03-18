# Agent Workspace Specification

## Purpose

定义 Agent Workspace 的功能规格和行为约束。

## Requirements

### Requirement: 角色工作区隔离
系统 SHALL 为每个角色创建独立的工作区，确保会话、记忆和日志完全隔离。

#### Scenario: 创建角色工作区目录
- **WHEN** 系统首次启动角色时
- **THEN** 系统在 `~/.niuma/agents/{agentId}/workspace/` 创建工作区目录
- **AND** 如果目录已存在，不报错

#### Scenario: 角色工作区包含必需文件
- **WHEN** 系统创建角色工作区
- **THEN** 工作区目录包含 `MEMORY.md` 文件
- **AND** 工作区目录包含 `HISTORY.md` 文件
- **AND** 如果文件已存在，不覆盖

#### Scenario: 不同角色的工作区完全隔离
- **WHEN** 多个角色同时运行
- **THEN** 每个角色使用独立的工作区目录
- **AND** 角色之间的工作区互不干扰
- **AND** 角色无法访问其他角色的工作区

### Requirement: 会话存储隔离
系统 SHALL 为每个角色创建独立的会话存储目录。

#### Scenario: 创建角色会话存储目录
- **WHEN** 系统首次启动角色时
- **THEN** 系统在 `~/.niuma/sessions/{agentId}/` 创建会话存储目录
- **AND** 如果目录已存在，不报错

#### Scenario: 角色会话文件存储在独立目录
- **WHEN** 角色创建会话
- **THEN** 会话文件存储在 `~/.niuma/sessions/{agentId}/` 目录
- **AND** 会话文件名包含会话 ID（如 `session-001.json`）

#### Scenario: 不同角色的会话完全隔离
- **WHEN** 多个角色创建会话
- **THEN** 每个角色的会话文件存储在独立的目录
- **AND** 角色无法访问其他角色的会话文件

### Requirement: 日志文件隔离
系统 SHALL 为每个角色创建独立的日志文件。

#### Scenario: 创建角色日志文件
- **WHEN** 系统首次启动角色时
- **THEN** 系统在 `~/.niuma/logs/{agentId}.log` 创建日志文件
- **AND** 如果文件已存在，追加日志内容

#### Scenario: 角色日志仅包含自身输出
- **WHEN** 角色运行并输出日志
- **THEN** 日志仅写入 `~/.niuma/logs/{agentId}.log` 文件
- **AND** 日志不包含其他角色的输出

#### Scenario: 不同角色的日志完全隔离
- **WHEN** 多个角色同时运行
- **THEN** 每个角色的日志写入独立的日志文件
- **AND** 日志文件互不干扰

### Requirement: 工作区路径计算
系统 SHALL 提供统一的路径计算方法，确保路径一致性。

#### Scenario: 计算工作区路径
- **WHEN** 调用 `getAgentWorkspaceDir(agentId)` 方法
- **THEN** 系统返回 `~/.niuma/agents/{agentId}/workspace/` 的绝对路径
- **AND** 路径格式正确（使用 `/` 分隔符）

#### Scenario: 计算会话存储路径
- **WHEN** 调用 `getAgentSessionDir(agentId)` 方法
- **THEN** 系统返回 `~/.niuma/sessions/{agentId}/` 的绝对路径
- **AND** 路径格式正确

#### Scenario: 计算日志文件路径
- **WHEN** 调用 `getAgentLogPath(agentId)` 方法
- **THEN** 系统返回 `~/.niuma/logs/{agentId}.log` 的绝对路径
- **AND** 路径格式正确

### Requirement: 目录自动创建
系统 SHALL 在首次访问时自动创建所需的目录。

#### Scenario: 首次访问工作区目录
- **WHEN** 工作区目录不存在且被访问
- **THEN** 系统自动创建工作区目录及其父目录
- **AND** 不抛出错误

#### Scenario: 首次访问会话存储目录
- **WHEN** 会话存储目录不存在且被访问
- **THEN** 系统自动创建会话存储目录及其父目录
- **AND** 不抛出错误

#### Scenario: 首次写入日志文件
- **WHEN** 日志文件不存在且被写入
- **THEN** 系统自动创建日志文件及其父目录
- **AND** 不抛出错误

### Requirement: 工作区清理（可选）
系统 SHALL 提供清理角色工作区的功能（可选，暂不实现）。

#### Scenario: 清理角色工作区
- **WHEN** 调用 `cleanAgentWorkspace(agentId)` 方法（可选）
- **THEN** 系统删除角色的工作区目录
- **AND** 系统删除角色的会话存储目录
- **AND** 系统删除角色的日志文件
- **AND** 删除操作需要用户确认

## TypeScript Interface Definitions

```typescript
/**
 * 角色工作区管理器
 */
class AgentWorkspaceManager {
  /**
   * 创建角色工作区管理器实例
   * @param baseDir 基础目录（默认为 ~/.niuma）
   */
  constructor(baseDir?: string)

  /**
   * 获取角色工作区路径
   * @param agentId 角色唯一标识符
   * @returns 工作区绝对路径
   */
  getWorkspaceDir(agentId: string): string

  /**
   * 获取角色会话存储路径
   * @param agentId 角色唯一标识符
   * @returns 会话存储目录绝对路径
   */
  getSessionDir(agentId: string): string

  /**
   * 获取角色日志文件路径
   * @param agentId 角色唯一标识符
   * @returns 日志文件绝对路径
   */
  getLogPath(agentId: string): string

  /**
   * 确保角色工作区目录存在
   * @param agentId 角色唯一标识符
   */
  ensureWorkspace(agentId: string): void

  /**
   * 确保角色会话存储目录存在
   * @param agentId 角色唯一标识符
   */
  ensureSessionDir(agentId: string): void

  /**
   * 获取角色记忆文件路径
   * @param agentId 角色唯一标识符
   * @returns 记忆文件绝对路径
   */
  getMemoryPath(agentId: string): string

  /**
   * 获取角色历史记录文件路径
   * @param agentId 角色唯一标识符
   * @returns 历史记录文件绝对路径
   */
  getHistoryPath(agentId: string): string

  /**
   * 清理角色工作区（可选）
   * @param agentId 角色唯一标识符
   * @param confirm 是否需要确认
   */
  cleanWorkspace(agentId: string, confirm?: boolean): void
}

/**
 * 角色工作区路径
 */
interface AgentWorkspacePaths {
  /** 工作区目录 */
  workspace: string
  /** 会话存储目录 */
  sessionDir: string
  /** 日志文件 */
  logFile: string
  /** 记忆文件 */
  memoryFile: string
  /** 历史记录文件 */
  historyFile: string
}
```

## Dependencies

- `config-manager`: 依赖配置管理器来获取角色信息
- `config-system`: 依赖配置系统来定义角色配置结构