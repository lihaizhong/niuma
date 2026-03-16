/**
 * Agent 循环 - 核心处理引擎
 *
 * @description 实现消息处理循环，支持：
 * - 多轮 LLM ↔ 工具执行迭代
 * - 斜杠命令处理
 * - 记忆整合
 * - 流式响应输出
 * - 错误重试机制
 *
 * @see 参考 nanobot: https://github.com/HKUDS/nanobot/blob/main/nanobot/agent/loop.py
 */

// ==================== 第三方库 ====================
import RE2 from "re2";

// ==================== 本地模块 ====================
import { createLogger } from "../log";
import type {
  ChatMessage,
  InboundMessage,
  OutboundMessage,
  ToolDefinition,
} from "../types";
import type { Session } from "../session/manager";
import type { LLMProvider } from "../providers/base";
import type { LLMResponse } from "../types/llm";
import type { ToolCall } from "../types/tool";
import { EventBus } from "../bus/events";
import { AsyncQueue } from "../bus/queue";
import { ToolRegistry } from "./tools/registry";
import { SessionManager } from "../session/manager";
import { ContextBuilder } from "./context";
import { MemoryStore } from "./memory";
import { SkillsLoader } from "./skills";
import { retryWithBackoff } from "../utils/retry";
import type { HeartbeatConfig } from "../heartbeat/types";
import { HeartbeatService } from "../heartbeat/service";
import type { ChannelsConfig } from "../config/schema";
import { ChannelRegistry } from "../channels/registry";
import { BaseChannel } from "../channels/base";

const logger = createLogger("agent-loop");

/**
 * Agent 循环配置选项
 */
export interface AgentLoopOptions {
  /** 事件总线 */
  bus: EventBus;
  /** LLM 提供商 */
  provider: LLMProvider;
  /** 工作区路径 */
  workspace: string;
  /** 工具注册中心 */
  tools: ToolRegistry;
  /** 会话管理器 */
  sessions: SessionManager;
  /** Agent ID（可选，默认为 "default"） */
  agentId?: string;
  /** 使用的模型（可选，默认使用 provider 的默认模型） */
  model?: string;
  /** 最大迭代次数（默认 40） */
  maxIterations?: number;
  /** 采样温度（默认 0.7） */
  temperature?: number;
  /** 最大生成 token 数 */
  maxTokens?: number;
  /** 记忆窗口大小（默认 100 条消息） */
  memoryWindow?: number;
  /** 心跳服务配置 */
  heartbeatConfig?: HeartbeatConfig;
  /** 渠道配置 */
  channelsConfig?: ChannelsConfig;
  /** 渠道注册表（可选，如果不提供则创建新的） */
  channelRegistry?: ChannelRegistry;
}

/**
 * 直接处理消息的选项
 */
export interface ProcessOptions {
  /** 渠道类型 */
  channel?: string;
  /** 会话键 */
  sessionKey?: string;
  /** 进度回调 */
  onProgress?: ProgressCallback;
  /** 跳过渠道发送（默认 false） */
  skipChannelSend?: boolean;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 进度事件类型
 */
export type ProgressEvent =
  | { type: "thinking"; data: { content: string } }
  | { type: "content"; data: { content: string } }
  | {
      type: "tool_call";
      data: { toolName: string; toolArgs: Record<string, unknown> };
    }
  | { type: "tool_result"; data: { toolName: string; toolResult: string } }
  | { type: "error"; data: { error: string } };

/**
 * 进度回调函数类型
 */
export type ProgressCallback = (event: ProgressEvent) => void;

/**
 * 默认配置常量
 * @description 与 niuma/config/schema.ts 中的默认值保持一致
 */
const DEFAULT_MAX_ITERATIONS = 40;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MEMORY_WINDOW = 50; // 与 AgentConfigSchema 保持一致
const MAX_LLM_RETRIES = 4;
const RETRY_DELAYS = [1000, 2000, 4000, 8000];
const CONSOLIDATION_THRESHOLD_RATIO = 0.8;

/**
 * Agent 循环 - 核心处理引擎
 *
 * @description 从消息总线接收消息，通过 LLM 处理并执行工具调用，
 * 支持多轮迭代直到 LLM 返回最终响应。
 *
 * @example
 * ```typescript
 * const loop = new AgentLoop({
 *   bus: eventBus,
 *   provider: openaiProvider,
 *   workspace: '/path/to/workspace',
 *   tools: toolRegistry,
 *   sessions: sessionManager,
 * });
 *
 * // 启动循环
 * loop.run();
 *
 * // 直接处理消息
 * const response = await loop.processDirect('Hello!');
 *
 * // 停止循环
 * loop.stop();
 * ```
 */
export class AgentLoop {
  // ============================================
  // 配置属性
  // ============================================

  /** 事件总线 */
  private readonly bus: EventBus;
  /** LLM 提供商 */
  private readonly provider: LLMProvider;
  /** 工作区路径 */
  private readonly workspace: string;
  /** 工具注册中心 */
  private readonly tools: ToolRegistry;
  /** 会话管理器 */
  public readonly sessions: SessionManager;
  /** 使用的模型 */
  private readonly model: string;
  /** 最大迭代次数 */
  private readonly maxIterations: number;
  /** 采样温度 */
  private readonly temperature: number;
  /** 最大生成 token 数 */
  private readonly maxTokens?: number;
  /** 记忆窗口大小 */
  private readonly memoryWindow: number;

  // ============================================
  // 运行时属性
  // ============================================

  /** 运行状态标志 */
  private running = false;
  /** 消息队列 */
  private messageQueue: AsyncQueue<InboundMessage>;
  /** 心跳服务 */
  private heartbeatService?: HeartbeatService;
  /** 渠道注册表 */
  private readonly channelRegistry: ChannelRegistry;
  /** 渠道配置 */
  private readonly channelsConfig?: ChannelsConfig;

  // ============================================
  // 缓存属性
  // ============================================

  /** 上下文构建器缓存 */
  private contextBuilders: Map<string, ContextBuilder> = new Map();
  /** 记忆存储缓存 */
  private memoryStores: Map<string, MemoryStore> = new Map();
  /** 技能加载器缓存 */
  private skillsLoaders: Map<string, SkillsLoader> = new Map();

  /** 最大缓存数量 */
  private static readonly MAX_CACHE_SIZE = 100;

  // ============================================
  // 构造函数
  // ============================================

  /**
   * 创建 Agent 循环实例
   * @param options 配置选项
   */
  constructor(options: AgentLoopOptions) {
    this.bus = options.bus;
    this.provider = options.provider;
    this.workspace = options.workspace;
    this.tools = options.tools;
    this.sessions = options.sessions;
    this.model = options.model ?? options.provider.getDefaultModel();
    this.maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;
    this.temperature = options.temperature ?? DEFAULT_TEMPERATURE;
    this.maxTokens = options.maxTokens;
    this.memoryWindow = options.memoryWindow ?? DEFAULT_MEMORY_WINDOW;

    // 初始化消息队列
    this.messageQueue = new AsyncQueue();

    // 初始化渠道注册表
    this.channelRegistry = options.channelRegistry ?? this._createChannelRegistry();
    this.channelsConfig = options.channelsConfig;

    // 设置 ToolRegistry 的 Agent ID
    const agentId = options.agentId ?? "default";
    this.tools.setAgentId(agentId);

    // 初始化心跳服务（如果配置启用）
    if (options.heartbeatConfig?.enabled) {
      this.heartbeatService = new HeartbeatService({
        agent: this,
        config: options.heartbeatConfig,
        logger: createLogger("heartbeat"),
        workspaceRoot: this.workspace,
      });
    }
  }

  /**
   * 创建渠道注册表
   * @returns 渠道注册表实例
   * @private
   */
  private _createChannelRegistry(): ChannelRegistry {
    return new ChannelRegistry();
  }

  // ============================================
  // 公共方法
  // ============================================

  /**
   * 启动消息处理循环
   * @description 开始监听消息总线，处理入站消息
   */
  async run(): Promise<void> {
    if (this.running) {
      logger.warn("已在运行中，忽略重复启动请求");
      return;
    }

    this.running = true;
    logger.info("启动消息处理循环");

    // 启动渠道
    await this._startChannels();

    // 启动心跳服务（如果已配置）
    if (this.heartbeatService) {
      try {
        await this.heartbeatService.start();
        logger.info("心跳服务已启动");
      } catch (error) {
        logger.error({ error }, "启动心跳服务失败");
        // 不影响主循环继续运行
      }
    }

    // 监听消息事件
    this.bus.on("MESSAGE_RECEIVED", async (data) => {
      this.messageQueue.enqueue(data.message);
    });

    // 主循环
    while (this.running) {
      try {
        // 等待消息（如果没有消息，将挂起等待）
        const message = await this.messageQueue.dequeue();

        // 检查运行状态（可能在等待期间被停止）
        if (!this.running) {
          break;
        }

        // 处理消息（组织语言 -> 调用工具 -> 反馈结果）
        await this._processMessage(message);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error({ error: message }, "消息处理错误");

        // 发射错误事件
        this.bus.emit("ERROR", {
          error: error instanceof Error ? error : new Error(message),
          context: { phase: "message_processing" },
        });
      }
    }

    logger.info("消息处理循环已停止");
  }

  /**
   * 停止消息处理循环
   * @description 停止监听，清理资源
   */
  async stop(): Promise<void> {
    logger.info("停止消息处理循环");
    this.running = false;
    this.messageQueue.clear();

    // 停止心跳服务（如果已启动）
    if (this.heartbeatService) {
      try {
        await this.heartbeatService.stop();
        logger.info("心跳服务已停止");
      } catch (error) {
        logger.error({ error }, "停止心跳服务失败");
        // 不影响主循环停止
      }
    }
  }

  /**
   * 启动渠道
   * @description 从配置中加载并启动所有启用的渠道
   * @private
   */
  private async _startChannels(): Promise<void> {
    if (!this.channelsConfig || this.channelsConfig.channels.length === 0) {
      logger.info("没有配置渠道，跳过渠道启动");
      return;
    }

    try {
      logger.info("开始启动渠道...");

      // 获取启用的渠道列表
      const enabledChannelTypes = this.channelsConfig.enabled;
      logger.info(`启用的渠道: ${enabledChannelTypes.join(", ")}`);

      // 从 channels 配置中找到对应的渠道配置
      const enabledChannelConfigs = this.channelsConfig.channels.filter((c) =>
        enabledChannelTypes.includes(c.type)
      );

      // 注册消息处理器到所有渠道
      for (const channelConfig of enabledChannelConfigs) {
        const channel = this.channelRegistry.get(channelConfig.type);
        if (channel) {
          channel.onMessage(async (message) => {
            await this.messageQueue.enqueue(message);
          });

          channel.onError((error) => {
            logger.error({ error }, `渠道 ${channelConfig.type} 错误`);
          });
        } else {
          logger.warn(`未找到渠道 ${channelConfig.type}，跳过`);
        }
      }

      // 启动所有渠道
      await this.channelRegistry.startAll(enabledChannelTypes);

      logger.info("渠道启动完成");
    } catch (error) {
      logger.error({ error }, "启动渠道失败");
      // 不影响主循环继续运行
    }
  }

  /**
   * 停止渠道
   * @description 停止所有运行中的渠道
   * @private
   */
  private async _stopChannels(): Promise<void> {
    if (this.channelRegistry.size() === 0) {
      logger.info("没有运行中的渠道");
      return;
    }

    try {
      logger.info("停止所有渠道...");
      await this.channelRegistry.stopAll();
      logger.info("渠道已停止");
    } catch (error) {
      logger.error({ error }, "停止渠道失败");
    }
  }

  /**
   * 直接处理消息
   * @description 用于 CLI 或 cron 直接调用，不经过消息总线
   * @param content 消息内容
   * @param options 处理选项
   * @returns 处理结果字符串
   */
  async processDirect(
    content: string,
    options?: ProcessOptions,
  ): Promise<string> {
    const {
      channel = "cli",
      sessionKey = "cli:default",
      onProgress,
    } = options ?? {};

    // 构造入站消息
    const message: InboundMessage = {
      channel: channel as InboundMessage["channel"],
      senderId: "direct",
      chatId: sessionKey,
      content,
      timestamp: Date.now(),
      sessionKey,
    };

    // 处理消息
    return await this._processMessageInternal(message, onProgress);
  }

  // ============================================
  // 私有方法 - 消息处理
  // ============================================

  /**
   * 处理单条消息
   * @description 内部消息处理流程
   * @param message 入站消息
   */
  private async _processMessage(message: InboundMessage): Promise<void> {
    // 系统消息处理（子智能体通知等）
    if (message.channel === "system") {
      await this._processSystemMessage(message);
      return;
    }

    // 处理消息并获取响应
    const response = await this._processMessageInternal(message);

    // 发送响应
    const outbound: OutboundMessage = {
      channel: message.channel,
      chatId: message.chatId,
      content: response,
      replyTo: message.messageId,
    };

    // 通过渠道发送消息
    await this._sendMessageToChannel(outbound);

    // 同时发送事件（保持兼容性）
    this.bus.emit("MESSAGE_SENT", { message: outbound });
  }

  /**
   * 通过渠道发送消息
   * @description 尝试通过对应的渠道发送消息
   * @param message 出站消息
   * @private
   */
  private async _sendMessageToChannel(message: OutboundMessage): Promise<void> {
    try {
      const channel = this.channelRegistry.get(message.channel);
      if (channel) {
        await channel.send(message);
        logger.debug(`通过渠道 ${message.channel} 发送消息成功`);
      } else {
        logger.warn(`未找到渠道 ${message.channel}，无法发送消息`);
      }
    } catch (error) {
      logger.error({ error }, `通过渠道 ${message.channel} 发送消息失败`);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 内部消息处理逻辑
   * @description 核心处理流程
   */
  private async _processMessageInternal(
    message: InboundMessage,
    onProgress?: ProgressCallback,
  ): Promise<string> {
    const sessionKey =
      message.sessionKey ?? `${message.channel}:${message.chatId}`;

    // 获取或创建会话
    const session = await this.sessions.getOrCreate(sessionKey);

    // 获取上下文构建器
    const contextBuilder = this._getContextBuilder(sessionKey);

    // 检查斜杠命令
    const trimmedContent = message.content.trim();
    if (trimmedContent.startsWith("/")) {
      return await this._handleSlashCommand(trimmedContent, session);
    }

    // 添加用户消息到会话
    this.sessions.addMessage(session, "user", trimmedContent);

    // 构建消息列表
    const history = this.sessions.getHistory(session, this.memoryWindow);
    const messages = await contextBuilder.buildMessages({
      history,
      currentMessage: trimmedContent,
      channel: message.channel,
      chatId: message.chatId,
    });

    // 执行 Agent 循环
    const response = await this._runAgentLoop(
      messages,
      session,
      contextBuilder,
      onProgress,
    );

    // 检查记忆整合
    await this._consolidateMemory(session);

    // 保存会话
    await this.sessions.save(session);

    return response;
  }

  /**
   * 处理系统消息
   * @description 处理子智能体通知等系统消息
   */
  private async _processSystemMessage(message: InboundMessage): Promise<void> {
    // 直接处理不保存历史
    const sessionKey =
      message.sessionKey ?? `${message.channel}:${message.chatId}`;
    const session = await this.sessions.getOrCreate(sessionKey);
    const contextBuilder = this._getContextBuilder(sessionKey);

    // 构建消息
    const history = this.sessions.getHistory(session, this.memoryWindow);
    const messages = await contextBuilder.buildMessages({
      history,
      currentMessage: message.content,
      channel: message.channel,
      chatId: message.chatId,
    });

    // 执行 Agent 循环
    const response = await this._runAgentLoop(
      messages,
      session,
      contextBuilder,
    );

    // 发送响应（不保存历史）
    const outbound: OutboundMessage = {
      channel: message.channel as OutboundMessage["channel"],
      chatId: message.chatId,
      content: response,
    };

    this.bus.emit("MESSAGE_SENT", { message: outbound });
  }

  // ============================================
  // 私有方法 - Agent 循环
  // ============================================

  /**
   * 执行 Agent 迭代循环
   * @description 多轮 LLM ↔ 工具执行迭代
   */
  private async _runAgentLoop(
    messages: ChatMessage[],
    session: Session,
    contextBuilder: ContextBuilder,
    onProgress?: ProgressCallback,
  ): Promise<string> {
    let iteration = 0;
    let lastContent = "";

    while (iteration < this.maxIterations) {
      iteration++;

      // 获取工具定义
      const toolDefinitions = this.tools.getDefinitions();

      // 调用 LLM（带重试）
      const response = await this._callLLMWithRetry(
        messages,
        toolDefinitions,
        onProgress,
      );

      // 处理思维内容
      if (response.reasoningContent && onProgress) {
        onProgress({
          type: "thinking",
          data: { content: response.reasoningContent },
        });
      }

      // 处理响应内容
      if (response.content && onProgress) {
        onProgress({
          type: "content",
          data: { content: response.content },
        });
      }

      // 如果没有工具调用，返回响应
      if (!response.hasToolCalls || !response.toolCalls?.length) {
        lastContent = response.content ?? "";

        // 添加助手消息到会话
        this.sessions.addMessage(session, "assistant", lastContent);
        break;
      }

      // 执行工具调用
      const toolsUsed: string[] = [];
      const toolResults: Array<{
        callId: string;
        name: string;
        result: string;
      }> = [];

      for (const toolCall of response.toolCalls) {
        const result = await this._executeToolCall(toolCall, onProgress);
        toolResults.push({
          callId: toolCall.id,
          name: toolCall.name,
          result,
        });
        toolsUsed.push(toolCall.name);
      }

      // 添加助手消息（含工具调用）
      messages = contextBuilder.addAssistantMessage(messages, {
        content: response.content,
        toolCalls: response.toolCalls,
        reasoningContent: response.reasoningContent,
      });

      // 添加工具结果消息
      for (const { callId, name, result } of toolResults) {
        messages = contextBuilder.addToolResult(messages, {
          toolCallId: callId,
          toolName: name,
          result,
        });
      }

      // 记录使用的工具
      if (toolsUsed.length > 0 && onProgress) {
        onProgress({
          type: "tool_result",
          data: {
            toolName: toolsUsed.join(", "),
            toolResult: toolResults
              .map((r) => `${r.name}: ${r.result.slice(0, 100)}...`)
              .join("\n"),
          },
        });
      }
    }

    // 达到最大迭代次数
    if (iteration >= this.maxIterations) {
      const warning = `\n\n[已达到最大迭代次数 ${this.maxIterations}，可能存在循环调用]`;
      lastContent = (lastContent || "处理完成") + warning;
    }

    return lastContent;
  }

  // ============================================
  // 私有方法 - LLM 调用
  // ============================================

  /**
   * 调用 LLM（带重试机制）
   * @description 指数退避重试，最多 4 次
   */
  private async _callLLMWithRetry(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    onProgress?: ProgressCallback,
  ): Promise<LLMResponse> {
    // 发射 LLM 请求开始事件
    this.bus.emit("LLM_REQUEST_START", {
      messages: messages.map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : "[多部分消息]",
      })),
      model: this.model,
    });

    const startTime = Date.now();

    // 调用 LLM（带重试）
    const response = await retryWithBackoff<LLMResponse>({
      maxRetries: MAX_LLM_RETRIES,
      delays: RETRY_DELAYS,
      fn: async () => {
        return await this.provider.chat({
          messages,
          tools,
          model: this.model,
          temperature: this.temperature,
          maxTokens: this.maxTokens,
        });
      },
      onError: (error, attempt) => {
        const attemptNumber = attempt + 1;
        logger.error(
          {
            attempt: attemptNumber,
            maxRetries: MAX_LLM_RETRIES,
            error: error.message,
          },
          "LLM 调用失败",
        );

        if (attemptNumber < MAX_LLM_RETRIES && onProgress) {
          onProgress({
            type: "error",
            data: {
              error: `LLM 调用失败，${(RETRY_DELAYS[attempt] ?? 8000) / 1000}秒后重试 (${attemptNumber}/${MAX_LLM_RETRIES})`,
            },
          });
        }
      },
    });

    const duration = Date.now() - startTime;

    // 发射 LLM 响应事件
    this.bus.emit("LLM_RESPONSE", {
      response,
      duration,
    });

    return response;
  }

  // ============================================
  // 私有方法 - 工具执行
  // ============================================

  /**
   * 执行工具调用
   */
  private async _executeToolCall(
    toolCall: ToolCall,
    onProgress?: ProgressCallback,
  ): Promise<string> {
    const { id, name, arguments: args } = toolCall;

    // 通知进度
    if (onProgress) {
      onProgress({
        type: "tool_call",
        data: {
          toolName: name,
          toolArgs: args,
        },
      });
    }

    // 发射工具调用开始事件
    this.bus.emit("TOOL_CALL_START", {
      toolName: name,
      args,
      callId: id,
    });

    const startTime = Date.now();

    try {
      // 执行工具
      const result = await this.tools.execute(name, args);
      const duration = Date.now() - startTime;

      // 发射工具调用结束事件
      this.bus.emit("TOOL_CALL_END", {
        toolName: name,
        result,
        success: true,
        duration,
      });

      // 通知进度
      if (onProgress) {
        onProgress({
          type: "tool_result",
          data: {
            toolName: name,
            toolResult: result,
          },
        });
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const duration = Date.now() - startTime;

      // 发射工具调用结束事件（失败）
      this.bus.emit("TOOL_CALL_END", {
        toolName: name,
        result: message,
        success: false,
        duration,
      });

      // 返回错误信息，让 LLM 尝试其他方式
      return `工具 ${name} 执行失败: ${message}\n\n[分析上述错误并尝试其他方式。]`;
    }
  }

  // ============================================
  // 私有方法 - 斜杠命令
  // ============================================

  /**
   * 处理斜杠命令
   */
  private async _handleSlashCommand(
    content: string,
    session: Session,
  ): Promise<string> {
    const whitespaceRegex = new RE2("\\s+", "g");
    const command = content.toLowerCase().split(whitespaceRegex)[0];

    switch (command) {
      case "/new": {
        // 触发全量归档
        const memoryStore = this._getMemoryStore(session.key);

        if (session.messages.length > 0) {
          await memoryStore.consolidate({
            session,
            provider: this.provider,
            model: this.model,
            archiveAll: true,
            memoryWindow: this.memoryWindow,
          });
        }

        // 清空会话
        this.sessions.clear(session);
        await this.sessions.save(session);

        // 清理对应的缓存
        this._cleanupCaches(session.key);

        return "已开始新会话，历史消息已归档到记忆系统。";
      }

      case "/help": {
        return this._getHelpText();
      }

      default:
        return `未知命令: ${command}\n\n可用命令:\n${this._getHelpText()}`;
    }
  }

  /**
   * 获取帮助文本
   */
  private _getHelpText(): string {
    return `
可用命令:
  /new    - 开始新会话，清空当前对话历史并触发记忆归档
  /help   - 显示此帮助信息

其他说明:
- 支持多轮对话，会自动记住上下文
- 支持工具调用，AI 可以执行文件操作、运行命令等
- 对话历史会自动压缩到长期记忆中
`.trim();
  }

  // ============================================
  // 私有方法 - 记忆管理
  // ============================================

  /**
   * 触发记忆整合
   * @description 当消息数量超过阈值时，自动整合旧消息到记忆系统
   */
  private async _consolidateMemory(session: Session): Promise<void> {
    // 检查是否需要整合
    const unconsolidated = Math.max(
      0,
      session.messages.length - session.lastConsolidated,
    );
    const threshold = Math.floor(
      this.memoryWindow * CONSOLIDATION_THRESHOLD_RATIO,
    );

    if (unconsolidated < threshold) {
      return;
    }

    const memoryStore = this._getMemoryStore(session.key);

    logger.info({ unconsolidated, threshold }, "触发记忆整合");

    try {
      await memoryStore.consolidate({
        session,
        provider: this.provider,
        model: this.model,
        memoryWindow: this.memoryWindow,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error({ error: message }, "记忆整合失败");
    }
  }

  // ============================================
  // 私有方法 - 缓存管理
  // ============================================

  /**
   * 获取或创建上下文构建器
   */
  private _getContextBuilder(sessionKey: string): ContextBuilder {
    let builder = this.contextBuilders.get(sessionKey);

    if (!builder) {
      const memoryStore = this._getMemoryStore(sessionKey);
      const skillsLoader = this._getSkillsLoader(sessionKey);

      builder = new ContextBuilder(this.workspace, memoryStore, skillsLoader);

      this._evictIfNeeded();
      this.contextBuilders.set(sessionKey, builder);
    }

    return builder;
  }

  /**
   * 获取或创建记忆存储
   */
  private _getMemoryStore(sessionKey: string): MemoryStore {
    let store = this.memoryStores.get(sessionKey);

    if (!store) {
      store = new MemoryStore(this.workspace);
      this._evictIfNeeded();
      this.memoryStores.set(sessionKey, store);
    }

    return store;
  }

  /**
   * 获取或创建技能加载器
   */
  private _getSkillsLoader(sessionKey: string): SkillsLoader {
    let loader = this.skillsLoaders.get(sessionKey);

    if (!loader) {
      loader = new SkillsLoader(this.workspace);
      this._evictIfNeeded();
      this.skillsLoaders.set(sessionKey, loader);
    }

    return loader;
  }

  /**
   * 清理会话缓存
   * @param sessionKey 会话键
   */
  private _cleanupCaches(sessionKey: string): void {
    this.contextBuilders.delete(sessionKey);
    this.memoryStores.delete(sessionKey);
    this.skillsLoaders.delete(sessionKey);
  }

  /**
   * 如果需要，淘汰最旧的缓存项（LRU）
   */
  private _evictIfNeeded(): void {
    // 获取所有缓存键，按插入顺序（LRU）
    const keys = Array.from(this.contextBuilders.keys());

    // 持续淘汰直到满足大小限制
    while (keys.length > AgentLoop.MAX_CACHE_SIZE) {
      const keyToEvict = keys.shift()!;
      this._cleanupCaches(keyToEvict);
      logger.info({ key: keyToEvict }, "缓存淘汰");
    }
  }
}
