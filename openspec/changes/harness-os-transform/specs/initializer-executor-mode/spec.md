## Purpose

定义 Initializer-Executor 架构模式的核心行为规范。

## ADDED Requirements

### Requirement: Initializer Mode

The InitializerExecutor SHALL support one-time project initialization.

```typescript
interface InitializerConfig {
  projectSpec: string;
  structure: string[];
  initialFiles: Record<string, string>;
  initCommands: string[];
}
```

#### Scenario: Initialize project structure
- **WHEN** user provides project specification
- **THEN** Initializer SHALL create directory structure
- **AND** SHALL generate initial files
- **AND** SHALL run initialization commands

#### Scenario: Create AGENTS.md
- **WHEN** initializing project
- **THEN** Initializer SHALL create AGENTS.md
- **AND** SHALL include project-specific rules
- **AND** SHALL include tool guidelines

#### Scenario: Initialize version control
- **WHEN** initializing project
- **THEN** Initializer SHALL run `git init`
- **AND** SHALL create initial commit
- **AND** SHALL setup .gitignore

### Requirement: Executor Mode

The InitializerExecutor SHALL support incremental task execution.

```typescript
interface ExecutorConfig {
  projectRoot: string;
  verificationEnabled: boolean;
}
```

#### Scenario: Load next pending task
- **WHEN** Executor starts
- **THEN** system SHALL read PROGRESS.json
- **AND** SHALL find next pending task
- **AND** SHALL load task context

#### Scenario: Execute single task
- **WHEN** task loaded
- **THEN** Executor SHALL run Ralph loop
- **AND** SHALL verify completion
- **AND** SHALL update progress

#### Scenario: Commit after completion
- **WHEN** task verification passes
- **THEN** Executor SHALL commit changes
- **AND** SHALL update PROGRESS.json
- **AND** SHALL mark task as completed

### Requirement: Mode Switching

The InitializerExecutor SHALL support runtime mode switching.

#### Scenario: Switch from executor to initializer
- **WHEN** new feature required during execution
- **THEN** Executor SHALL pause current task
- **AND** SHALL run Initializer for new structure
- **AND** SHALL resume Executor

#### Scenario: Batch execution mode
- **WHEN** user requests multiple tasks
- **THEN** Executor SHALL queue tasks
- **AND** SHALL execute sequentially
- **AND** SHALL report batch completion

## Dependencies

- Requires: `ralph-loops` for task execution
- Requires: `task-progress-tracker` for task management
- Requires: `self-verification-loop` for verification
- Uses: `filesystem-tools` for project structure
