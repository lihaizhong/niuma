## Purpose

定义 Ralph Loops 长周期任务持续工作循环的核心行为规范。

## ADDED Requirements

### Requirement: Ralph Loop Engine

The RalphLoops SHALL implement persistent task execution loop.

```typescript
interface RalphLoopConfig {
  maxIterations: number;
  idleTimeout: number;
  checkpointInterval: number;
  preserveGoal: boolean;
}
```

#### Scenario: Continue until complete
- **WHEN** agent attempts to exit before task completion
- **THEN** RalphLoops SHALL intercept exit attempt
- **AND** SHALL re-inject original goal into fresh context
- **AND** SHALL continue execution

#### Scenario: Save checkpoint
- **WHEN** checkpoint interval reached
- **THEN** RalphLoops SHALL save current state
- **AND** SHALL persist progress to PROGRESS.json
- **AND** SHALL log checkpoint event

#### Scenario: Resume from checkpoint
- **WHEN** RalphLoops restarts
- **THEN** system SHALL load checkpoint state
- **AND** SHALL restore agent context
- **AND** SHALL continue from last checkpoint

### Requirement: Exit Detection

The RalphLoops SHALL detect premature exit attempts.

#### Scenario: Detect completion claim
- **WHEN** agent responds with completion message
- **THEN** RalphLoops SHALL verify against task requirements
- **AND** SHALL run verification tests
- **AND** SHALL reject if verification fails

#### Scenario: Detect idle loop
- **WHEN** agent repeats similar actions without progress
- **THEN** RalphLoops SHALL detect stagnation
- **AND** SHALL inject hint to try alternative approach

### Requirement: Goal Preservation

The RalphLoops SHALL preserve original goal across iterations.

```typescript
interface GoalState {
  originalGoal: string;
  contextSummary: string;
  completedSteps: string[];
  pendingSteps: string[];
  lastCheckpoint: string;
}
```

#### Scenario: Preserve goal in context
- **WHEN** rebuilding context
- **THEN** RalphLoops SHALL inject goal at start
- **AND** SHALL include completed steps summary
- **AND** SHALL include pending steps list

#### Scenario: Fresh context injection
- **WHEN** context needs rebuild
- **THEN** RalphLoops SHALL create fresh context
- **AND** SHALL inject goal + progress
- **AND** SHALL minimize old history

## Dependencies

- Requires: `task-progress-tracker` for state persistence
- Requires: `self-verification-loop` for completion verification
- Requires: `context-compaction` for context management
- Uses: `agents-md-rules` for failure handling
