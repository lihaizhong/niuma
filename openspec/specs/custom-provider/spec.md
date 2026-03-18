# Custom Provider Specification

## Purpose

定义 Custom Provider 的功能规格和行为约束。

## Requirements

### Requirement: 自定义提供商实现

系统 SHALL 提供自定义 OpenAI 兼容端点提供商，支持用户自定义 API Base 和认证方式。

#### Scenario: 创建自定义提供商实例

- **WHEN** 使用自定义配置创建提供商
- **THEN** 初始化 OpenAI 兼容客户端
- **AND** 使用用户指定的 API Base
- **AND** 使用用户指定的 API 密钥进行认证

#### Scenario: 自定义提供商基础聊天

- **WHEN** 调用 `chat()` 并提供消息列表
- **THEN** 通过 OpenAI 兼容接口发送请求到自定义端点
- **AND** 返回标准化的 LLM 响应

#### Scenario: 自定义提供商流式响应

- **WHEN** 调用 `chatStream()`
- **THEN** 通过 OpenAI 兼容流式接口返回响应
- **AND** 每个块包含增量内容

#### Scenario: 自定义提供商工具调用

- **WHEN** 自定义端点返回工具调用
- **THEN** 正确解析 tool_calls 字段
- **AND** 返回标准化的 toolCalls 数组

### Requirement: 自定义端点支持

自定义提供商 SHALL 支持常见的 OpenAI 兼容端点。

#### Scenario: Azure OpenAI

- **WHEN** API Base 为 Azure OpenAI 端点（如 `https://xxx.openai.azure.com`）
- **THEN** 正确调用 Azure OpenAI API
- **AND** 处理 Azure 特定的认证头

#### Scenario: Ollama

- **WHEN** API Base 为 Ollama 端点（如 `http://localhost:11434/v1`）
- **THEN** 正确调用 Ollama API
- **AND** 支持 Ollama 本地模型

#### Scenario: vLLM

- **WHEN** API Base 为 vLLM 端点（如 `http://localhost:8000/v1`）
- **THEN** 正确调用 vLLM API
- **AND** 支持 vLLM 托管的模型

#### Scenario: 其他 OpenAI 兼容端点

- **WHEN** API Base 为其他 OpenAI 兼容端点
- **THEN** 通过标准 OpenAI 接口调用
- **AND** 返回标准化响应

### Requirement: 自定义提供商配置

自定义提供商 SHALL 支持以下配置选项。

#### Scenario: API 密钥配置

- **WHEN** 配置中提供 `apiKey`
- **THEN** 使用指定的 API 密钥
- **OR** 如果未提供，使用 `CUSTOM_API_KEY` 环境变量

#### Scenario: API Base 配置（必需）

- **WHEN** 配置中提供 `apiBase`
- **THEN** 使用指定的 API Base
- **OR** 如果未提供，抛出配置错误

#### Scenario: 自定义认证头

- **WHEN** 配置中提供 `extra.headers.Authorization`
- **THEN** 使用自定义认证头
- **AND** 覆盖默认的 Bearer Token 认证

#### Scenario: 温度参数

- **WHEN** 配置中提供 `temperature`
- **THEN** 使用指定的温度值
- **OR** 如果未提供，使用默认值 0.7

#### Scenario: 最大 Token 数

- **WHEN** 配置中提供 `maxTokens`
- **THEN** 使用指定的最大 token 数
- **OR** 如果未提供，使用默认值 4096

#### Scenario: 自定义模型列表

- **WHEN** 配置中提供 `extra.models`
- **THEN** 用于模型验证
- **AND** 如果模型不在列表中，发出警告

### Requirement: 自定义提供商错误处理

自定义提供商 SHALL 正确处理自定义端点特定的错误。

#### Scenario: 连接失败

- **WHEN** 无法连接到自定义端点
- **THEN** 抛出标准 ProviderError
- **AND** 包含端点地址和连接详情

#### Scenario: 认证失败

- **WHEN** 自定义端点返回 401 错误
- **THEN** 抛出标准 ProviderError
- **AND** 提示检查 API 密钥和认证头

#### Scenario: 模型不可用

- **WHEN** 自定义端点返回模型不可用错误
- **THEN** 抛出标准 ProviderError
- **AND** 包含模型名称

### Requirement: 自定义提供商可用性检查

自定义提供商 SHALL 提供 `isAvailable()` 方法检查提供商是否可用。

#### Scenario: 可用性检查成功

- **WHEN** 调用 `isAvailable()`
- **AND** API 密钥有效且端点可访问
- **THEN** 返回 true

#### Scenario: 可用性检查失败

- **WHEN** 调用 `isAvailable()`
- **AND** API 密钥无效或端点不可访问
- **THEN** 返回 false

### Requirement: 配置验证

自定义提供商 SHALL 在创建时验证配置。

#### Scenario: API Base 缺失

- **WHEN** 配置中未提供 `apiBase`
- **THEN** 抛出配置错误
- **AND** 提示必须提供 API Base

#### Scenario: API Base 格式无效

- **WHEN** API Base 不是有效的 URL
- **THEN** 抛出配置错误
- **AND** 提示检查 API Base 格式

---

## TypeScript Interfaces

```typescript
interface CustomConfig extends LLMConfig {
  /** 自定义 HTTP 头 */
  extra?: {
    headers?: Record<string, string>
    models?: string[]  // 允许的模型列表
    [key: string]: unknown
  }
}

class CustomProvider extends OpenAIProvider implements LLMProvider {
  readonly name = "custom"

  constructor(config: CustomConfig)

  // 继承自 OpenAIProvider
  chat(options: ChatOptions): Promise<LLMResponse>
  chatStream(options: ChatOptions): AsyncIterable<LLMStreamChunk>
  getDefaultModel(): string
  isAvailable(): Promise<boolean>
  getConfig(): LLMConfig

  // 覆盖配置验证
  private _validateConfig(config: CustomConfig): void
}
```

## Dependencies

- `niuma/providers/openai.ts` - OpenAIProvider 基类
- `niuma/providers/base.ts` - LLMProvider 接口
- `niuma/types/llm.ts` - LLMConfig, ChatOptions, LLMResponse, LLMStreamChunk