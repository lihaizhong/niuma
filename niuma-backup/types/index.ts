/**
 * 核心类型 - 统一导出
 */

// 消息类型
export type {
  ChannelType,
  MediaContent,
  InboundMessage,
  OutboundMessage,
} from "./message";

// 工具类型
export type {
  ToolParameterSchema,
  ToolDefinition,
  ToolCall,
  OpenAIToolSchema,
} from "./tool";

// 技能类型
export type { SkillInfo, SkillMetadata, SkillFullInfo } from "../agent/skills";

// 会话类型
export type {
  SessionMessage,
  Session,
  SessionManagerConfig,
} from "../session/manager";

// LLM 类型
export type {
  LLMUsage,
  LLMConfig,
  ChatRole,
  MessageContentPart,
  ChatMessage,
  LLMResponse,
  LLMStreamChunk,
  ProviderConfig,
  ChatOptions,
} from "./llm";

// 事件类型
export type { EventType, EventMap, EventPayload, EventHandler } from "./events";

// 错误类型
export {
  NiumaError,
  ToolExecutionError,
  ConfigError,
  ValidationError,
  ProviderError,
  ChannelError,
  SessionError,
} from "./error";
