## Historical Context

### Code Evolution (Git History)

**Initial Implementation (d35cf4e - 2026-03-10)**
- Implemented Phase 2 Agent Core
- Added context builder for System Prompt construction
- Initial methods: `buildSystemPrompt()`, `buildMessages()`, etc.

**Code Quality Refactor (50c85d3 - 2026-03-14)**
- Reorganized code structure with clear comment separators
- Unified import style (removed `node:` prefix)
- Added `buildSystemPromptAsync()` as public async method
- Kept `_buildSystemPrompt()` as private implementation
- 366 lines changed in context.ts

**Current State (Uncommitted)**
- `_buildSystemPrompt()` is private (internal implementation)
- `buildSystemPromptAsync()` is the public async API
- `buildMessages()` is async and uses private methods internally
- Added `refreshBootstrap()` and `getMemoryContextAsync()` for cache management

**Why Private Methods?**
- Encapsulation: Hide implementation details
- Flexibility: Can change internal logic without breaking API
- Clarity: Public API clearly separates interface from implementation

## Requirements

### Requirement: System Prompt 构建

ContextBuilder SHALL 从多个来源构建完整的 System Prompt：
- 核心身份（identity）
- Bootstrap 文件（AGENTS.md, SOUL.md, USER.md, TOOLS.md）
- 长期记忆（MEMORY.md）
- 激活的技能（always=true）

#### Scenario: 构建基础 System Prompt

- **WHEN** 调用 `buildSystemPromptAsync()` 且工作区存在 AGENTS.md
- **THEN** 返回的 System Prompt 包含身份信息和工作区路径

#### Scenario: 加载 Bootstrap 文件

- **WHEN** 工作区存在 SOUL.md 和 USER.md
- **THEN** System Prompt 包含这两个文件的内容

#### Scenario: 注入记忆上下文

- **WHEN** MEMORY.md 存在且非空
- **THEN** System Prompt 包含 "## Long-term Memory" 章节及其内容

### Requirement: 消息历史组装

ContextBuilder SHALL 将历史消息和当前消息组装为 LLM 可用的消息列表。

#### Scenario: 组装简单文本消息

- **WHEN** 调用 `buildMessages()` 并提供历史和当前文本消息
- **THEN** 返回的消息列表包含 system 消息、历史消息和当前用户消息

#### Scenario: 处理媒体内容

- **WHEN** 当前消息包含图片路径
- **THEN** 用户消息内容为多部分格式（图片 base64 + 文本）

#### Scenario: 注入运行时上下文

- **WHEN** 调用 `buildMessages()` 并提供 channel 和 chatId
- **THEN** 用户消息包含当前时间和渠道信息

### Requirement: 工具调用消息处理

ContextBuilder SHALL 支持添加助手消息（含工具调用）和工具结果消息。

#### Scenario: 添加带工具调用的助手消息

- **WHEN** 调用 `addAssistantMessage()` 并提供 toolCalls
- **THEN** 消息列表新增助手消息，包含 content 和 tool_calls 字段

#### Scenario: 添加工具结果

- **WHEN** 调用 `addToolResult()` 并提供工具调用 ID 和结果
- **THEN** 消息列表新增 role=tool 的消息

### Requirement: reasoning_content 支持

ContextBuilder SHALL 支持处理 reasoning_content 字段（思维模型输出）。

#### Scenario: 添加含推理内容的助手消息

- **WHEN** 调用 `addAssistantMessage()` 并提供 reasoningContent
- **THEN** 消息列表新增助手消息，包含 reasoning_content 字段

### Requirement: 异步记忆上下文获取

ContextBuilder SHALL 提供异步方法获取记忆上下文。

#### Scenario: 异步获取记忆上下文

- **WHEN** 调用 `getMemoryContextAsync()`
- **THEN** 返回格式化的长期记忆上下文（Promise<string>）

### Requirement: Bootstrap 缓存管理

ContextBuilder SHALL 支持 Bootstrap 文件缓存。

#### Scenario: 刷新 Bootstrap 缓存

- **WHEN** 调用 `refreshBootstrap()`
- **THEN** 清空 Bootstrap 缓存，下次加载时重新读取文件

### Requirement: 工具可以获取当前 Agent ID

系统 SHALL 提供机制让工具在运行时获取当前 Agent 的 ID，而不是硬编码为 "default"。

#### Scenario: Spawn 工具获取当前 Agent ID
- **WHEN** Spawn 工具被调用
- **THEN** 系统应返回调用该工具的 Agent 的实际 ID
- **AND** 不应硬编码为 "default"

#### Scenario: Message 工具获取当前 Agent ID
- **WHEN** Message 工具被调用
- **THEN** 系统应返回调用该工具的 Agent 的实际 ID
- **AND** 消息历史中应记录正确的 Agent ID

#### Scenario: 工具无法获取 Agent ID 时使用默认值
- **WHEN** 工具尝试获取 Agent ID 但无法获取
- **THEN** 系统应返回 "default" 作为默认值
- **AND** 应记录警告日志

---

## TypeScript Interfaces

```typescript
interface ContextBuilder {
  buildSystemPromptAsync(skillNames?: string[]): Promise<string>
  buildMessages(options: {
    history: ChatMessage[]
    currentMessage: string
    media?: MediaContent[]
    channel?: string
    chatId?: string
    skillNames?: string[]
  }): Promise<ChatMessage[]>
  addAssistantMessage(messages: ChatMessage[], options: {
    content?: string
    toolCalls?: ToolCall[]
    reasoningContent?: string
  }): ChatMessage[]
  addToolResult(messages: ChatMessage[], options: {
    toolCallId: string
    toolName: string
    result: string
  }): ChatMessage[]
  refreshBootstrap(): void
  getMemoryContextAsync(): Promise<string>
}
```

## Dependencies

- `niuma/types/message.ts` - ChatMessage, MediaContent
- `niuma/types/tool.ts` - ToolCall
- `niuma/agent/memory.ts` - MemoryStore
- `niuma/agent/skills.ts` - SkillsLoader

## Implementation Notes

- `buildSystemPromptAsync()` 是异步方法，返回 `Promise<string>`
- 私有方法 `_buildSystemPrompt()` 不属于公共 API，规格中不再列出
- `buildMessages()` 也是异步方法，返回 `Promise<ChatMessage[]>`
- `refreshBootstrap()` 是同步方法，清空缓存
- `getMemoryContextAsync()` 直接调用 `memoryStore.getMemoryContext()` 获取记忆上下文
