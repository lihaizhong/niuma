## Purpose

定义自验证循环的核心行为规范。

## ADDED Requirements

### Requirement: Verification Loop

The SelfVerification SHALL verify task results via test execution.

```typescript
interface VerificationConfig {
  maxRetries: number;
  testCommand: string;
  successExitCodes: number[];
  timeout: number;
}

interface VerificationResult {
  passed: boolean;
  errors?: string[];
  output: string;
}
```

#### Scenario: Verify successful task
- **WHEN** agent completes task execution
- **THEN** SelfVerification SHALL run configured test command
- **AND** SHALL capture test output
- **AND** SHALL return passed=true if exit code in success codes

#### Scenario: Verification failure with retry
- **WHEN** verification fails
- **THEN** SelfVerification SHALL inject error into agent context
- **AND** SHALL increment retry counter
- **AND** SHALL request agent to fix issues

#### Scenario: Max retries exceeded
- **WHEN** retry count exceeds maxRetries
- **THEN** SelfVerification SHALL stop retrying
- **AND** SHALL mark task as failed
- **AND** SHALL emit failure event

### Requirement: Test Integration

The SelfVerification SHALL support custom test commands.

#### Scenario: Custom test command
- **WHEN** task specifies `testCommand: "npm test -- --coverage"`
- **THEN** SelfVerification SHALL execute that command
- **AND** SHALL parse coverage output

#### Scenario: No test command
- **WHEN** task has no testCommand configured
- **THEN** SelfVerification SHALL skip verification
- **AND** SHALL mark task as successful

### Requirement: Error Injection

The SelfVerification SHALL provide actionable error feedback.

```typescript
interface ErrorInjection {
  originalError: string;
  testOutput: string;
  suggestion?: string;
}
```

#### Scenario: Inject actionable error
- **WHEN** verification fails
- **THEN** system SHALL format error with test output
- **AND** SHALL include file/line if available
- **AND** SHALL inject into agent context for fixing

## Dependencies

- Requires: `sandbox-environment` for test execution
- Requires: `task-progress-tracker` for task state
- Used by: `ralph-loops` for verification integration
