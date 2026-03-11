## ADDED Requirements

### Requirement: 聊天接口

LLMProvider SHALL 提供聊天接口，接收消息列表并返回响应。

#### Scenario: 基础聊天

- **WHEN** 调用 `chat()` 并提供消息列表
- **THEN** 返回 LLM 响应，包含 content 和 toolCalls

#### Scenario: 带工具定义

- **WHEN** 调用 `chat()` 并提供 tools 参数
- **THEN** 响应可能包含 toolCalls

#### Scenario: 自定义模型参数

- **WHEN** 调用 `chat()` 并提供 temperature, maxTokens
- **THEN** 使用指定参数调用 LLM

#### Scenario: 自定义生成控制参数

- **WHEN** 调用 `chat()` 并提供 topP, stopSequences
- **THEN** 使用指定参数调用 LLM

#### Scenario: 自定义惩罚参数

- **WHEN** 调用 `chat()` 并提供 frequencyPenalty, presencePenalty
- **THEN** 使用指定参数调用 LLM

#### Scenario: 自定义超时参数

- **WHEN** 调用 `chat()` 并提供 timeout
- **THEN** 使用指定的超时时间调用 LLM

#### Scenario: 参数覆盖默认配置

- **WHEN** ChatOptions 中指定了参数
- **THEN** 该参数 SHALL 覆盖提供商的默认配置
- **AND** 未指定的参数 SHALL 使用提供商的默认值

### Requirement: 流式响应

LLMProvider SHALL 支持流式响应。

#### Scenario: 流式聊天

- **WHEN** 调用 `chatStream()`
- **THEN** 返回 AsyncIterable，逐块产生响应

#### Scenario: 流式块内容

- **WHEN** 迭代 chatStream 结果
- **THEN** 每个块包含 content, toolCalls（增量）, isFinal 等字段

### Requirement: 默认模型

LLMProvider SHALL 能够返回默认模型名称。

#### Scenario: 获取默认模型

- **WHEN** 调用 `getDefaultModel()`
- **THEN** 返回提供商的默认模型名称

### Requirement: OpenAI 实现

OpenAI Provider SHALL 实现 LLMProvider 接口。

#### Scenario: OpenAI 聊天

- **WHEN** 使用 OpenAI Provider 调用 chat
- **THEN** 通过 LangChain ChatOpenAI 调用 OpenAI API

#### Scenario: OpenAI 流式

- **WHEN** 使用 OpenAI Provider 调用 chatStream
- **THEN** 通过 LangChain 流式 API 返回响应

#### Scenario: OpenAI 工具调用

- **WHEN** OpenAI 返回工具调用
- **THEN** 正确解析并返回 toolCalls 数组

### Requirement: 错误处理

LLMProvider SHALL 处理 API 错误。

#### Scenario: API 限流

- **WHEN** OpenAI 返回 429 错误
- **THEN** 抛出可识别的错误类型

#### Scenario: 无效请求

- **WHEN** OpenAI 返回 400 错误
- **THEN** 抛出包含错误详情的异常

---

## TypeScript Interfaces

```typescript
interface LLMProvider {
  chat(options: ChatOptions): Promise<LLMResponse>
  chatStream?(options: ChatOptions): AsyncIterable<LLMStreamChunk>
  getDefaultModel(): string
}

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

interface LLMResponse {
  content: string
  toolCalls?: ToolCall[]
  hasToolCalls: boolean
  reasoningContent?: string
  usage?: LLMUsage
  model?: string
  finishReason?: string
}

interface LLMStreamChunk {
  content?: string
  toolCalls?: Partial<ToolCall>[]
  isFinal?: boolean
  finishReason?: string
  usage?: LLMUsage
}
```

## Dependencies

- `niuma/types/llm.ts` - ChatMessage, LLMUsage
- `niuma/types/tool.ts` - ToolDefinition, ToolCall
