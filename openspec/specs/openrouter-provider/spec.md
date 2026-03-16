## ADDED Requirements

### Requirement: OpenRouter 提供商实现

系统 SHALL 提供 OpenRouter 多模型网关提供商，支持统一 API 访问多种模型。

#### Scenario: 创建 OpenRouter 提供商实例

- **WHEN** 使用 OpenRouter 配置创建提供商
- **THEN** 初始化 OpenAI 兼容客户端
- **AND** 设置 API Base 为 `https://openrouter.ai/api/v1`
- **AND** 使用 OpenRouter API 密钥进行认证

#### Scenario: OpenRouter 基础聊天

- **WHEN** 调用 `chat()` 并提供消息列表
- **THEN** 通过 OpenAI 兼容接口发送请求到 OpenRouter
- **AND** 返回标准化的 LLM 响应

#### Scenario: OpenRouter 流式响应

- **WHEN** 调用 `chatStream()`
- **THEN** 通过 OpenAI 兼容流式接口返回响应
- **AND** 每个块包含增量内容

#### Scenario: OpenRouter 工具调用

- **WHEN** OpenRouter 返回工具调用
- **THEN** 正确解析 tool_calls 字段
- **AND** 返回标准化的 toolCalls 数组

#### Scenario: OpenRouter HTTP 头

- **WHEN** 发送请求到 OpenRouter
- **THEN** 自动添加 `HTTP-Referer` 头（指向 Niuma 项目）
- **AND** 自动添加 `X-Title` 头（标识为 Niuma）

### Requirement: OpenRouter 模型支持

OpenRouter 提供商 SHALL 支持通过 OpenRouter 访问的所有模型。

#### Scenario: Anthropic 模型通过 OpenRouter

- **WHEN** 模型名为 `anthropic/claude-3.5-sonnet`
- **THEN** 通过 OpenRouter 访问 Anthropic Claude 3.5 Sonnet

#### Scenario: OpenAI 模型通过 OpenRouter

- **WHEN** 模型名为 `openai/gpt-4o`
- **THEN** 通过 OpenRouter 访问 OpenAI GPT-4o

#### Scenario: 其他提供商模型

- **WHEN** 模型名为其他提供商的模型（如 `google/gemini-pro-1.5`）
- **THEN** 通过 OpenRouter 访问相应模型

#### Scenario: 默认模型

- **WHEN** 未指定模型
- **THEN** 使用 `anthropic/claude-3.5-sonnet` 作为默认模型

### Requirement: OpenRouter 配置

OpenRouter 提供商 SHALL 支持以下配置选项。

#### Scenario: API 密钥配置

- **WHEN** 配置中提供 `apiKey`
- **THEN** 使用指定的 API 密钥
- **OR** 如果未提供，使用 `OPENROUTER_API_KEY` 环境变量

#### Scenario: API Base 配置

- **WHEN** 配置中提供 `apiBase`
- **THEN** 使用指定的 API Base
- **OR** 如果未提供，使用默认的 `https://openrouter.ai/api/v1`

#### Scenario: 温度参数

- **WHEN** 配置中提供 `temperature`
- **THEN** 使用指定的温度值（0-2）
- **OR** 如果未提供，使用默认值 0.7

#### Scenario: 最大 Token 数

- **WHEN** 配置中提供 `maxTokens`
- **THEN** 使用指定的最大 token 数
- **OR** 如果未提供，使用默认值 4096

#### Scenario: 自定义 HTTP 头

- **WHEN** 配置中提供 `extra.headers`
- **THEN** 在请求中添加自定义 HTTP 头
- **AND** 与默认的 `HTTP-Referer` 和 `X-Title` 头合并

### Requirement: OpenRouter 错误处理

OpenRouter 提供商 SHALL 正确处理 OpenRouter 特定的错误。

#### Scenario: OpenRouter 限流

- **WHEN** OpenRouter 返回 429 错误
- **THEN** 抛出标准 ProviderError
- **AND** 包含 OpenRouter 特定的错误信息

#### Scenario: OpenRouter 模型不可用

- **WHEN** OpenRouter 返回模型不可用错误
- **THEN** 抛出标准 ProviderError
- **AND** 包含模型名称和建议

### Requirement: OpenRouter 可用性检查

OpenRouter 提供商 SHALL 提供 `isAvailable()` 方法检查提供商是否可用。

#### Scenario: 可用性检查成功

- **WHEN** 调用 `isAvailable()`
- **AND** API 密钥有效
- **THEN** 返回 true

#### Scenario: 可用性检查失败

- **WHEN** 调用 `isAvailable()`
- **AND** API 密钥无效或网络错误
- **THEN** 返回 false

---

## TypeScript Interfaces

```typescript
interface OpenRouterConfig extends LLMConfig {
  /** 自定义 HTTP 头 */
  extra?: {
    headers?: Record<string, string>
    [key: string]: unknown
  }
}

class OpenRouterProvider extends OpenAIProvider implements LLMProvider {
  readonly name = "openrouter"
  readonly isGateway = true

  constructor(config: OpenRouterConfig)

  // 继承自 OpenAIProvider
  chat(options: ChatOptions): Promise<LLMResponse>
  chatStream(options: ChatOptions): AsyncIterable<LLMStreamChunk>
  getDefaultModel(): string
  isAvailable(): Promise<boolean>
  getConfig(): LLMConfig
}
```

## Dependencies

- `niuma/providers/openai.ts` - OpenAIProvider 基类
- `niuma/providers/base.ts` - LLMProvider 接口
- `niuma/types/llm.ts` - LLMConfig, ChatOptions, LLMResponse, LLMStreamChunk