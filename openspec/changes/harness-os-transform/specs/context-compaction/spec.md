## Purpose

定义上下文压缩机制的核心行为规范。

## ADDED Requirements

### Requirement: Context Monitoring

The ContextCompaction SHALL monitor context window usage.

```typescript
interface CompactionConfig {
  threshold: number;        // 0.0 - 1.0, when to trigger compaction
  reserveTokens: number;    // tokens to reserve in window
  maxHistoryRounds: number; // keep last N conversation rounds
}
```

#### Scenario: Monitor context usage
- **WHEN** agent loop executes
- **THEN** system SHALL count total tokens in context
- **AND** SHALL compare against threshold
- **AND** SHALL trigger compaction if exceeded

#### Scenario: Threshold not reached
- **WHEN** context tokens below threshold
- **THEN** system SHALL continue normal operation
- **AND** SHALL skip compaction

### Requirement: History Compaction

The ContextCompaction SHALL compress conversation history.

```typescript
interface CompactionResult {
  originalTokens: number;
  compactedTokens: number;
  preservedRounds: number;
  summary: string;
}
```

#### Scenario: Compress old history
- **WHEN** threshold exceeded
- **THEN** system SHALL summarize early conversation rounds
- **AND** SHALL preserve recent N rounds intact
- **AND** SHALL inject summary as context prefix

#### Scenario: Preserve key decisions
- **WHEN** compacting history
- **THEN** system SHALL identify key decisions
- **AND** SHALL preserve them verbatim
- **AND** SHALL compress routine exchanges

### Requirement: Tool Output Offloading

The ContextCompaction SHALL offload large tool outputs to files.

```typescript
interface OffloadConfig {
  maxOutputTokens: number;
  offloadDir: string;
}
```

#### Scenario: Offload large output
- **WHEN** tool output exceeds maxOutputTokens
- **THEN** system SHALL write to file
- **AND** SHALL replace output with reference
- **AND** SHALL inject retrieval instruction

#### Scenario: Retrieve offloaded output
- **WHEN** agent requests offloaded content
- **THEN** system SHALL read from file
- **AND** SHALL inject into context
- **AND** SHALL enforce token budget

### Requirement: Progressive Disclosure

The ContextCompaction SHALL implement skills progressive disclosure.

#### Scenario: Load core skills at start
- **WHEN** agent starts
- **THEN** system SHALL load only core skills
- **AND** SHALL not load specialized skills

#### Scenario: Load specialized skill on demand
- **WHEN** agent requests specialized capability
- **THEN** system SHALL load corresponding skill
- **AND** SHALL inject skill context
- **AND** SHALL unload after use

## Dependencies

- Requires: `agent-memory` for context access
- Requires: `agent-skills` for skill loading
- Used by: `ralph-loops` for context management
