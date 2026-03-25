## Test Strategy

测试 DeepAgent LLM 相关类型的定义和导出。

## Test Cases

### Normal Cases

#### TC-001: ChatRole type accepts valid values
- **Input**: Assign "system", "user", "assistant", "tool" to ChatRole
- **Expected**: All values are valid

#### TC-002: ChatMessage with string content
- **Input**: Create ChatMessage with role: "user", content: "hello"
- **Expected**: Type accepts string content

#### TC-003: ChatMessage with multi-part content
- **Input**: Create ChatMessage with content: [{ type: "text", text: "hello" }]
- **Expected**: Type accepts MessageContentPart array

#### TC-004: LLMResponse with tool calls
- **Input**: Create LLMResponse with hasToolCalls: true, toolCalls: [...]
- **Expected**: Type accepts tool calls

#### TC-005: LLMProvider interface can be implemented
- **Input**: Create a mock provider implementing LLMProvider
- **Expected**: TypeScript accepts the implementation

#### TC-006: ChatOptions accepts messages and tools
- **Input**: Create ChatOptions with messages and tools
- **Expected**: Type accepts both required and optional properties

### Boundary Cases

#### TC-007: ChatMessage with optional properties omitted
- **Input**: Create ChatMessage with only role and content
- **Expected**: Type accepts minimal message

#### TC-008: LLMResponse with only required properties
- **Input**: Create LLMResponse with only content and hasToolCalls
- **Expected**: Type accepts minimal response

### Error Cases

#### TC-009: ChatRole with invalid value
- **Input**: Try to assign "invalid" to ChatRole
- **Expected**: TypeScript compilation error

#### TC-010: ChatMessage missing required role
- **Input**: Try to create ChatMessage without role
- **Expected**: TypeScript compilation error

## Acceptance Criteria

- [ ] All types compile without errors
- [ ] All types are exported from deepagent/types/llm
- [ ] ChatRole union type works correctly
- [ ] Optional properties are properly marked

## Coverage Target

- 100% type coverage
- All union types tested
- All optional properties verified
