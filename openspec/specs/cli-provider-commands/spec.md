# CLI Provider Commands 规格

## ADDED Requirements

### Requirement: /provider 命令列出所有 provider
系统 SHALL 支持 `/provider` 命令列出所有已配置的 provider 及其状态。

#### Scenario: 列出所有 provider
- **WHEN** 用户输入 `/provider`
- **THEN** 系统显示所有已配置的 provider 列表
- **AND** 列表包含 provider 名称、模型、可用状态
- **AND** 当前使用的 provider 被标记

#### Scenario: 显示当前 provider 信息
- **WHEN** 用户输入 `/provider current`
- **THEN** 系统显示当前正在使用的 provider 详细信息
- **AND** 包含 provider 名称、模型、API Base（如有）

#### Scenario: 无可用 provider
- **WHEN** 用户输入 `/provider` 且未配置任何 provider
- **THEN** 系统显示提示信息
- **AND** 提示用户在配置文件中添加 provider

### Requirement: /provider 命令切换 provider
系统 SHALL 支持 `/provider <name>` 命令切换到指定的 provider。

#### Scenario: 切换到有效 provider
- **WHEN** 用户输入 `/provider anthropic` 且 anthropic 已配置
- **THEN** 系统切换到 anthropic provider
- **AND** 显示切换成功信息
- **AND** 后续对话使用新 provider

#### Scenario: 切换到不存在的 provider
- **WHEN** 用户输入 `/provider nonexistent`
- **THEN** 系统显示错误信息
- **AND** 列出所有可用的 provider 名称

#### Scenario: 切换到未配置 API Key 的 provider
- **WHEN** 用户输入 `/provider openai` 且 openai 未配置 API Key
- **THEN** 系统显示警告信息
- **AND** 提示该 provider 可能不可用
- **AND** 仍然允许切换（由用户自行决定）

### Requirement: /model 命令根据模型切换 provider
系统 SHALL 支持 `/model <model-name>` 命令根据模型名自动匹配并切换 provider。

#### Scenario: 根据模型名匹配 provider
- **WHEN** 用户输入 `/model gpt-4o`
- **THEN** 系统自动匹配到 openai provider
- **AND** 切换到该 provider
- **AND** 显示切换成功信息

#### Scenario: 模型名包含 provider 前缀
- **WHEN** 用户输入 `/model anthropic/claude-sonnet-4-5`
- **THEN** 系统切换到 anthropic provider
- **AND** 使用指定的 claude-sonnet-4-5 模型

#### Scenario: 模型名无法匹配
- **WHEN** 用户输入 `/model unknown-model-xyz`
- **THEN** 系统显示错误信息
- **AND** 列出所有支持的模型关键词

### Requirement: Provider 状态显示格式
系统 SHALL 以清晰的格式显示 provider 信息。

#### Scenario: provider 列表格式
- **WHEN** 系统显示 provider 列表
- **THEN** 使用表格或列表格式
- **AND** 每行显示：名称、模型、状态标记
- **AND** 当前 provider 使用 `*` 或 `(current)` 标记

#### Scenario: provider 详细信息格式
- **WHEN** 系统显示单个 provider 详情
- **THEN** 包含名称、模型、配置摘要
- **AND** 使用易读的格式化输出

## TypeScript Interface Definitions

```typescript
/**
 * Provider 信息（用于列表显示）
 */
interface ProviderInfo {
  /** Provider 名称 */
  name: string;
  /** 显示名称 */
  displayName: string;
  /** 当前使用的模型 */
  model: string;
  /** 是否为当前 provider */
  isCurrent: boolean;
  /** 是否可用（API Key 已配置） */
  isAvailable: boolean;
}

/**
 * Provider 切换结果
 */
interface ProviderSwitchResult {
  /** 是否成功 */
  success: boolean;
  /** 新的 provider 名称 */
  providerName: string;
  /** 新的模型名称 */
  modelName: string;
  /** 错误信息（如失败） */
  error?: string;
}

/**
 * AgentLoop 扩展方法
 */
interface AgentLoopProviderMethods {
  /**
   * 列出所有可用 provider
   */
  listProviders(): ProviderInfo[];

  /**
   * 获取当前 provider 信息
   */
  getCurrentProvider(): ProviderInfo;

  /**
   * 切换 provider
   * @param name provider 名称
   */
  switchProvider(name: string): ProviderSwitchResult;

  /**
   * 根据模型名切换 provider
   * @param modelName 模型名称
   */
  switchByModel(modelName: string): ProviderSwitchResult;
}
```

## Dependencies

- `provider-registry`: 依赖 ProviderRegistry 获取 provider 列表和实例
- `provider-config`: 依赖 provider 配置结构
- `agent-loop`: 需要修改 AgentLoop 以支持 provider 切换
