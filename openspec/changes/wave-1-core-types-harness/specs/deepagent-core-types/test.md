## Test Strategy

测试 DeepAgent 核心类型的定义和导出。

## Test Cases

### Normal Cases

#### TC-001: AgentState interface exists and has correct structure
- **Input**: Import AgentState from deepagent/core/types
- **Expected**: AgentState has messages, iteration, halted properties with correct types

#### TC-002: AgentContext interface exists and has correct structure
- **Input**: Import AgentContext from deepagent/core/types
- **Expected**: AgentContext has provider, tools, maxIterations properties

#### TC-003: AgentConfig interface exists with optional properties
- **Input**: Import AgentConfig from deepagent/core/types
- **Expected**: All properties are optional with sensible defaults

#### TC-004: HarnessComponents interface exists and has correct structure
- **Input**: Import HarnessComponents from deepagent/core/types
- **Expected**: HarnessComponents has provider, tools, sessions, bus properties

#### TC-005: AgentResult interface exists and has correct structure
- **Input**: Import AgentResult from deepagent/core/types
- **Expected**: AgentResult has content, iterations, toolCalls properties

#### TC-006: AgentError class exists and extends Error
- **Input**: Import AgentError from deepagent/core/types
- **Expected**: AgentError extends Error with code and details properties

### Boundary Cases

#### TC-007: AgentState with empty messages array
- **Input**: Create AgentState with messages: []
- **Expected**: Type allows empty array

#### TC-008: AgentConfig with only partial properties
- **Input**: Create AgentConfig with only maxIterations
- **Expected**: Type allows partial configuration

### Error Cases

#### TC-009: AgentState missing required properties
- **Input**: Try to create AgentState without iteration
- **Expected**: TypeScript compilation error

#### TC-010: AgentContext with wrong provider type
- **Input**: Try to assign invalid provider to AgentContext
- **Expected**: TypeScript compilation error

## Acceptance Criteria

- [ ] All interfaces compile without errors
- [ ] All types are exported from deepagent/core/types
- [ ] TypeScript strict mode passes
- [ ] No any types used

## Coverage Target

- 100% type coverage (all interfaces have corresponding type tests)
- All properties have type assertions
