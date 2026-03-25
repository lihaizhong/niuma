## ADDED Requirements

### Requirement: LLM Provider Interface
All LLM providers SHALL implement a common interface for chat and streaming.

#### Scenario: Synchronous chat
- **WHEN** Provider.chat() is called with messages and options
- **THEN** Provider SHALL return LLMResponse with content and optional tool calls

#### Scenario: Streaming chat
- **WHEN** Provider.chatStream() is called
- **THEN** Provider SHALL yield LLMStreamChunk for each content delta
- **AND** Final chunk SHALL have isFinal flag set

#### Scenario: Provider availability check
- **WHEN** Provider.isAvailable() is called
- **THEN** Provider SHALL return boolean indicating if configured correctly

### Requirement: OpenAI-Compatible Provider Base
Providers using OpenAI-compatible APIs SHALL extend a shared base class.

#### Scenario: Shared error handling
- **WHEN** OpenAI-compatible provider encounters API error
- **THEN** Base class SHALL map HTTP status to ProviderError
- **AND** 429 SHALL trigger rate limit handling
- **AND** 401 SHALL indicate invalid API key

#### Scenario: Message conversion
- **WHEN** Provider receives ChatMessage array
- **THEN** Base class SHALL convert to provider-specific format
- **AND** Tool definitions SHALL be converted correctly

### Requirement: Provider Registry
The system SHALL support a registry for managing multiple providers.

#### Scenario: Provider registration
- **WHEN** Provider is registered with name and factory
- **THEN** Registry SHALL store provider specification

#### Scenario: Provider lookup by model name
- **WHEN** Model name contains provider prefix (e.g., "openai/gpt-4")
- **THEN** Registry SHALL parse and return matching provider

#### Scenario: Default provider
- **WHEN** No specific provider requested
- **THEN** Registry SHALL return default configured provider
