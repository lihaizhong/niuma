# Provider Config Specification

## Purpose

定义 Provider Config 的功能规格和行为约束。

## Requirements

### Requirement: Provider config schema validates provider settings

系统 SHALL 使用 Zod 验证提供商配置，支持完整的 LLM 参数集合。

#### Scenario: ProviderConfigSchema 验证基础参数
- **WHEN** 配置提供商
- **THEN** ProviderConfigSchema SHALL 验证以下基础字段：
  - `type` - 提供商类型（openai、anthropic、ollama、custom）
  - `model` - 模型标识符（必填）
  - `apiKey` - API 密钥（可选）
  - `apiBase` - API 基础 URL（可选）

#### Scenario: ProviderConfigSchema 验证生成控制参数
- **WHEN** 配置提供商
- **THEN** ProviderConfigSchema SHALL 验证以下生成控制参数：
  - `temperature` - 采样温度（0-2）
  - `maxTokens` - 最大生成 token 数（正整数）
  - `topP` - Top-p 采样参数（0-1）
  - `stopSequences` - 停止序列（字符串数组）

#### Scenario: ProviderConfigSchema 验证惩罚参数
- **WHEN** 配置提供商
- **THEN** ProviderConfigSchema SHALL 验证以下惩罚参数：
  - `frequencyPenalty` - 频率惩罚（-2 到 2）
  - `presencePenalty` - 存在惩罚（-2 到 2）

#### Scenario: ProviderConfigSchema 验证其他参数
- **WHEN** 配置提供商
- **THEN** ProviderConfigSchema SHALL 验证以下其他参数：
  - `timeout` - 请求超时时间（毫秒，正整数）
  - `extra` - 其他提供商特定选项（键值对）

#### Scenario: 参数值超出范围
- **WHEN** 配置文件的数值字段超出 Schema 定义的范围
- **THEN** 系统拒绝启动
- **AND** 显示清晰的错误信息，指出字段名称和有效范围

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

## 参数说明

### temperature
- **范围**: 0 到 2
- **默认值**: 通常为 0.7
- **说明**: 控制输出的随机性。值越高，输出越随机；值越低，输出越确定

### maxTokens
- **类型**: 正整数
- **默认值**: 取决于模型
- **说明**: 限制生成的最大 token 数量

### topP
- **范围**: 0 到 1
- **默认值**: 通常为 1.0
- **说明**: 核采样参数，控制文本多样性

### stopSequences
- **类型**: 字符串数组
- **说明**: 当生成的内容包含这些字符串时，停止生成

### frequencyPenalty
- **范围**: -2.0 到 2.0
- **默认值**: 0
- **说明**: 降低重复词汇的概率

### presencePenalty
- **范围**: -2.0 到 2.0
- **默认值**: 0
- **说明**: 鼓励谈论新话题

### timeout
- **类型**: 正整数（毫秒）
- **默认值**: 通常为 120000（2分钟）
- **说明**: 请求超时时间

## Dependencies

- `niuma/config/schema.ts` - ProviderConfigSchema 定义
- `niuma/types/llm.ts` - LLMConfig 类型定义
- `niuma/providers/openai.ts` - OpenAI 提供商实现