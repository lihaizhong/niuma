## Purpose

定义 DeepAgent 工具相关类型，包括 ToolDefinition、ToolCall、ToolRegistry 等。这些类型提供工具注册、调用和管理的类型契约。

## ADDED Requirements

### Requirement: ToolParameterSchema interface
The system SHALL provide a ToolParameterSchema interface for tool parameter definitions.

#### Scenario: ToolParameterSchema structure
- **WHEN** importing ToolParameterSchema from deepagent/types/tool
- **THEN** it SHALL support JSON Schema-like properties:
  - `type?: string` - parameter type (string, number, boolean, object, array)
  - `description?: string` - parameter description
  - `enum?: string[]` - allowed values (optional)
  - `properties?: Record<string, ToolParameterSchema>` - nested properties (for objects)
  - `required?: string[]` - required property names (for objects)
  - `items?: ToolParameterSchema` - item schema (for arrays)

### Requirement: ToolDefinition interface
The system SHALL provide a ToolDefinition interface for tool metadata.

#### Scenario: ToolDefinition structure
- **WHEN** importing ToolDefinition from deepagent/types/tool
- **THEN** it SHALL have:
  - `name: string` - tool name
  - `description: string` - tool description
  - `parameters: ToolParameterSchema` - parameter schema

### Requirement: ToolCall interface
The system SHALL provide a ToolCall interface for LLM tool invocations.

#### Scenario: ToolCall structure
- **WHEN** importing ToolCall from deepagent/types/tool
- **THEN** it SHALL have:
  - `id: string` - unique call identifier
  - `name: string` - tool name to execute
  - `arguments: Record<string, unknown>` - tool arguments

### Requirement: ITool interface
The system SHALL provide an ITool interface for tool implementations.

#### Scenario: ITool structure
- **WHEN** importing ITool from deepagent/types/tool
- **THEN** it SHALL have:
  - `readonly name: string` - tool name
  - `readonly description: string` - tool description
  - `readonly parameters: z.ZodType<unknown>` - Zod schema for validation
  - `getDefinition(): ToolDefinition` - get tool definition
  - `validateArgs(args: unknown): unknown` - validate arguments
  - `execute(args: unknown): Promise<string>` - execute tool

### Requirement: ToolRegistry interface
The system SHALL provide a ToolRegistry interface for tool management.

#### Scenario: ToolRegistry structure
- **WHEN** importing ToolRegistry from deepagent/types/tool
- **THEN** it SHALL have:
  - `register(tool: ITool): void` - register a tool
  - `unregister(name: string): void` - unregister a tool
  - `get(name: string): ITool | undefined` - get tool by name
  - `has(name: string): boolean` - check if tool exists
  - `getDefinitions(): ToolDefinition[]` - get all tool definitions
  - `execute(name: string, args: Record<string, unknown>): Promise<string>` - execute tool

## Dependencies

- zod (for ZodType in ITool)
