## ADDED Requirements

### Requirement: DeepSeek 提供商实现

系统 SHALL 提供 DeepSeek 系列模型提供商，支持 DeepSeek API。

#### Scenario: 创建 DeepSeek 提供商实例

- **WHEN** 使用 DeepSeek 配置创建提供商
- **THEN** 初始化 OpenAI 兼容客户端
- **AND** 设置 API Base 为 `https://api.deepseek.com`
- **AND** 使用 DeepSeek API 密钥进行认证

#### Scenario: DeepSeek 基础聊天

- **WHEN** 调用 `chat()` 并提供消息列表
- **THEN** 通过 OpenAI 兼容接口发送请求到 DeepSeek
- **AND** 返回标准化的 LLM 响应

#### Scenario: DeepSeek 流式响应

- **WHEN** 调用 `chatStream()`
- **THEN** 通过 OpenAI 兼容流式接口返回响应
- **AND** 每个块包含增量内容

#### Scenario: DeepSeek 工具调用

- **WHEN** DeepSeek 返回工具调用
- **THEN** 正确解析 tool_calls 字段
- **AND** 返回标准化的 toolCalls 数组

### Requirement: DeepSeek 模型支持

DeepSeek 提供商 SHALL 支持以下 DeepSeek 模型。

#### Scenario: DeepSeek Chat

- **WHEN** 模型名为 `deepseek-chat`
- **THEN** 使用 DeepSeek Chat 模型

#### Scenario: DeepSeek Coder

- **WHEN** 模型名为 `deepseek-coder`
- **THEN** 使用 DeepSeek Coder 模型

#### Scenario: 默认模型

- **WHEN** 未指定模型
- **THEN** 使用 `deepseek-chat` 作为默认模型

### Requirement: DeepSeek 配置

DeepSeek 提供商 SHALL 支持以下配置选项。

#### Scenario: API 密钥配置

- **WHEN** 配置中提供 `apiKey`
- **THEN** 使用指定的 API 密钥
- **OR** 如果未提供，使用 `DEEPSEEK_API_KEY` 环境变量

#### Scenario: API Base 配置

- **WHEN** 配置中提供 `apiBase`
- **THEN** 使用指定的 API Base
- **OR** 如果未提供，使用默认的 `https://api.deepseek.com`

#### Scenario: 温度参数

- **WHEN** 配置中提供 `temperature`
- **THEN** 使用指定的温度值（0-2）
- **OR** 如果未提供，使用默认值 0.7

#### Scenario: 最大 Token 数

- **WHEN** 配置中提供 `maxTokens`
- **THEN** 使用指定的最大 token 数
- **OR** 如果未提供，使用默认值 4096

#### Scenario: Top-p 采样

- **WHEN** 配置中提供 `topP`
- **THEN** 使用指定的 top-p 值（0-1）
- **OR** 如果未提供，使用默认值 1.0

### Requirement: DeepSeek 错误处理

DeepSeek 提供商 SHALL 正确处理 DeepSeek 特定的错误。

#### Scenario: DeepSeek 限流

- **WHEN** DeepSeek 返回 429 错误
- **THEN** 抛出标准 ProviderError
- **AND** 包含 DeepSeek 特定的错误信息

#### Scenario: DeepSeek 认证失败

- **WHEN** DeepSeek 返回 401 错误
- **THEN** 抛出标准 ProviderError
- **AND** 提示检查 API 密钥

### Requirement: DeepSeek 可用性检查

DeepSeek 提供商 SHALL 提供 `isAvailable()` 方法检查提供商是否可用。

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
interface DeepSeekConfig extends LLMConfig {
  // DeepSeek 配置与标准 LLMConfig 相同
  // 无额外特定选项
}

class DeepSeekProvider extends OpenAIProvider implements LLMProvider {
  readonly name = "deepseek"

  constructor(config: DeepSeekConfig)

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