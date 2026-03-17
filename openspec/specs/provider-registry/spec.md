# Provider Registry Specification

## Purpose

定义 Provider Registry 的功能规格和行为约束。

## Requirements

### Requirement: 提供商规格定义

系统 SHALL 定义提供商规格接口，描述提供商的元数据和匹配规则。

#### Scenario: 提供商规格结构

- **WHEN** 定义 ProviderSpec
- **THEN** 包含以下字段：
  - `name`: 配置字段名（如 "openai", "anthropic"）
  - `keywords`: 模型名关键词数组（如 ["gpt", "o1"]）
  - `envKey`: 环境变量名（如 "OPENAI_API_KEY"）
  - `displayName`: 显示名称（如 "OpenAI"）
  - `isGateway`: 是否为网关（可选）
  - `defaultApiBase`: 默认 API Base（可选）

### Requirement: 提供商注册

提供商注册表 SHALL 支持两步式注册机制。

#### Scenario: 注册提供商规格

- **WHEN** 调用 `register(spec)`
- **THEN** 将提供商规格添加到注册表
- **AND** 使用 `spec.name` 作为键

#### Scenario: 注册同名提供商

- **WHEN** 尝试注册已存在的提供商
- **THEN** 覆盖现有规格
- **AND** 发出警告

#### Scenario: 批量注册

- **WHEN** 调用 `registerMultiple(specs)`
- **THEN** 批量注册多个提供商
- **AND** 忽略重复注册

### Requirement: 提供商查询

提供商注册表 SHALL 支持多种查询方式。

#### Scenario: 按名称查询

- **WHEN** 调用 `getProviderByName(name)`
- **AND** 注册表中存在该提供商
- **THEN** 返回对应的提供商实例
- **OR** 如果不存在，返回 undefined

#### Scenario: 按模型名查询（显式指定）

- **WHEN** 调用 `getProvider(model)`
- **AND** 模型名包含提供商前缀（如 "openai/gpt-4o"）
- **THEN** 解析前缀并返回对应的提供商实例

#### Scenario: 按模型名查询（关键词匹配）

- **WHEN** 调用 `getProvider(model)`
- **AND** 模型名不包含提供商前缀
- **THEN** 遍历所有提供商的关键词
- **AND** 返回第一个匹配的提供商实例

#### Scenario: 按模型名查询（网关回退）

- **WHEN** 调用 `getProvider(model)`
- **AND** 无匹配的提供商
- **AND** 配置了网关提供商
- **THEN** 返回网关提供商实例

#### Scenario: 按模型名查询（无匹配）

- **WHEN** 调用 `getProvider(model)`
- **AND** 无匹配的提供商
- **AND** 未配置网关提供商
- **THEN** 返回 undefined

### Requirement: 提供商创建

提供商注册表 SHALL 能够根据配置创建提供商实例。

#### Scenario: 从配置创建提供商

- **WHEN** 调用 `createProvider(name, config)`
- **AND** 注册表中存在该提供商规格
- **THEN** 创建对应的提供商实例
- **AND** 返回实例

#### Scenario: 创建不存在的提供商

- **WHEN** 调用 `createProvider(name, config)`
- **AND** 注册表中不存在该提供商
- **THEN** 抛出错误

### Requirement: 默认提供商

提供商注册表 SHALL 支持设置和获取默认提供商。

#### Scenario: 设置默认提供商

- **WHEN** 调用 `setDefaultProvider(name)`
- **AND** 注册表中存在该提供商
- **THEN** 设置为默认提供商

#### Scenario: 设置不存在的默认提供商

- **WHEN** 调用 `setDefaultProvider(name)`
- **AND** 注册表中不存在该提供商
- **THEN** 抛出错误

#### Scenario: 获取默认提供商

- **WHEN** 调用 `getDefaultProvider()`
- **AND** 已设置默认提供商
- **THEN** 返回默认提供商实例
- **OR** 如果未设置，返回第一个注册的提供商

### Requirement: 内置提供商注册

提供商注册表 SHALL 在初始化时自动注册内置提供商。

#### Scenario: 注册 OpenAI

- **WHEN** 初始化 ProviderRegistry
- **THEN** 自动注册 OpenAI 提供商
- **AND** 关键词: ["gpt", "o1", "chatgpt"]
- **AND** 环境变量: "OPENAI_API_KEY"

#### Scenario: 注册 Anthropic

- **WHEN** 初始化 ProviderRegistry
- **THEN** 自动注册 Anthropic 提供商
- **AND** 关键词: ["claude"]
- **AND** 环境变量: "ANTHROPIC_API_KEY"

#### Scenario: 注册 OpenRouter

- **WHEN** 初始化 ProviderRegistry
- **THEN** 自动注册 OpenRouter 提供商
- **AND** 标记为网关
- **AND** 环境变量: "OPENROUTER_API_KEY"

#### Scenario: 注册 DeepSeek

- **WHEN** 初始化 ProviderRegistry
- **THEN** 自动注册 DeepSeek 提供商
- **AND** 关键词: ["deepseek"]
- **AND** 环境变量: "DEEPSEEK_API_KEY"

#### Scenario: 注册 Custom

- **WHEN** 初始化 ProviderRegistry
- **THEN** 自动注册 Custom 提供商
- **AND** 环境变量: "CUSTOM_API_KEY"

### Requirement: 匹配优先级

提供商匹配 SHALL 按以下优先级执行。

#### Scenario: 优先级 1：显式指定

- **WHEN** 模型名包含提供商前缀（如 "openai/gpt-4o"）
- **THEN** 优先使用显式指定的提供商

#### Scenario: 优先级 2：关键词匹配

- **WHEN** 模型名不包含提供商前缀
- **THEN** 使用关键词匹配
- **AND** 返回第一个匹配的提供商

#### Scenario: 优先级 3：网关回退

- **WHEN** 无关键词匹配
- **THEN** 返回网关提供商（如果配置）

#### Scenario: 优先级 4：默认提供商

- **WHEN** 无网关配置
- **THEN** 返回默认提供商

### Requirement: 提供商列表

提供商注册表 SHALL 提供查询已注册提供商列表的方法。

#### Scenario: 获取所有提供商

- **WHEN** 调用 `listProviders()`
- **THEN** 返回所有已注册提供商的规格列表

#### Scenario: 获取可用提供商

- **WHEN** 调用 `listAvailableProviders()`
- **THEN** 返回所有配置了 API 密钥的提供商列表

### Requirement: 错误处理

提供商注册表 SHALL 正确处理各种错误情况。

#### Scenario: 模型名格式无效

- **WHEN** 模型名为空或无效
- **THEN** 抛出配置错误

#### Scenario: 提供商配置缺失

- **WHEN** 创建提供商时配置缺失
- **THEN** 抛出配置错误
- **AND** 提示检查配置文件

---

## TypeScript Interfaces

```typescript
interface ProviderSpec {
  /** 配置字段名 */
  name: string
  /** 模型名关键词 */
  keywords: string[]
  /** 环境变量名 */
  envKey: string
  /** 显示名称 */
  displayName: string
  /** 是否为网关 */
  isGateway?: boolean
  /** 默认 API Base */
  defaultApiBase?: string
}

class ProviderRegistry {
  private specs: Map<string, ProviderSpec>
  private instances: Map<string, LLMProvider>
  private defaultProvider?: string

  constructor()

  // 注册
  register(spec: ProviderSpec): void
  registerMultiple(specs: ProviderSpec[]): void

  // 查询
  getProvider(model: string): LLMProvider | undefined
  getProviderByName(name: string): LLMProvider | undefined
  getDefaultProvider(): LLMProvider | undefined
  listProviders(): ProviderSpec[]
  listAvailableProviders(): ProviderSpec[]

  // 创建
  createProvider(name: string, config: LLMConfig): LLMProvider

  // 配置
  setDefaultProvider(name: string): void

  // 初始化
  private _registerBuiltinProviders(): void
}
```

## Dependencies

- `niuma/providers/base.ts` - LLMProvider 接口
- `niuma/types/llm.ts` - LLMConfig
- `niuma/providers/openai.ts` - OpenAIProvider
- `niuma/providers/anthropic.ts` - AnthropicProvider
- `niuma/providers/openrouter.ts` - OpenRouterProvider
- `niuma/providers/deepseek.ts` - DeepSeekProvider
- `niuma/providers/custom.ts` - CustomProvider