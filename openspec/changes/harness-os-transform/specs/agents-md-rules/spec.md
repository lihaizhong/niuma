## Purpose

定义 AGENTS.md 渐进规则系统的核心行为规范。

## ADDED Requirements

### Requirement: Rules Accumulation

The AgentsMdRules SHALL accumulate failure-derived rules in workspace/AGENTS.md file.

```typescript
interface AgentRule {
  id: string;
  rule: string;
  reason: string;
  createdAt: string;
  sourceTask?: string;
}
```

#### Scenario: Add new rule on failure
- **WHEN** agent fails due to predictable mistake
- **THEN** system SHALL append new rule to AGENTS.md
- **AND** SHALL include reason and timestamp
- **AND** SHALL assign sequential ID

#### Scenario: Load rules at startup
- **WHEN** agent starts new session
- **THEN** system SHALL load AGENTS.md rules
- **AND** SHALL inject rules into system prompt

### Requirement: Rule Format

Rules SHALL follow standardized format for parsing.

```markdown
## Rules (accumulated from failures)

1. Always run tests after writing code
   - Reason: Agent forgot to verify changes
   - Added: 2026-03-21

2. Use npm install not yarn for this project
   - Reason: Project has npm-specific scripts
   - Added: 2026-03-22
```

#### Scenario: Parse existing rules
- **WHEN** loading AGENTS.md
- **THEN** parser SHALL extract all rules
- **AND** SHALL build rule index for fast lookup
- **AND** SHALL handle malformed entries gracefully

### Requirement: Rule Deduplication

The AgentsMdRules SHALL prevent duplicate rules.

#### Scenario: Duplicate detection
- **WHEN** adding new rule
- **THEN** system SHALL check for similar existing rules
- **AND** SHALL skip if rule already exists
- **AND** SHALL log deduplication

### Requirement: Rule Context

Each rule SHALL include failure context.

#### Scenario: Store failure context
- **WHEN** adding new rule
- **THEN** system SHALL store the error that triggered rule
- **AND** SHALL store the task context
- **AND** SHALL enable rule explanation on demand

## Dependencies

- Requires: `agent-memory` for workspace access
- Used by: `context-compaction` for rule injection
