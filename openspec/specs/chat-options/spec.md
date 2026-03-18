# Chat Options Specification

## Purpose

定义 Chat Options 的功能规格和行为约束。

## Requirements

### Requirement: 聊天接口支持完整的 LLM 参数

LLMProvider SHALL 支持在 ChatOptions 中使用完整的 LLM 参数集合。

#### Scenario: ChatOptions 支持生成控制参数
- **WHEN** 调用 `chat()` 方法
- **THEN** ChatOptions SHALL 支持以下参数：
  - `messages` - 消息列表（必填）
  - `tools` - 工具定义（可选）
  - `model` - 模型标识符（可选，覆盖默认）
  - `temperature` - 采样温度（可选，覆盖默认）
  - `maxTokens` - 最大生成 token 数（可选，覆盖默认）
  - `topP` - Top-p 采样参数（可选，覆盖默认）
  - `stopSequences` - 停止序列（可选，覆盖默认）

#### Scenario: ChatOptions 支持惩罚参数
- **WHEN** 调用 `chat()` 方法
- **THEN** ChatOptions SHALL 支持以下惩罚参数：
  - `frequencyPenalty` - 频率惩罚（可选，覆盖默认）
  - `presencePenalty` - 存在惩罚（可选，覆盖默认）

#### Scenario: ChatOptions 支持其他参数
- **WHEN** 调用 `chat()` 方法
- **THEN** ChatOptions SHALL 支持以下其他参数：
  - `timeout` - 请求超时时间（可选，覆盖默认）

#### Scenario: 参数覆盖默认配置
- **WHEN** ChatOptions 中指定了参数
- **THEN** 该参数 SHALL 覆盖提供商的默认配置
- **AND** 未指定的参数 SHALL 使用提供商的默认值

## TypeScript Interface Definitions

```typescript
/**
 * 聊天调用选项
 */
interface ChatOptions {
  /** 消息列表 */
  messages: ChatMessage[]
  /** 工具定义 */
  tools?: ToolDefinition[]
  /** 模型（覆盖默认） */
  model?: string
  /** 采样温度（覆盖默认） */
  temperature?: number
  /** 最大生成 token 数（覆盖默认） */
  maxTokens?: number
  /** Top-p 采样参数（覆盖默认） */
  topP?: number
  /** 停止序列（覆盖默认） */
  stopSequences?: string[]
  /** 频率惩罚（覆盖默认） */
  frequencyPenalty?: number
  /** 存在惩罚（覆盖默认） */
  presencePenalty?: number
  /** 请求超时时间（覆盖默认） */
  timeout?: number
}

/**
 * LLM 配置
 */
interface LLMConfig {
  /** 模型标识符 */
  model: string
  /** API 密钥（可通过环境变量设置） */
  apiKey?: string
  /** API 基础 URL */
  apiBase?: string
  /** 采样温度（0-2） */
  temperature?: number
  /** 最大生成 token 数 */
  maxTokens?: number
  /** Top-p 采样参数 */
  topP?: number
  /** 停止序列 */
  stopSequences?: string[]
  /** 频率惩罚（-2.0 到 2.0） */
  frequencyPenalty?: number
  /** 存在惩罚（-2.0 到 2.0） */
  presencePenalty?: number
  /** 请求超时时间（毫秒） */
  timeout?: number
  /** 其他提供商特定选项 */
  extra?: Record<string, unknown>
}
```

## 配置合并策略

### 1. 优先级

参数优先级从高到低：
1. ChatOptions 中显式指定的参数
2. 角色配置中的提供商参数
3. 全局配置中的提供商参数
4. 提供商的默认值

### 2. 示例

```typescript
// 全局配置
const globalConfig: ProviderConfig = {
  type: 'openai',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 4000,
}

// 角色配置
const agentConfig: Partial<ProviderConfig> = {
  temperature: 0.5,
  topP: 0.8,
}

// 调用选项
const chatOptions: ChatOptions = {
  messages: [...],
  temperature: 0.3,  // 覆盖角色和全局配置
  maxTokens: 2000,   // 覆盖全局配置
  // topP 使用角色配置的 0.8
  // 其他参数使用全局配置
}
```

## Dependencies

- `niuma/types/llm.ts` - ChatOptions 和 LLMConfig 类型定义
- `niuma/providers/openai.ts` - OpenAI 提供商实现
- `niuma/providers/base.ts` - LLMProvider 接口定义