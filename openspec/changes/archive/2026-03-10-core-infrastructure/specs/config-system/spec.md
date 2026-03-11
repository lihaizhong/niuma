## ADDED Requirements

### Requirement: Configuration schema validation

The system SHALL use zod to define and validate configuration schemas.

#### Scenario: NiumaConfig schema validates main config
- **WHEN** loading configuration
- **THEN** NiumaConfigSchema SHALL validate workDir, model, maxIterations, enableMemory, providers, channels fields

#### Scenario: Provider config schema validates provider settings
- **WHEN** configuring an LLM provider
- **THEN** ProviderConfigSchema SHALL validate model, apiKey, apiBase, extra fields

#### Scenario: ProviderConfigSchema validates generation control parameters
- **WHEN** configuring an LLM provider
- **THEN** ProviderConfigSchema SHALL validate temperature (0-2), maxTokens (positive integer), topP (0-1), stopSequences (string array)

#### Scenario: ProviderConfigSchema validates penalty parameters
- **WHEN** configuring an LLM provider
- **THEN** ProviderConfigSchema SHALL validate frequencyPenalty (-2 to 2), presencePenalty (-2 to 2)

#### Scenario: ProviderConfigSchema validates other parameters
- **WHEN** configuring an LLM provider
- **THEN** ProviderConfigSchema SHALL validate timeout (positive integer milliseconds)

#### Scenario: Channel config schema validates channel settings
- **WHEN** configuring a message channel
- **THEN** ChannelConfigSchema SHALL validate type, enabled, config fields

### Requirement: Configuration loading from multiple sources

The system SHALL load and merge configuration from multiple sources with defined priority.

#### Scenario: Default config provides base values
- **WHEN** no config file or env vars exist
- **THEN** default values SHALL be used (model: gpt-4o, maxIterations: 10, enableMemory: true)

#### Scenario: Environment variables override defaults
- **WHEN** OPENAI_API_KEY or NIUMA_MODEL env vars are set
- **THEN** they SHALL override default config values

#### Scenario: Config file has highest priority
- **WHEN** niuma.json or .niumarc exists
- **THEN** file config SHALL override env vars and defaults

### Requirement: Configuration file discovery

The system SHALL search for configuration files in standard locations.

#### Scenario: Search current directory first
- **WHEN** loading config
- **THEN** current directory SHALL be searched for niuma.json, .niuma.json, .niumarc

#### Scenario: Fall back to home directory
- **WHEN** no config in current directory
- **THEN** user home directory SHALL be searched

## TypeScript Interface Definitions

```typescript
/**
 * 提供商配置
 */
interface ProviderConfig {
  /** 提供商类型（openai、anthropic、ollama、custom） */
  type: 'openai' | 'anthropic' | 'ollama' | 'custom'
  /** 模型标识符 */
  model: string
  /** API 密钥 */
  apiKey?: string
  /** API 基础 URL */
  apiBase?: string
  /** 采样温度（0-2，值越高输出越随机） */
  temperature?: number
  /** 最大生成 token 数 */
  maxTokens?: number
  /** Top-p 采样参数（0-1，控制文本多样性） */
  topP?: number
  /** 停止序列，遇到这些字符串时停止生成 */
  stopSequences?: string[]
  /** 频率惩罚（-2.0 到 2.0，降低重复词汇的概率） */
  frequencyPenalty?: number
  /** 存在惩罚（-2.0 到 2.0，鼓励谈论新话题） */
  presencePenalty?: number
  /** 请求超时时间（毫秒） */
  timeout?: number
  /** 其他提供商特定选项 */
  extra?: Record<string, unknown>
}
```

## Dependencies

- `niuma/config/schema.ts` - ProviderConfigSchema 定义
- `niuma/types/llm.ts` - LLMConfig 类型定义
- `niuma/providers/openai.ts` - OpenAI 提供商实现
