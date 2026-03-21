## Purpose

定义任务进度追踪的核心行为规范。

## ADDED Requirements

### Requirement: Task Tracker

The TaskTracker SHALL manage persistent task state via PROGRESS.json file.

```typescript
interface Task {
  id: string;
  name: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
}

interface ProgressState {
  project: string;
  tasks: Task[];
  current: number;
  completed: string[];
}
```

#### Scenario: Create new task
- **WHEN** agent starts a new task
- **THEN** TaskTracker SHALL create task entry in PROGRESS.json
- **AND** SHALL set status to "pending"
- **AND** SHALL assign unique ID

#### Scenario: Update task status
- **WHEN** agent updates task progress
- **THEN** TaskTracker SHALL update status in PROGRESS.json
- **AND** SHALL update timestamp

#### Scenario: Complete task
- **WHEN** agent marks task as completed
- **THEN** TaskTracker SHALL move task ID to completed array
- **AND** SHALL set status to "completed"
- **AND** SHALL advance current pointer

### Requirement: Resume from checkpoint

The TaskTracker SHALL support resuming from last checkpoint.

#### Scenario: Resume pending task
- **WHEN** agent restarts and finds incomplete tasks
- **THEN** TaskTracker SHALL provide next pending task
- **AND** SHALL restore task context from PROGRESS.json

#### Scenario: No tasks remaining
- **WHEN** all tasks are completed
- **THEN** TaskTracker SHALL return null
- **AND** SHALL emit "TASKS_COMPLETE" event

### Requirement: Atomic writes

The TaskTracker SHALL use atomic file writes to prevent data corruption.

#### Scenario: Atomic update
- **WHEN** updating PROGRESS.json
- **THEN** TaskTracker SHALL write to temp file first
- **AND** SHALL rename to target file
- **AND** SHALL handle concurrent access safely

## Dependencies

- Requires: `filesystem-tools` for file operations
- Used by: `ralph-loops` for checkpoint management
