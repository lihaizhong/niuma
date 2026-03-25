## Purpose

定义 DeepAgent LLM 相关类型，包括 ChatMessage、LLMResponse、LLMProvider 等。这些类型提供与 LLM 提供商交互的类型契约。

## ADDED Requirements

### Requirement: ChatRole type definition
The system SHALL provide a ChatRole type for message roles.

#### Scenario: ChatRole values
- **WHEN** importing ChatRole from deepagent/types/llm
- **THEN** it SHALL be a union type: `"system" | "user" | "assistant" | "tool"`

### Requirement: MessageContentPart interface
The system SHALL provide a MessageContentPart interface for multi-part message content.

#### Scenario: MessageContentPart structure
- **WHEN** importing MessageContentPart from deepagent/types/llm
- **THEN** it SHALL have:
  - `type: "text" | "image_url"` - content type
  - `text?: string` - text content (when type is "text")
  - `image_url?: { url: string; detail?: "auto" | "low" | "high" }` - image URL (when type is "image_url")

### Requirement: ChatMessage interface
The system SHALL provide a ChatMessage interface for conversation messages.

#### Scenario: ChatMessage structure
- **WHEN** importing ChatMessage from deepagent/types/llm
- **THEN** it SHALL have:
  - `role: ChatRole` - message role
  - `content: string | MessageContentPart[]` - message content
  - `name?: string` - tool message name (optional)
  - `toolCallId?: string` - tool call ID (optional)
  - `toolCalls?: ToolCall[]` - tool calls from assistant (optional)
  - `reasoningContent?: string` - reasoning content for thinking models (optional)

### Requirement: LLMUsage interface
The system SHALL provide an LLMUsage interface for token usage tracking.

#### Scenario: LLMUsage structure
- **WHEN** importing LLMUsage from deepagent/types/llm
- **THEN** it SHALL have:
  - `inputTokens: number` - input token count
  - `outputTokens: number` - output token count
  - `totalTokens: number` - total token count

### Requirement: LLMResponse interface
The system SHALL provide an LLMResponse interface for LLM responses.

#### Scenario: LLMResponse structure
- **WHEN** importing LLMResponse from deepagent/types/llm
- **THEN** it SHALL have:
  - `content: string` - response content
  - `toolCalls?: ToolCall[]` - tool calls requested by LLM (optional)
  - `hasToolCalls: boolean` - whether response has tool calls
  - `reasoningContent?: string` - reasoning content (optional)
  - `usage?: LLMUsage` - token usage (optional)
  - `model?: string` - model used (optional)
  - `finishReason?: string` - completion reason (optional)

### Requirement: ChatOptions interface
The system SHALL provide a ChatOptions interface for LLM chat requests.

#### Scenario: ChatOptions structure
- **WHEN** importing ChatOptions from deepagent/types/llm
- **THEN** it SHALL have:
  - `messages: ChatMessage[]` - conversation messages
  - `tools?: ToolDefinition[]` - available tools (optional)
  - `model?: string` - model override (optional)
  - `temperature?: number` - temperature override (optional)
  - `maxTokens?: number` - max tokens override (optional)

### Requirement: LLMProvider interface
The system SHALL provide an LLMProvider interface for LLM provider implementations.

#### Scenario: LLMProvider structure
- **WHEN** importing LLMProvider from deepagent/types/llm
- **THEN** it SHALL have:
  - `readonly name: string` - provider name
  - `getConfig(): LLMConfig` - get provider configuration
  - `chat(options: ChatOptions): Promise<LLMResponse>` - send chat request
  - `getDefaultModel(): string` - get default model

### Requirement: LLMConfig interface
The system SHALL provide an LLMConfig interface for provider configuration.

#### Scenario: LLMConfig structure
- **WHEN** importing LLMConfig from deepagent/types/llm
- **THEN** it SHALL have:
  - `model: string` - model identifier
  - `apiKey?: string` - API key (optional)
  - `apiBase?: string` - API base URL (optional)
  - `temperature?: number` - sampling temperature (optional)
  - `maxTokens?: number` - max tokens (optional)

## Dependencies

- deepagent-tool-types (for ToolCall, ToolDefinition)
