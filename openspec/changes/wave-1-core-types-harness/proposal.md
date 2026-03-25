## Why

Niuma is being rewritten using the DeepAgent pattern to create a more modular, testable, and maintainable agent architecture. Before implementing the core agent loop and harness components, we need to establish a solid type foundation that defines the contracts between all components. This Wave 1 establishes the type system that will serve as the foundation for all subsequent DeepAgent modules.

## What Changes

- Create `deepagent/types/` directory with simplified type definitions
- Create `deepagent/core/types.ts` with DeepAgent-specific types
- Extract and simplify types from existing `niuma/types/` for DeepAgent use
- Establish type contracts for AgentState, AgentContext, and HarnessComponents
- Ensure all types are properly exported and documented

## Capabilities

### New Capabilities
- `deepagent-core-types`: Core type definitions for DeepAgent including AgentState, AgentContext, AgentConfig, and HarnessComponents
- `deepagent-llm-types`: LLM-related types including ChatMessage, LLMResponse, and Provider interfaces
- `deepagent-tool-types`: Tool-related types including ToolDefinition, ToolCall, and ToolRegistry interfaces
- `deepagent-message-types`: Message types for agent communication

### Modified Capabilities
- None (this is a new module, no existing capabilities are modified)

## Impact

- New directory: `deepagent/types/` and `deepagent/core/`
- No breaking changes to existing `niuma/` code
- Types are additive and will be consumed by future DeepAgent implementations
- Establishes foundation for Wave 2 (Agent Loop) and Wave 3 (Harness Components)

## Non-Goals

- No implementation of actual agent logic (Wave 2)
- No harness component implementations (Wave 3)
- No changes to existing niuma/agent/ code
- No runtime behavior changes

## Acceptance Criteria

- [ ] All type files compile without errors
- [ ] All types are exported from `deepagent/types/index.ts`
- [ ] Type definitions follow existing niuma conventions
- [ ] Documentation comments are in Chinese, identifiers in English
- [ ] Types are simplified where possible from existing niuma/types
