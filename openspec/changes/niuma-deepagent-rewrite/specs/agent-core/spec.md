## ADDED Requirements

### Requirement: Agent 循环执行
The Agent SHALL execute a loop that alternates between LLM calls and tool executions until completion or max iterations reached.

#### Scenario: Successful completion without tools
- **WHEN** Agent receives user message
- **AND** LLM responds without tool calls
- **THEN** Agent SHALL return the response to user
- **AND** Loop SHALL terminate

#### Scenario: Tool execution flow
- **WHEN** Agent receives user message
- **AND** LLM responds with tool calls
- **THEN** Agent SHALL execute all tool calls
- **AND** Agent SHALL send tool results back to LLM
- **AND** Loop SHALL continue until no more tool calls

#### Scenario: Max iterations protection
- **WHEN** Agent loop reaches max iterations (default 40)
- **THEN** Agent SHALL halt with error
- **AND** Return partial results

### Requirement: Immutable Agent State
The Agent SHALL maintain state as immutable data structure.

#### Scenario: State transitions
- **WHEN** Agent processes a message
- **THEN** New state SHALL be created
- **AND** Previous state SHALL remain unchanged

### Requirement: Progress Callbacks
The Agent SHALL support progress callbacks for monitoring execution.

#### Scenario: Progress events
- **WHEN** Agent makes LLM call
- **THEN** Progress callback SHALL be invoked with "llm_call" event
- **WHEN** Tool execution starts
- **THEN** Progress callback SHALL be invoked with "tool_start" event
- **WHEN** Tool execution completes
- **THEN** Progress callback SHALL be invoked with "tool_result" event
