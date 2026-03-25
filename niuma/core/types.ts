/**
 * 核心 Agent 类型定义
 */

import type { LLMUsage, ChatMessage, ToolCall, ToolDefinition } from "../types/llm";
import type { ZodType } from "zod";
export type { ChatMessage, ToolDefinition };

/**
 * Agent 状态（不可变）
 */
export interface AgentState {
  /** 对话消息历史 */
  messages: ChatMessage[];
  /** 当前迭代次数 */
  iteration: number;
  /** 是否已停止 */
  halted: boolean;
  /** 最后响应内容 */
  lastContent?: string;
  /** 工具执行结果 */
  toolResults: string[];
}

/**
 * 进度事件类型
 */
export type ProgressEventType =
  | "llm_call"
  | "llm_response"
  | "tool_start"
  | "tool_result"
  | "iteration"
  | "complete"
  | "error";

/**
 * 进度事件
 */
export interface ProgressEvent {
  type: ProgressEventType;
  iteration: number;
  message?: string;
  toolName?: string;
  toolResult?: string;
  error?: string;
}

/**
 * 进度回调函数
 */
export type ProgressCallback = (event: ProgressEvent) => void;

/**
 * Agent 上下文（依赖注入）
 */
export interface AgentContext {
  /** LLM 提供商 */
  provider: LLMProvider;
  /** 工具注册表 */
  tools: ToolRegistry;
  /** 最大迭代次数 */
  maxIterations: number;
  /** 采样温度 */
  temperature: number;
  /** 进度回调 */
  onProgress?: ProgressCallback;
}

/**
 * 聊天选项
 */
export interface ChatOptions {
  /** 对话消息 */
  messages: ChatMessage[];
  /** 可用工具 */
  tools?: ToolDefinition[];
  /** 采样温度 */
  temperature?: number;
  /** 最大 token 数 */
  maxTokens?: number;
  /** 顶层采样 */
  topP?: number;
  /** 频率惩罚 */
  frequencyPenalty?: number;
  /** 存在惩罚 */
  presencePenalty?: number;
  /** 超时时间 */
  timeout?: number;
}

/**
 * LLM Provider 接口
 */
export interface LLMProvider {
  /** Provider 名称 */
  readonly name: string;
  /** 获取配置 */
  getConfig(): LLMConfig;
  /** 同步对话 */
  chat(options: ChatOptions): Promise<LLMResponse>;
  /** 流式对话 */
  chatStream?(options: ChatOptions): AsyncIterable<LLMStreamChunk>;
  /** 获取默认模型 */
  getDefaultModel(): string;
  /** 检查可用性 */
  isAvailable?(): Promise<boolean>;
}

/**
 * LLM 配置
 */
export interface LLMConfig {
  /** 模型标识符 */
  model: string;
  /** API 密钥 */
  apiKey?: string;
  /** API 基础 URL */
  apiBase?: string;
  /** 采样温度 */
  temperature?: number;
  /** 最大 token 数 */
  maxTokens?: number;
  /** 顶层采样 */
  topP?: number;
  /** 停止序列 */
  stopSequences?: string[];
  /** 频率惩罚 */
  frequencyPenalty?: number;
  /** 存在惩罚 */
  presencePenalty?: number;
  /** 超时时间 */
  timeout?: number;
}

/**
 * LLM 响应
 */
export interface LLMResponse {
  /** 响应内容 */
  content: string;
  /** 工具调用 */
  toolCalls?: ToolCall[];
  /** 是否有工具调用 */
  hasToolCalls: boolean;
  /** 使用统计 */
  usage?: LLMUsage;
  /** 模型名称 */
  model?: string;
  /** 结束原因 */
  finishReason?: string;
  /** 响应 ID */
  id?: string;
}

/**
 * LLM 流式响应块
 */
export interface LLMStreamChunk {
  /** 内容增量 */
  content?: string;
  /** 工具调用 */
  toolCalls?: Partial<ToolCall>[];
  /** 是否最终块 */
  isFinal: boolean;
  /** 结束原因 */
  finishReason?: string;
  /** 使用统计 */
  usage?: LLMUsage;
}

/**
 * Provider 信息
 */
export interface ProviderInfo {
  name: string;
  displayName: string;
  model: string;
  isCurrent: boolean;
  isAvailable: boolean;
}

/**
 * Provider 切换结果
 */
export interface ProviderSwitchResult {
  success: boolean;
  message: string;
  modelName?: string;
}

/**
 * Provider 注册表接口
 */
export interface ProviderRegistry {
  listProviders(): ProviderInfo[];
  getProvider(name: string): LLMProvider | undefined;
  getProviderByName(name: string): LLMProvider | undefined;
  getProviderConfig(name: string): LLMConfig | undefined;
}

/**
 * Tool 注册表接口
 */
export interface ToolRegistry {
  register<T>(spec: ToolSpec<T>): this;
  execute(name: string, args: unknown, context?: ToolContext): Promise<string>;
  list(): string[];
  getDefinitions(): ToolDefinition[];
}

/**
 * Tool 上下文
 */
export interface ToolContext {
  cwd: string;
  env: Record<string, string>;
  agentId: string;
}

/**
 * Tool 规格定义
 */
export interface ToolSpec<T = unknown> {
  name: string;
  description: string;
  parameters: ZodType<T>;
  execute: (args: T, context?: ToolContext) => Promise<string>;
}

/**
 * 创建 Agent 选项
 */
export interface CreateAgentOptions {
  provider: LLMProvider;
  tools?: ToolRegistry;
  maxIterations?: number;
  temperature?: number;
  onProgress?: ProgressCallback;
}

/**
 * Agent 接口
 */
export interface Agent {
  chat(messages: ChatMessage[]): Promise<LLMResponse>;
  chatStream(messages: ChatMessage[]): AsyncIterable<LLMStreamChunk>;
  getState(): AgentState;
}

/**
 * 斜杠命令
 */
export interface SlashCommand {
  name: string;
  description: string;
  handler: (args: string[]) => Promise<string>;
}
