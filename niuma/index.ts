/**
 * Niuma - 服务端接入接口
 *
 * @description 导出核心模块，支持作为服务端接入智能体
 * @example
 * ```typescript
 * import { AgentLoop, ConfigManager, EventBus, SessionManager } from 'niuma';
 *
 * // 创建配置管理器
 * const configManager = new ConfigManager();
 * const config = configManager.load();
 *
 * // 创建事件总线
 * const bus = new EventBus();
 *
 * // 创建会话管理器
 * const sessions = new SessionManager({ workspace: config.workspaceDir });
 *
 * // 创建 Agent 循环
 * const agentLoop = new AgentLoop({
 *   bus,
 *   provider,
 *   tools,
 *   sessions,
 *   workspace: config.workspaceDir,
 * });
 *
 * // 启动 Agent
 * await agentLoop.run();
 * ```
 */

// ============================================
// Agent 核心
// ============================================

export { AgentLoop } from "./agent/loop";
export type { AgentLoopOptions } from "./agent/loop";

export { ContextBuilder } from "./agent/context";
export { MemoryStore } from "./agent/memory";
export { SkillsLoader } from "./agent/skills";

// 工具系统
export { ToolRegistry, registerBuiltinTools } from "./agent/tools/registry";
export { BaseTool } from "./agent/tools/base";
export type { ITool } from "./agent/tools/base";

// ============================================
// 事件总线
// ============================================

export { EventBus, EventNames } from "./bus/events";
export type { EventName } from "./bus/events";
export { AsyncQueue } from "./bus/queue";

// ============================================
// 渠道系统
// ============================================

export {
  BaseChannel,
  ChannelStatus,
  ChannelError,
  ChannelErrorType,
  ChannelRegistry,
} from "./channels";

export type { MessageHandler } from "./channels/base";

// 具体渠道实现
export { CLIChannel } from "./channels/cli";
export type { CLIChannelConfig } from "./channels/cli";

export { DiscordChannel } from "./channels/discord";
export type { DiscordChannelConfig } from "./channels/discord";

export { TelegramChannel } from "./channels/telegram";
export type { TelegramChannelConfig } from "./channels/telegram";

export { FeishuChannel } from "./channels/feishu";
export type { FeishuChannelConfig } from "./channels/feishu";

export { EmailChannel } from "./channels/email";
export type { EmailChannelConfig } from "./channels/email";

export { QQChannel } from "./channels/qq";
export type { QQChannelConfig } from "./channels/qq";

// ============================================
// 配置管理
// ============================================

export { ConfigManager } from "./config/manager";
export type { AgentInfo } from "./config/manager";

// 配置 Schema
export {
  NiumaConfigSchema,
  StrictNiumaConfigSchema,
  ProviderConfigSchema,
  LLMConfigSchema,
} from "./config/schema";
export type {
  NiumaConfig,
  AgentConfig,
  LLMConfig,
  ChannelsConfig,
  ProviderConfig,
} from "./config/schema";

// ============================================
// 会话管理
// ============================================

export { SessionManager } from "./session/manager";
export type { Session, SessionMessage, SessionManagerConfig } from "./session/manager";

// ============================================
// LLM 提供商
// ============================================

export { providerRegistry } from "./providers/registry";
export type { ProviderRegistry, ProviderSpec } from "./providers/registry";

export { LLMProvider } from "./providers/base";
export type { LLMConfig as ProviderLLMConfig, LLMResponse, ChatOptions } from "./types/llm";

// ============================================
// 心跳服务
// ============================================

export { HeartbeatService } from "./heartbeat/service";
export type { HeartbeatConfig, HeartbeatTask } from "./heartbeat/types";

// ============================================
// 日志
// ============================================

export { createLogger } from "./log";

// ============================================
// 类型定义
// ============================================

export type {
  ChatMessage,
  InboundMessage,
  OutboundMessage,
  MediaContent,
  ToolCall,
  ToolDefinition,
  ToolParameterSchema,
} from "./types";

// 错误类型
export {
  NiumaError,
  ToolExecutionError,
  ConfigError,
  ValidationError,
  ProviderError,
  SessionError,
} from "./types/error";
