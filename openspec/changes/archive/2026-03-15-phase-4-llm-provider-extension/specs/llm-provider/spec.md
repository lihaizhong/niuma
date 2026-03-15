## MODIFIED Requirements

### Requirement: OpenAI 实现

OpenAI Provider SHALL 实现 LLMProvider 接口，支持多提供商并存和自动选择。

#### Scenario: OpenAI 聊天

- **WHEN** 使用 OpenAI Provider 调用 chat
- **THEN** 通过 LangChain ChatOpenAI 调用 OpenAI API
- **AND** 可以与其他提供商并存

#### Scenario: OpenAI 流式

- **WHEN** 使用 OpenAI Provider 调用 chatStream
- **THEN** 通过 LangChain 流式 API 返回响应

#### Scenario: OpenAI 工具调用

- **WHEN** OpenAI 返回工具调用
- **THEN** 正确解析并返回 toolCalls 数组

#### Scenario: OpenAI 作为默认提供商

- **WHEN** 配置文件中指定 OpenAI 为默认提供商
- **THEN** 未指定提供商时使用 OpenAI
- **AND** 保持向后兼容

## ADDED Requirements

### Requirement: 多提供商配置

系统 SHALL 支持在配置文件中配置多个提供商。

#### Scenario: 多提供商配置格式

- **WHEN** 配置文件中包含 `llm.providers` 对象
- **THEN** 支持配置多个提供商
- **AND** 每个提供商有独立的配置块

#### Scenario: 默认提供商配置

- **WHEN** 配置文件中指定 `llm.defaultProvider`
- **THEN** 使用指定的提供商作为默认
- **OR** 如果未指定，使用第一个配置的提供商

#### Scenario: 单一提供商配置（向后兼容）

- **WHEN** 配置文件使用旧格式（单一 llm 配置）
- **THEN** 自动迁移到新格式
- **AND** 保持向后兼容

### Requirement: 提供商自动选择

系统 SHALL 根据模型名自动选择合适的提供商。

#### Scenario: 显式指定提供商

- **WHEN** 模型名包含提供商前缀（如 "openai/gpt-4o"）
- **THEN** 使用指定的提供商
- **AND** 忽略其他匹配规则

#### Scenario: 关键词匹配

- **WHEN** 模型名不包含提供商前缀
- **THEN** 使用关键词匹配选择提供商
- **AND** 优先匹配最具体的关键词

#### Scenario: 网关回退

- **WHEN** 无关键词匹配
- **AND** 配置了网关提供商（如 OpenRouter）
- **THEN** 使用网关提供商

#### Scenario: 默认提供商回退

- **WHEN** 无匹配且无网关
- **THEN** 使用配置的默认提供商

### Requirement: 配置迁移

系统 SHALL 支持从旧配置格式自动迁移到新格式。

#### Scenario: 检测旧配置

- **WHEN** 配置文件使用旧格式（直接在 llm 下配置）
- **THEN** 检测到旧配置格式
- **AND** 记录迁移日志

#### Scenario: 自动迁移

- **WHEN** 检测到旧配置格式
- **THEN** 自动迁移到新格式
- **AND** 将旧配置包装在 `providers.openai` 下
- **AND** 设置 `defaultProvider` 为 "openai"

#### Scenario: 迁移验证

- **WHEN** 迁移配置
- **THEN** 验证新配置格式
- **AND** 确保所有必需字段存在

#### Scenario: 迁移失败处理

- **WHEN** 迁移过程中出现错误
- **THEN** 记录错误详情
- **AND** 使用默认配置
- **AND** 提示用户检查配置

### Requirement: 提供商配置验证

系统 SHALL 在启动时验证提供商配置。

#### Scenario: API 密钥验证

- **WHEN** 配置了提供商但未提供 API 密钥
- **THEN** 检查环境变量
- **OR** 如果环境变量也未设置，发出警告

#### Scenario: 模型名验证

- **WHEN** 配置了模型名
- **THEN** 验证模型名格式
- **OR** 如果无效，发出警告

#### Scenario: API Base 验证

- **WHEN** 配置了 API Base
- **THEN** 验证 URL 格式
- **OR** 如果无效，抛出配置错误

### Requirement: 提供商健康检查

系统 SHALL 提供提供商健康检查功能。

#### Scenario: 检查所有提供商

- **WHEN** 调用健康检查
- **THEN** 检查所有配置的提供商
- **AND** 返回每个提供商的状态

#### Scenario: 检查单个提供商

- **WHEN** 指定提供商名称调用健康检查
- **THEN** 仅检查指定的提供商
- **AND** 返回该提供商的状态

#### Scenario: 健康检查失败

- **WHEN** 提供商健康检查失败
- **THEN** 记录错误
- **AND** 返回失败状态
- **AND** 不影响其他提供商

---

## TypeScript Interfaces

```typescript
// 扩展配置 Schema
interface LLMConfigSchema {
  defaultProvider?: string
  providers: {
    [providerName: string]: LLMProviderConfig
  }
}

interface LLMProviderConfig {
  model: string
  apiKey?: string
  apiBase?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  stopSequences?: string[]
  frequencyPenalty?: number
  presencePenalty?: number
  timeout?: number
  extra?: Record<string, unknown>
}

// 迁移相关
interface ConfigMigration {
  detect(config: unknown): boolean
  migrate(config: unknown): LLMConfigSchema
  validate(config: LLMConfigSchema): boolean
}

// 健康检查相关
interface ProviderHealthStatus {
  name: string
  available: boolean
  error?: string
  model?: string
}
```

## Dependencies

- `niuma/config/schema.ts` - 配置 Schema 定义
- `niuma/config/manager.ts` - 配置管理器
- `niuma/providers/registry.ts` - 提供商注册表
- `niuma/providers/base.ts` - LLMProvider 接口