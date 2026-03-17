# niuma v0.2.2

## Enumerations

| Enumeration | Description |
| ------ | ------ |
| [ChannelErrorType](enumerations/ChannelErrorType.md) | 错误类型枚举 |
| [ChannelStatus](enumerations/ChannelStatus.md) | 渠道状态枚举 |

## Classes

| Class | Description |
| ------ | ------ |
| [AgentLoop](classes/AgentLoop.md) | Agent 循环 - 核心处理引擎 |
| [AsyncQueue](classes/AsyncQueue.md) | 用于消息缓冲的通用异步队列 |
| [BaseChannel](classes/BaseChannel.md) | 渠道抽象基类 所有渠道实现必须继承此基类 |
| [BaseTool](classes/BaseTool.md) | 工具抽象基类 |
| [ChannelError](classes/ChannelError.md) | 渠道错误类 |
| [ChannelRegistry](classes/ChannelRegistry.md) | 渠道注册表 管理所有已注册的渠道 |
| [CLIChannel](classes/CLIChannel.md) | CLI 渠道 命令行界面的渠道实现 |
| [ConfigError](classes/ConfigError.md) | 配置错误 |
| [ConfigManager](classes/ConfigManager.md) | 配置管理器 |
| [ContextBuilder](classes/ContextBuilder.md) | 上下文构建器 构建 System Prompt 和组装消息列表 |
| [DiscordChannel](classes/DiscordChannel.md) | Discord 渠道 Discord Bot API 的渠道实现 |
| [EmailChannel](classes/EmailChannel.md) | Email 渠道 邮件渠道实现，支持 IMAP 接收和 SMTP 发送 |
| [EventBus](classes/EventBus.md) | 类型安全的事件总线 直接使用 EventEmitter，提供类型安全的封装 |
| [FeishuChannel](classes/FeishuChannel.md) | 飞书渠道 基于 @larksuiteoapi/node-sdk 的飞书开放平台渠道实现 |
| [HeartbeatService](classes/HeartbeatService.md) | 心跳服务类 |
| [MemoryStore](classes/MemoryStore.md) | 记忆存储类 实现双层记忆：MEMORY.md（长期记忆）+ HISTORY.md（时间线日志） 存储位置：workspace/memory/ |
| [NiumaError](classes/NiumaError.md) | 所有 Niuma 错误的基类 |
| [ProviderError](classes/ProviderError.md) | 提供商错误（LLM API 错误） |
| [QQChannel](classes/QQChannel.md) | QQ 渠道 基于 oicq SDK 的 QQ Bot 渠道实现 |
| [SessionError](classes/SessionError.md) | 会话错误 |
| [SessionManager](classes/SessionManager.md) | 会话管理器 负责会话的创建、持久化和历史记录管理 |
| [SkillsLoader](classes/SkillsLoader.md) | 技能加载器 发现、加载和管理技能 工作区技能位置：workspace/skills/ 内置技能位置：代码包中的 skills 目录 |
| [TelegramChannel](classes/TelegramChannel.md) | Telegram 渠道 Telegram Bot API 的渠道实现 |
| [ToolExecutionError](classes/ToolExecutionError.md) | 工具执行错误 |
| [ToolRegistry](classes/ToolRegistry.md) | 工具注册中心 参考 nanobot 的简洁设计 |
| [ValidationError](classes/ValidationError.md) | 验证错误 |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [AgentInfo](interfaces/AgentInfo.md) | 角色信息 |
| [AgentLoopOptions](interfaces/AgentLoopOptions.md) | Agent 循环配置选项 |
| [ChatMessage](interfaces/ChatMessage.md) | 对话历史的聊天消息 |
| [ChatOptions](interfaces/ChatOptions.md) | 聊天调用选项 |
| [CLIChannelConfig](interfaces/CLIChannelConfig.md) | CLI 渠道配置 |
| [DiscordChannelConfig](interfaces/DiscordChannelConfig.md) | Discord 渠道配置 |
| [EmailChannelConfig](interfaces/EmailChannelConfig.md) | Email 渠道配置 |
| [FeishuChannelConfig](interfaces/FeishuChannelConfig.md) | 飞书渠道配置 |
| [HeartbeatConfig](interfaces/HeartbeatConfig.md) | 心跳服务配置 |
| [HeartbeatTask](interfaces/HeartbeatTask.md) | 心跳任务 |
| [InboundMessage](interfaces/InboundMessage.md) | 入站消息（从任意渠道接收） |
| [ITool](interfaces/ITool.md) | 所有工具必须实现的接口 |
| [LLMProvider](interfaces/LLMProvider.md) | LLM 提供商接口 所有 LLM 提供商必须实现此接口 |
| [LLMResponse](interfaces/LLMResponse.md) | LLM 响应结构 |
| [MediaContent](interfaces/MediaContent.md) | 媒体内容类型 |
| [OutboundMessage](interfaces/OutboundMessage.md) | 出站消息（发送到任意渠道） |
| [ProviderLLMConfig](interfaces/ProviderLLMConfig.md) | LLM 配置 |
| [ProviderRegistry](interfaces/ProviderRegistry.md) | 提供商注册表 |
| [ProviderSpec](interfaces/ProviderSpec.md) | 提供商规格 |
| [QQChannelConfig](interfaces/QQChannelConfig.md) | QQ 渠道配置 |
| [Session](interfaces/Session.md) | 会话数据结构 会话的完整状态信息 |
| [SessionManagerConfig](interfaces/SessionManagerConfig.md) | 会话管理器配置 |
| [SessionMessage](interfaces/SessionMessage.md) | 会话消息结构 单条会话消息的完整信息 |
| [TelegramChannelConfig](interfaces/TelegramChannelConfig.md) | Telegram 渠道配置 |
| [ToolCall](interfaces/ToolCall.md) | LLM 请求的工具调用 |
| [ToolDefinition](interfaces/ToolDefinition.md) | 工具定义（用于 LLM 函数调用） |
| [ToolParameterSchema](interfaces/ToolParameterSchema.md) | 工具参数 Schema 定义（JSON Schema 格式） |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [AgentConfig](type-aliases/AgentConfig.md) | - |
| [ChannelsConfig](type-aliases/ChannelsConfig.md) | - |
| [EventName](type-aliases/EventName.md) | - |
| [LLMConfig](type-aliases/LLMConfig.md) | - |
| [MessageHandler](type-aliases/MessageHandler.md) | 消息处理器类型 |
| [NiumaConfig](type-aliases/NiumaConfig.md) | - |
| [ProviderConfig](type-aliases/ProviderConfig.md) | - |

## Variables

| Variable | Description |
| ------ | ------ |
| [EventNames](variables/EventNames.md) | - |
| [LLMConfigSchema](variables/LLMConfigSchema.md) | LLM 配置 Schema 定义多提供商配置结构 |
| [NiumaConfigSchema](variables/NiumaConfigSchema.md) | - |
| [ProviderConfigSchema](variables/ProviderConfigSchema.md) | 基础提供商配置 Schema |
| [providerRegistry](variables/providerRegistry.md) | - |
| [StrictNiumaConfigSchema](variables/StrictNiumaConfigSchema.md) | 严格配置验证 Schema 使用 strict 模式，拒绝未知字段 |

## Functions

| Function | Description |
| ------ | ------ |
| [createLogger](functions/createLogger.md) | 创建带上下文的 logger |
| [registerBuiltinTools](functions/registerBuiltinTools.md) | 注册所有内置工具 |
