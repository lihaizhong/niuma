## Purpose

定义 Human-in-the-Loop 审批机制的核心行为规范。

## ADDED Requirements

### Requirement: Sensitive Operation Detection

The HumanInTheLoop SHALL detect and pause sensitive operations.

```typescript
interface SensitiveOperation {
  type: "file_delete" | "network_request" | "db_write" | "deploy" | "env_change";
  target: string;
  severity: "low" | "medium" | "high" | "critical";
}

interface ApprovalConfig {
  sensitivePatterns: RegExp[];
  timeout: number;
  autoApproveBelowSeverity: string;
}
```

#### Scenario: Detect sensitive operation
- **WHEN** agent calls sensitive operation
- **THEN** system SHALL pause execution
- **AND** SHALL emit approval request event
- **AND** SHALL wait for human response

#### Scenario: Auto approve low severity
- **WHEN** operation severity is below threshold
- **THEN** system SHALL auto-approve
- **AND** SHALL log approval for audit

### Requirement: Approval Request

The HumanInTheLoop SHALL provide clear approval interface.

```typescript
interface ApprovalRequest {
  id: string;
  operation: SensitiveOperation;
  context: string;
  requestedAt: string;
  timeout: number;
}

interface ApprovalResponse {
  requestId: string;
  approved: boolean;
  comment?: string;
  respondedAt: string;
}
```

#### Scenario: Request human approval
- **WHEN** sensitive operation detected
- **THEN** system SHALL create approval request
- **AND** SHALL display operation details to human
- **AND** SHALL wait for approve/deny response

#### Scenario: Approval timeout
- **WHEN** human does not respond within timeout
- **THEN** system SHALL deny operation
- **AND** SHALL notify agent of timeout
- **AND** SHALL log timeout event

### Requirement: Approval Channels

The HumanInTheLoop SHALL support multiple approval channels.

#### Scenario: CLI approval
- **WHEN** using CLI channel
- **THEN** system SHALL prompt in terminal
- **AND** SHALL accept y/n input

#### Scenario: Channel-specific approval
- **WHEN** using Telegram/Discord
- **THEN** system SHALL send approval message
- **AND** SHALL accept inline keyboard response

### Requirement: Audit Logging

The HumanInTheLoop SHALL log all approval decisions.

```typescript
interface ApprovalLog {
  requestId: string;
  operation: SensitiveOperation;
  decision: "approved" | "denied" | "timeout";
  approver?: string;
  timestamp: string;
}
```

#### Scenario: Log approval decision
- **WHEN** human responds to approval request
- **THEN** system SHALL log decision
- **AND** SHALL store in approval audit file
- **AND** SHALL retain for compliance

## Dependencies

- Requires: `tool-framework` for operation interception
- Uses: `event-bus` for approval events
