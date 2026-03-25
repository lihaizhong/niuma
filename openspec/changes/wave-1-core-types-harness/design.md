## Context

Niuma is being rewritten using the DeepAgent pattern to create a more modular agent architecture. The existing `niuma/types/` directory contains comprehensive type definitions that support a full-featured multi-channel agent system. For the DeepAgent rewrite, we need to extract and simplify these types to create a focused foundation that supports the core agent loop without the complexity of multi-channel support, event bus, and other advanced features.

Current type system in `niuma/types/`:
- `llm.ts` - LLM provider types, ChatMessage, LLMResponse
- `tool.ts` - ToolDefinition, ToolCall, ToolParameterSchema
- `message.ts` - ChannelType, InboundMessage, OutboundMessage
- `events.ts` - EventType, EventMap, EventPayload
- `error.ts` - NiumaError and subclasses

## Goals / Non-Goals

**Goals:**
- Create simplified type definitions in `deepagent/types/` directory
- Define core DeepAgent types: AgentState, AgentContext, AgentConfig, HarnessComponents
- Extract essential LLM types: ChatMessage, LLMResponse, LLMProvider interface
- Extract essential Tool types: ToolDefinition, ToolCall, ToolRegistry interface
- Ensure all types compile without errors
- Follow existing niuma conventions (Chinese comments, English identifiers)

**Non-Goals:**
- No multi-channel message types (ChannelType, InboundMessage, OutboundMessage)
- No event system types (EventType, EventMap)
- No implementation of actual agent logic
- No changes to existing niuma/ code
- No runtime behavior changes

## Decisions

### Decision 1: Directory Structure
**Choice**: Create `deepagent/types/` for shared types and `deepagent/core/types.ts` for DeepAgent-specific types
**Rationale**: Separates core agent types from general utility types, following the pattern in `niuma/types/`
**Alternative**: Single types file - rejected for maintainability

### Decision 2: Type Simplification Strategy
**Choice**: Extract minimal types needed for agent loop, remove channel/event complexity
**Rationale**: DeepAgent focuses on core agent loop, not multi-channel distribution
**Example**: Keep `ChatMessage` but remove `ChannelType`, `InboundMessage`, `OutboundMessage`

### Decision 3: Interface vs Type
**Choice**: Use interfaces for object types that will be implemented (LLMProvider, ToolRegistry)
**Rationale**: Interfaces support declaration merging and better error messages
**Example**: `interface LLMProvider { ... }` instead of `type LLMProvider = { ... }`

### Decision 4: Re-export Pattern
**Choice**: Create `deepagent/types/index.ts` that re-exports all types
**Rationale**: Provides clean public API, follows niuma/types/index.ts pattern
**Example**: `export type { AgentState } from './core';`

### Decision 5: Naming Conventions
**Choice**: Keep existing niuma naming (ChatMessage, ToolCall) for consistency
**Rationale**: Easier migration path, familiar to existing developers
**Exception**: New DeepAgent-specific types use Agent prefix (AgentState, AgentContext)

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Type duplication between niuma/ and deepagent/ | Document relationship, plan consolidation in future |
| Missing types discovered during Wave 2 | Design allows adding new types without breaking changes |
| Over-simplification limits future features | Core types are extensible via interfaces |
| Inconsistent with existing patterns | Follow niuma conventions strictly |

## Architecture

```
deepagent/
├── types/
│   ├── index.ts          # 统一导出所有类型
│   ├── llm.ts            # LLM 相关类型
│   ├── tool.ts           # 工具相关类型
│   └── message.ts        # 消息相关类型（简化版）
└── core/
    └── types.ts          # DeepAgent 核心类型
```

### Type Relationships

```typescript
// Core Agent Types
AgentState
├── messages: ChatMessage[]
├── iteration: number
└── halted: boolean

AgentContext
├── provider: LLMProvider
├── tools: ToolRegistry
└── maxIterations: number

HarnessComponents
├── provider: LLMProvider
├── tools: ToolRegistry
├── sessions: SessionManager
└── bus: EventBus

// LLM Types
LLMProvider
├── chat(options: ChatOptions): Promise<LLMResponse>
└── getDefaultModel(): string

ChatMessage
├── role: ChatRole
├── content: string | MessageContentPart[]
└── toolCalls?: ToolCall[]

LLMResponse
├── content: string
├── toolCalls?: ToolCall[]
└── hasToolCalls: boolean

// Tool Types
ToolRegistry
├── register(tool: ITool): void
├── getDefinitions(): ToolDefinition[]
└── execute(name: string, args: Record<string, unknown>): Promise<string>

ToolDefinition
├── name: string
├── description: string
└── parameters: ToolParameterSchema

ToolCall
├── id: string
├── name: string
└── arguments: Record<string, unknown>
```

## File Structure

### deepagent/types/llm.ts
- ChatRole type
- MessageContentPart interface
- ChatMessage interface
- LLMResponse interface
- LLMUsage interface
- ChatOptions interface
- LLMProvider interface

### deepagent/types/tool.ts
- ToolParameterSchema interface
- ToolDefinition interface
- ToolCall interface
- ITool interface
- ToolRegistry interface

### deepagent/types/message.ts
- Simplified message types for agent communication
- Remove channel-specific types

### deepagent/types/index.ts
- Re-export all types from sub-modules

### deepagent/core/types.ts
- AgentConfig interface
- AgentState interface
- AgentContext interface
- HarnessComponents interface
- AgentResult interface
- AgentError interface

## Migration Plan

No migration needed - this is a new module. Existing niuma/ code remains unchanged.

## Open Questions

None - requirements are clear from user specification.
