## ADDED Requirements

### Requirement: Anthropic 提供商实现

系统 SHALL 提供 Anthropic Claude 系列模型提供商，支持 Anthropic API v2025-01-24。

#### Scenario: 创建 Anthropic 提供商实例

- **WHEN** 使用 Anthropic 配置创建提供商
- **THEN** 初始化 Anthropic SDK 客户端
- **AND** 使用 Anthropic API 密钥进行认证

#### Scenario: Anthropic 基础聊天

- **WHEN** 调用 `chat()` 并提供消息列表
- **THEN** 通过 Anthropic SDK 发送请求
- **AND** 返回标准化的 LLM 响应

#### Scenario: Anthropic 流式响应

- **WHEN** 调用 `chatStream()`
- **THEN** 通过 Anthropic SDK 流式 API 返回响应
- **AND** 每个块包含增量内容

#### Scenario: Anthropic 工具调用

- **WHEN** Anthropic 返回工具调用
- **THEN** 正确解析 tool_calls 字段
- **AND** 返回标准化的 toolCalls 数组

#### Scenario: Anthropic 消息格式转换

- **WHEN** 发送消息到 Anthropic
- **THEN** 将内部消息格式转换为 Anthropic 格式（user + assistant 交替）
- **AND** 正确处理 system 消息（放在 messages 数组开头）

#### Scenario: Anthropic 错误处理

- **WHEN** Anthropic API 返回错误
- **THEN** 转换为标准 ProviderError
- **AND** 包含错误代码和详细信息

### Requirement: Anthropic 模型支持

Anthropic 提供商 SHALL 支持以下 Claude 模型。

#### Scenario: Claude 3.5 Sonnet

- **WHEN** 模型名为 `claude-3-5-sonnet-20241022`
- **THEN** 使用 Claude 3.5 Sonnet 模型

#### Scenario: Claude 3 Opus

- **WHEN** 模型名为 `claude-3-opus-20240229`
- **THEN** 使用 Claude 3 Opus 模型

#### Scenario: Claude 3 Haiku

- **WHEN** 模型名为 `claude-3-haiku-20240307`
- **THEN** 使用 Claude 3 Haiku 模型

#### Scenario: 默认模型

- **WHEN** 未指定模型
- **THEN** 使用 `claude-3-5-sonnet-20241022` 作为默认模型

### Requirement: Anthropic 配置

Anthropic 提供商 SHALL 支持以下配置选项。

#### Scenario: API 密钥配置

- **WHEN** 配置中提供 `apiKey`
- **THEN** 使用指定的 API 密钥
- **OR** 如果未提供，使用 `ANTHROPIC_API_KEY` 环境变量

#### Scenario: API Base 配置

- **WHEN** 配置中提供 `apiBase`
- **THEN** 使用指定的 API Base
- **OR** 如果未提供，使用 `https://api.anthropic.com`

#### Scenario: 温度参数

- **WHEN** 配置中提供 `temperature`
- **THEN** 使用指定的温度值（0-1）
- **OR** 如果未提供，使用默认值 0.7

#### Scenario: 最大 Token 数

- **WHEN** 配置中提供 `maxTokens`
- **THEN** 使用指定的最大 token 数
- **OR** 如果未提供，使用默认值 4096

#### Scenario: Top-p 采样

- **WHEN** 配置中提供 `topP`
- **THEN** 使用指定的 top-p 值（0-1）
- **OR** 如果未提供，使用默认值 1.0

### Requirement: Anthropic Beta 功能支持

Anthropic 提供商 SHALL 支持通过 `extra` 参数启用 Anthropic beta 功能。

#### Scenario: Prompt Caching

- **WHEN** `extra.beta` 包含 `prompt-caching-2024-07-31`
- **THEN** 启用 prompt caching 功能
- **AND** 在系统提示词中添加缓存控制头

#### Scenario: Computer Use

- **WHEN** `extra.beta` 包含 `computer-use-2024-10-22`
- **THEN** 启用 computer use 功能
- **AND** 支持返回计算机控制工具调用

### Requirement: Anthropic 可用性检查

Anthropic 提供商 SHALL 提供 `isAvailable()` 方法检查提供商是否可用。

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
interface AnthropicConfig extends LLMConfig {
  /** Anthropic API 版本 */
  version?: string
  /** Anthropic beta 功能 */
  beta?: string[]
  /** 其他 Anthropic 特定选项 */
  extra?: {
    beta?: string[]
    [key: string]: unknown
  }
}

class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic"

  constructor(config: AnthropicConfig)

  chat(options: ChatOptions): Promise<LLMResponse>
  chatStream(options: ChatOptions): AsyncIterable<LLMStreamChunk>
  getDefaultModel(): string
  isAvailable(): Promise<boolean>
  getConfig(): LLMConfig
}
```

## Dependencies

- `niuma/providers/base.ts` - LLMProvider 接口
- `niuma/types/llm.ts` - LLMConfig, ChatOptions, LLMResponse, LLMStreamChunk
- `@anthropic-ai/sdk` - Anthropic 官方 SDK