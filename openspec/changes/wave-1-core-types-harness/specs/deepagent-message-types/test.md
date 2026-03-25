## Test Strategy

测试 DeepAgent 消息相关类型的定义和导出。

## Test Cases

### Normal Cases

#### TC-001: MediaContent interface exists and has correct structure
- **Input**: Import MediaContent from deepagent/types/message
- **Expected**: MediaContent has type, url, data, mimeType, filename, size properties

#### TC-002: SessionMessage interface exists and has correct structure
- **Input**: Import SessionMessage from deepagent/types/message
- **Expected**: SessionMessage has role, content, timestamp, toolsUsed properties

#### TC-003: Session interface exists and has correct structure
- **Input**: Import Session from deepagent/types/message
- **Expected**: Session has key, messages, createdAt, updatedAt, metadata properties

#### TC-004: SessionManager interface can be implemented
- **Input**: Create a mock session manager implementing SessionManager
- **Expected**: TypeScript accepts the implementation

#### TC-005: MediaContent with all properties
- **Input**: Create MediaContent with type, url, mimeType, filename
- **Expected**: Type accepts all properties

### Boundary Cases

#### TC-006: SessionMessage with optional toolsUsed omitted
- **Input**: Create SessionMessage without toolsUsed
- **Expected**: Type accepts message without optional property

#### TC-007: Session with minimal properties
- **Input**: Create Session with only required properties
- **Expected**: Type accepts minimal session

### Error Cases

#### TC-008: SessionMessage with invalid role
- **Input**: Try to assign invalid role to SessionMessage
- **Expected**: TypeScript compilation error

#### TC-009: Session missing required key
- **Input**: Try to create Session without key
- **Expected**: TypeScript compilation error

## Acceptance Criteria

- [ ] All interfaces compile without errors
- [ ] All types are exported from deepagent/types/message
- [ ] SessionManager interface is implementable
- [ ] MediaContent union type works correctly

## Coverage Target

- 100% type coverage
- All interface methods verified
- All property types checked
