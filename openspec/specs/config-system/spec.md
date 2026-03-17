# Config System Specification

## Purpose

定义 Config System 的功能规格和行为约束。

## Requirements

### Requirement: 配置 schema 验证

系统 SHALL 使用 zod 定义和验证配置 schemas。

#### Scenario: NiumaConfig schema 验证主配置
- **WHEN** 加载配置
- **THEN** NiumaConfigSchema SHALL 验证 workDir、model、maxIterations、enableMemory、providers、channels 字段

#### Scenario: Provider config schema 验证提供商设置
- **WHEN** 配置 LLM 提供商
- **THEN** ProviderConfigSchema SHALL 验证 model、apiKey、apiBase、extra 字段

#### Scenario: ProviderConfigSchema 验证生成控制参数
- **WHEN** 配置 LLM 提供商
- **THEN** ProviderConfigSchema SHALL 验证 temperature (0-2)、maxTokens (正整数)、topP (0-1)、stopSequences (字符串数组)

#### Scenario: ProviderConfigSchema 验证惩罚参数
- **WHEN** 配置 LLM 提供商
- **THEN** ProviderConfigSchema SHALL 验证 frequencyPenalty (-2 到 2)、presencePenalty (-2 到 2)

#### Scenario: ProviderConfigSchema 验证其他参数
- **WHEN** 配置 LLM 提供商
- **THEN** ProviderConfigSchema SHALL 验证 timeout (正整数毫秒)

#### Scenario: Channel config schema 验证渠道设置
- **WHEN** 配置消息渠道
- **THEN** ChannelConfigSchema SHALL 验证 type、enabled、config 字段

### Requirement: 从多个来源加载配置

系统 SHALL 从多个来源加载和合并配置，并定义优先级。

#### Scenario: 默认配置提供基础值
- **WHEN** 不存在配置文件或环境变量
- **THEN** SHALL 使用默认值 (model: gpt-4o、maxIterations: 10、enableMemory: true)

#### Scenario: 环境变量覆盖默认值
- **WHEN** 设置了 OPENAI_API_KEY 或 NIUMA_MODEL 环境变量
- **THEN** 它们 SHALL 覆盖默认配置值

#### Scenario: 配置文件具有最高优先级
- **WHEN** 存在 niuma.json 或 .niumarc
- **THEN** 文件配置 SHALL 覆盖环境变量和默认值

### Requirement: 配置文件发现

系统 SHALL 在标准位置搜索配置文件。

#### Scenario: 首先搜索当前目录
- **WHEN** 加载配置
- **THEN** SHALL 在当前目录搜索 niuma.json、.niuma.json、.niumarc

#### Scenario: 回退到主目录
- **WHEN** 当前目录中没有配置
- **THEN** SHALL 搜索用户主目录

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