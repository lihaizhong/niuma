## ADDED Requirements

### Requirement: Modular type definitions structure

The system SHALL organize core types into separate files by domain with unified exports.

#### Scenario: Types are organized by domain
- **WHEN** defining core types
- **THEN** types SHALL be split into files: message.ts, tool.ts, llm.ts, events.ts, error.ts under niuma/types/

#### Scenario: Unified exports via index
- **WHEN** importing types from outside
- **THEN** all types SHALL be available from `niuma/types` via index.ts re-exports

### Requirement: Message type definitions

The system SHALL define message types for channel communication.

#### Scenario: InboundMessage defines incoming message structure
- **WHEN** a message is received from any channel
- **THEN** it SHALL conform to the InboundMessage interface with fields: channel, senderId, chatId, content, media, metadata, sessionKey

#### Scenario: OutboundMessage defines outgoing message structure
- **WHEN** sending a message to any channel
- **THEN** it SHALL conform to the OutboundMessage interface with fields: channel, chatId, content, metadata, media, replyTo

#### Scenario: ToolCall defines tool invocation request
- **WHEN** LLM requests a tool execution
- **THEN** it SHALL have id, name, and arguments fields

#### Scenario: LLMResponse defines LLM output structure
- **WHEN** LLM returns a response
- **THEN** it SHALL have content, toolCalls, hasToolCalls, and optional reasoningContent, usage fields

### Requirement: Error types for domain errors

The system SHALL define custom error classes for different error domains.

#### Scenario: NiumaError is base error class
- **WHEN** an error occurs in the system
- **THEN** it SHALL extend NiumaError with code and details fields

#### Scenario: ToolExecutionError for tool failures
- **WHEN** a tool execution fails
- **THEN** a ToolExecutionError SHALL be thrown with toolName and message

#### Scenario: ConfigError for configuration issues
- **WHEN** configuration is invalid
- **THEN** a ConfigError SHALL be thrown with descriptive message
