## Purpose

定义 DeepAgent 核心类型系统，包括 AgentState、AgentContext、AgentConfig 和 HarnessComponents。这些类型是 DeepAgent 架构的基础，为 Agent 循环和 Harness 组件提供类型契约。

## ADDED Requirements

### Requirement: AgentState type definition
The system SHALL provide an AgentState interface that tracks the current state of an agent execution.

#### Scenario: AgentState structure
- **WHEN** importing AgentState from deepagent/core/types
- **THEN** it SHALL have the following properties:
  - `messages: ChatMessage[]` - array of conversation messages
  - `iteration: number` - current iteration count
  - `halted: boolean` - whether the agent has halted

### Requirement: AgentContext type definition
The system SHALL provide an AgentContext interface that holds dependencies required for agent execution.

#### Scenario: AgentContext structure
- **WHEN** importing AgentContext from deepagent/core/types
- **THEN** it SHALL have the following properties:
  - `provider: LLMProvider` - LLM provider instance
  - `tools: ToolRegistry` - tool registry instance
  - `maxIterations: number` - maximum allowed iterations

### Requirement: AgentConfig type definition
The system SHALL provide an AgentConfig interface for agent configuration.

#### Scenario: AgentConfig structure
- **WHEN** importing AgentConfig from deepagent/core/types
- **THEN** it SHALL have the following properties:
  - `maxIterations?: number` - optional maximum iterations (default: 10)
  - `temperature?: number` - optional temperature for LLM (default: 0.7)
  - `maxTokens?: number` - optional max tokens for LLM (default: 4096)

### Requirement: HarnessComponents type definition
The system SHALL provide a HarnessComponents interface that groups all harness dependencies.

#### Scenario: HarnessComponents structure
- **WHEN** importing HarnessComponents from deepagent/core/types
- **THEN** it SHALL have the following properties:
  - `provider: LLMProvider` - LLM provider instance
  - `tools: ToolRegistry` - tool registry instance
  - `sessions: SessionManager` - session manager instance
  - `bus: EventBus` - event bus instance

### Requirement: AgentResult type definition
The system SHALL provide an AgentResult interface for agent execution results.

#### Scenario: AgentResult structure
- **WHEN** importing AgentResult from deepagent/core/types
- **THEN** it SHALL have the following properties:
  - `content: string` - the final response content
  - `iterations: number` - number of iterations executed
  - `toolCalls: number` - number of tool calls made

### Requirement: AgentError type definition
The system SHALL provide an AgentError class for agent-specific errors.

#### Scenario: AgentError structure
- **WHEN** importing AgentError from deepagent/core/types
- **THEN** it SHALL extend Error with:
  - `code: string` - error code for categorization
  - `details?: Record<string, unknown>` - additional error details

## Dependencies

- deepagent-llm-types (for ChatMessage, LLMProvider)
- deepagent-tool-types (for ToolRegistry)
