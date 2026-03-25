## Purpose

定义 Docker 沙箱执行环境的核心行为规范。

## ADDED Requirements

### Requirement: Sandbox Manager

The SandboxManager SHALL manage Docker container lifecycle including create, execute, and destroy operations.

```typescript
interface SandboxConfig {
  image: string;
  cpuLimit?: number;
  memoryLimit?: string;
  networkIsolation: boolean;
  timeout: number;
}
```

#### Scenario: Create sandbox container
- **WHEN** user requests sandbox execution for a command
- **THEN** SandboxManager SHALL create a new container from configured image
- **AND** SHALL allocate resources according to config
- **AND** SHALL return container ID for subsequent operations

#### Scenario: Execute command in sandbox
- **WHEN** user provides a command to execute
- **THEN** SandboxManager SHALL run command in allocated container
- **AND** SHALL return stdout, stderr, and exit code
- **AND** SHALL enforce resource limits

#### Scenario: Destroy sandbox container
- **WHEN** task completes or timeout expires
- **THEN** SandboxManager SHALL stop and remove the container
- **AND** SHALL clean up all associated resources

### Requirement: Tool Interceptor

The SandboxManager SHALL intercept tool calls and route them to sandbox execution.

#### Scenario: Intercept exec tool call
- **WHEN** agent calls `exec` tool with `mode: "sandbox"`
- **THEN** SandboxManager SHALL intercept the call
- **AND** SHALL execute command in Docker container
- **AND** SHALL return sandbox execution result

#### Scenario: Fallback to direct execution
- **WHEN** sandbox is disabled or Docker unavailable
- **THEN** SandboxManager SHALL fallback to direct execution
- **AND** SHALL log warning for security audit

### Requirement: Resource Limits

The sandbox SHALL enforce configurable resource limits.

```typescript
interface ResourceLimits {
  cpuLimit: number;      // CPU cores
  memoryLimit: string;   // e.g., "512m", "2g"
  timeout: number;        // milliseconds
  maxOutputSize: number; // bytes
}
```

#### Scenario: Enforce CPU limit
- **WHEN** command exceeds CPU limit
- **THEN** sandbox SHALL terminate execution
- **AND** SHALL return error with CPU limit exceeded message

#### Scenario: Enforce memory limit
- **WHEN** command exceeds memory limit
- **THEN** sandbox SHALL terminate execution
- **AND** SHALL return error with memory limit exceeded message

#### Scenario: Enforce timeout
- **WHEN** command execution exceeds timeout
- **THEN** sandbox SHALL terminate execution
- **AND** SHALL return error with timeout message

### Requirement: Network Isolation

The sandbox SHALL provide optional network isolation.

#### Scenario: Isolated network
- **WHEN** `networkIsolation: true` is configured
- **THEN** container SHALL have no external network access
- **AND** SHALL only allow internal communication

#### Scenario: Permitted network
- **WHEN** `networkIsolation: false` is configured
- **THEN** container SHALL have full network access
- **AND** SHALL be logged for audit

## Dependencies

- Requires: `tool-framework` for tool registration
- Extends: `shell-tool` for exec behavior
