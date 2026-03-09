## ADDED Requirements

### Requirement: Type-safe event system

The system SHALL provide a type-safe event emitter based on Node.js EventEmitter.

#### Scenario: Define event types
- **WHEN** defining events
- **THEN** EventType SHALL include MESSAGE_RECEIVED, MESSAGE_SENT, TOOL_CALL_START, TOOL_CALL_END, LLM_REQUEST_START, LLM_RESPONSE, ERROR, HEARTBEAT

#### Scenario: Event data is typed
- **WHEN** emitting or listening to events
- **THEN** EventMap SHALL provide type safety for each event type's data

### Requirement: Event emitter singleton

The system SHALL provide a singleton EventEmitter instance with helper functions.

#### Scenario: Export singleton emitter
- **WHEN** importing from bus/events
- **THEN** a module-level singleton `bus` SHALL be available

#### Scenario: Emit with helper
- **WHEN** calling `emit(type, data)`
- **THEN** event SHALL be emitted with timestamp automatically added

#### Scenario: Listen with helper
- **WHEN** calling `on(type, handler)` or `once(type, handler)`
- **THEN** handler SHALL receive typed event data

### Requirement: Async message queue

The system SHALL provide an async queue for message buffering.

#### Scenario: Enqueue messages
- **WHEN** calling `queue.enqueue(item)`
- **THEN** item SHALL be added to the queue

#### Scenario: Dequeue messages
- **WHEN** calling `queue.dequeue()`
- **THEN** the next item SHALL be returned in FIFO order

#### Scenario: Queue size
- **WHEN** accessing `queue.size`
- **THEN** current queue length SHALL be returned