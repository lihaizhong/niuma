## Purpose

定义 DeepAgent 消息相关类型，提供简化版的消息类型用于 Agent 内部通信。这些类型是 Channel 消息类型的子集，专注于 Agent 核心需求。

## ADDED Requirements

### Requirement: MediaContent interface
The system SHALL provide a MediaContent interface for media attachments.

#### Scenario: MediaContent structure
- **WHEN** importing MediaContent from deepagent/types/message
- **THEN** it SHALL have:
  - `type: "image" | "video" | "audio" | "document" | "file"` - media type
  - `url?: string` - media URL (optional)
  - `data?: string` - base64 encoded data (optional)
  - `mimeType?: string` - MIME type (optional)
  - `filename?: string` - filename (optional)
  - `size?: number` - file size in bytes (optional)

### Requirement: SessionMessage interface
The system SHALL provide a SessionMessage interface for session storage.

#### Scenario: SessionMessage structure
- **WHEN** importing SessionMessage from deepagent/types/message
- **THEN** it SHALL have:
  - `role: "user" | "assistant" | "system" | "tool"` - message role
  - `content: string` - message content
  - `timestamp: string` - ISO timestamp
  - `toolsUsed?: string[]` - names of tools used (optional)

### Requirement: Session interface
The system SHALL provide a Session interface for conversation sessions.

#### Scenario: Session structure
- **WHEN** importing Session from deepagent/types/message
- **THEN** it SHALL have:
  - `key: string` - unique session key
  - `messages: SessionMessage[]` - session messages
  - `createdAt: Date` - creation timestamp
  - `updatedAt: Date` - last update timestamp
  - `metadata?: Record<string, unknown>` - additional metadata (optional)

### Requirement: SessionManager interface
The system SHALL provide a SessionManager interface for session management.

#### Scenario: SessionManager structure
- **WHEN** importing SessionManager from deepagent/types/message
- **THEN** it SHALL have:
  - `getOrCreate(key: string): Promise<Session>` - get or create session
  - `save(session: Session): Promise<void>` - save session
  - `getHistory(key: string): Promise<SessionMessage[]>` - get session history
  - `addMessage(key: string, message: SessionMessage): Promise<void>` - add message

## Dependencies

- None (this is a base type module)
