## 1. Core Types

- [x] 1.1 Create `niuma/types/message.ts` with InboundMessage, OutboundMessage, MediaContent
- [x] 1.2 Create `niuma/types/tool.ts` with ToolCall, ToolResult, ToolParameterSchema, ToolDefinition
- [x] 1.3 Create `niuma/types/llm.ts` with LLMResponse, LLMUsage, LLMConfig, ChatMessage
- [x] 1.4 Create `niuma/types/events.ts` with EventType, EventMap
- [x] 1.5 Create `niuma/types/error.ts` with NiumaError, ToolExecutionError, ConfigError, ValidationError
- [x] 1.6 Create `niuma/types/index.ts` with unified exports

## 2. Configuration System

- [x] 2.1 Create `niuma/config/schema.ts` with zod schemas (ProviderConfigSchema, ChannelConfigSchema, CronTaskConfigSchema)
- [x] 2.2 Add NiumaConfigSchema with all config fields and defaults
- [x] 2.3 Add channel-specific schemas (Telegram, Discord, Feishu, Dingtalk, Slack, WhatsApp, Email, QQ, CLI)
- [x] 2.4 Add validation helper functions (validateConfig, safeValidateConfig, validateChannelConfig)
- [x] 2.5 Create `niuma/config/loader.ts` with ConfigLoader class
- [x] 2.6 Implement config loading from file (findConfigFile, loadFileConfig)
- [x] 2.7 Implement config loading from env vars (loadEnvConfig)
- [x] 2.8 Implement config merging with priority (file > env > default)
- [x] 2.9 Add getter methods (getConfig, getWorkDir, getMemoryFilePath, getHistoryFilePath)

## 3. Tool Framework

- [x] 3.1 Create `niuma/agent/tools/base.ts` with ITool interface
- [x] 3.2 Implement BaseTool abstract class with getDefinition(), validateArgs(), success(), failure()
- [x] 3.3 Add zod-to-parameter conversion (zodToParameter, getSchemaShape)
- [x] 3.4 Implement SimpleTool class for function-based tools
- [x] 3.5 Add ToolBuilder for fluent tool creation
- [x] 3.6 Create `niuma/agent/tools/registry.ts` with ToolRegistry class
- [x] 3.7 Implement tool registration methods (register, registerAll, unregister)
- [x] 3.8 Implement tool execution (execute, executeAll)
- [x] 3.9 Add schema generation methods (generateOpenAISchema, generateAnthropicSchema)
- [x] 3.10 Add category and alias support (addAlias, addToCategory, getByCategory)

## 4. Event Bus

- [x] 4.1 Create `niuma/bus/events.ts` with EventEmitter singleton
- [x] 4.2 Add type-safe helper functions (emit, on, once, off)
- [x] 4.3 Create `niuma/bus/queue.ts` with AsyncQueue class
- [x] 4.4 Implement queue methods (enqueue, dequeue, size)
- [x] 4.5 Create `niuma/bus/index.ts` with unified exports

## 5. Verification

- [x] 5.1 Run TypeScript compilation to verify no errors
- [x] 5.2 Verify all exports have type definitions (no any)
- [x] 5.3 Verify all files have proper ES Module syntax