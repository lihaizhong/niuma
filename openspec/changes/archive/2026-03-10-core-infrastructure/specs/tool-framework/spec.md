## ADDED Requirements

### Requirement: Tool abstract base class

The system SHALL provide a BaseTool abstract class for tool implementation.

#### Scenario: BaseTool defines tool interface
- **WHEN** implementing a new tool
- **THEN** it SHALL extend BaseTool and implement name, description, parameters, execute()

#### Scenario: BaseTool validates arguments
- **WHEN** tool is executed with arguments
- **THEN** arguments SHALL be validated against the zod parameters schema

#### Scenario: BaseTool provides helper methods
- **WHEN** tool execution completes
- **THEN** success() or failure() methods SHALL create proper ToolExecutionResult

### Requirement: Tool registry for tool management

The system SHALL provide a ToolRegistry for registering and executing tools.

#### Scenario: Register tools
- **WHEN** a tool is registered
- **THEN** it SHALL be available for execution by name

#### Scenario: Execute tool calls
- **WHEN** LLM returns tool calls
- **THEN** ToolRegistry.execute() SHALL execute each tool and return ToolResult

#### Scenario: Generate OpenAI-compatible schemas
- **WHEN** generating tool definitions for LLM
- **THEN** generateOpenAISchema() SHALL produce valid OpenAI function calling schema

#### Scenario: Generate Anthropic-compatible schemas
- **WHEN** generating tool definitions for Claude
- **THEN** generateAnthropicSchema() SHALL produce valid Anthropic tool schema

### Requirement: SimpleTool for function-based tools

The system SHALL provide SimpleTool class for defining tools with functions.

#### Scenario: Create tool from function
- **WHEN** using SimpleTool
- **THEN** a tool SHALL be created from name, description, parameters schema, and handler function

### Requirement: Dangerous tool marking

The system SHALL support marking tools as dangerous.

#### Scenario: Mark tool as dangerous
- **WHEN** a tool has dangerous: true
- **THEN** ToolRegistry.getDangerousTools() SHALL include it
