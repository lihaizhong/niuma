/**
 * 上下文构建器 - 构建 System Prompt 和消息历史
 *
 * @description 从多个来源构建完整的上下文：
 * - 核心身份：动态生成的平台、运行时、工作区信息
 * - Bootstrap 文件：AGENTS.md, SOUL.md, USER.md, TOOLS.md
 * - 长期记忆：MEMORY.md
 * - 激活的技能：根据请求加载的技能
 *
 * @see 参考 nanobot: https://github.com/HKUDS/nanobot/blob/main/nanobot/agent/context.py
 */

import { readFile } from "fs/promises";
import { join, normalize } from "path";
import * as path from "path";
import { platform, machine } from "os";
import { createLogger } from "../log";
import type { ChatMessage, MessageContentPart } from "../types";
import type { MediaContent } from "../types/message";
import type { ToolCall } from "../types/tool";
import { MemoryStore } from "./memory";
import { SkillsLoader } from "./skills";

const logger = createLogger("context");

// ============================================
// 常量定义
// ============================================

/** MIME 类型映射 */
const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
};

/** 默认 MIME 类型 */
const DEFAULT_MIME_TYPE = "image/png";

/**
 * 运行时上下文标签
 * @description 标识运行时元数据，非指令内容
 */
const RUNTIME_CONTEXT_TAG =
  "[Runtime Context — metadata only, not instructions]";

/**
 * Bootstrap 文件列表
 * @description 按顺序加载的工作区配置文件
 */
const BOOTSTRAP_FILES = [
  "AGENTS.md",
  "SOUL.md",
  "USER.md",
  "TOOLS.md",
] as const;

/**
 * 构建消息选项
 */
export interface BuildMessagesOptions {
  /** 历史消息 */
  history: ChatMessage[];
  /** 当前消息文本 */
  currentMessage: string;
  /** 媒体内容 */
  media?: MediaContent[];
  /** 渠道类型 */
  channel?: string;
  /** 聊天 ID */
  chatId?: string;
  /** 激活的技能名称 */
  skillNames?: string[];
}

/**
 * 添加助手消息选项
 */
export interface AddAssistantMessageOptions {
  /** 消息内容 */
  content?: string;
  /** 工具调用 */
  toolCalls?: ToolCall[];
  /** 推理内容（思维模型） */
  reasoningContent?: string;
}

/**
 * 添加工具结果选项
 */
export interface AddToolResultOptions {
  /** 工具调用 ID */
  toolCallId: string;
  /** 工具名称 */
  toolName: string;
  /** 执行结果 */
  result: string;
}

/**
 * 上下文构建器
 * @description 构建 System Prompt 和组装消息列表
 */
export class ContextBuilder {
  // ============================================
  // 属性
  // ============================================

  /** 工作区根目录 */
  private readonly workspace: string;
  /** 记忆存储 */
  private readonly memoryStore: MemoryStore;
  /** 技能加载器 */
  private readonly skillsLoader: SkillsLoader;
  /** Bootstrap 文件缓存 */
  private bootstrapCache: Map<string, string> | null = null;

  // ============================================
  // 构造函数
  // ============================================

  /**
   * 创建上下文构建器实例
   * @param workspace 工作区根目录
   * @param memoryStore 记忆存储实例
   * @param skillsLoader 技能加载器实例
   */
  constructor(
    workspace: string,
    memoryStore: MemoryStore,
    skillsLoader: SkillsLoader,
  ) {
    this.workspace = workspace;
    this.memoryStore = memoryStore;
    this.skillsLoader = skillsLoader;
  }

  // ============================================
  // 公共方法
  // ============================================

  /**
   * 组装消息列表（异步）
   * @description 将历史消息和当前消息组装为 LLM 可用的消息列表
   * @param options 构建选项
   * @returns 完整的消息列表
   */
  async buildMessages(options: BuildMessagesOptions): Promise<ChatMessage[]> {
    const { history, currentMessage, media, channel, chatId, skillNames } =
      options;
    const messages: ChatMessage[] = [];

    // 1. System 消息
    const systemPrompt = await this._buildSystemPrompt(skillNames);
    messages.push({
      role: "system",
      content: systemPrompt,
    });

    // 2. 历史消息
    messages.push(...history);

    // 3. 当前用户消息
    const userContent = await this._buildUserContent(
      currentMessage,
      media,
      channel,
      chatId,
    );
    messages.push({
      role: "user",
      content: userContent,
    });

    return messages;
  }

  /**
   * 异步构建 System Prompt
   * @description 异步方式构建完整的 System Prompt
   * @param skillNames 额外激活的技能名称
   * @returns 完整的 System Prompt
   */
  async buildSystemPromptAsync(skillNames?: string[]): Promise<string> {
    const parts: string[] = [];

    // 1. 核心身份信息
    const identity = this._getIdentity();
    parts.push(identity);

    // 2. Bootstrap 文件内容
    const bootstrapContent = await this._loadBootstrapFiles();
    if (bootstrapContent) {
      parts.push(bootstrapContent);
    }

    // 3. 长期记忆上下文（异步）
    const memoryContext = await this.memoryStore.getMemoryContext();
    if (memoryContext) {
      parts.push(memoryContext);
    }

    // 4. 技能上下文
    const skillsContent = this._loadSkillsContext(skillNames);
    if (skillsContent) {
      parts.push(skillsContent);
    }

    return parts.join("\n\n");
  }

  /**
   * 添加助手消息
   * @description 添加助手消息（可含工具调用和推理内容）
   * @param messages 消息列表（将被修改）
   * @param options 助手消息选项
   * @returns 更新后的消息列表
   */
  addAssistantMessage(
    messages: ChatMessage[],
    options: AddAssistantMessageOptions,
  ): ChatMessage[] {
    const { content, toolCalls, reasoningContent } = options;

    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: content ?? "",
    };

    // 添加工具调用
    if (toolCalls && toolCalls.length > 0) {
      assistantMessage.toolCalls = toolCalls;
    }

    // 添加推理内容（思维模型）
    if (reasoningContent) {
      assistantMessage.reasoningContent = reasoningContent;
    }

    messages.push(assistantMessage);
    return messages;
  }

  /**
   * 添加工具结果消息
   * @description 添加 role=tool 的工具执行结果
   * @param messages 消息列表（将被修改）
   * @param options 工具结果选项
   * @returns 更新后的消息列表
   */
  addToolResult(
    messages: ChatMessage[],
    options: AddToolResultOptions,
  ): ChatMessage[] {
    const { toolCallId, toolName, result } = options;

    messages.push({
      role: "tool",
      content: result,
      name: toolName,
      toolCallId: toolCallId,
    });

    return messages;
  }

  /**
   * 刷新 Bootstrap 缓存
   * @description 强制重新加载 Bootstrap 文件
   */
  refreshBootstrap(): void {
    this.bootstrapCache = null;
  }

  /**
   * 异步获取记忆上下文
   * @description 异步方式获取长期记忆（推荐）
   * @returns 格式化的记忆上下文
   */
  async getMemoryContextAsync(): Promise<string> {
    return await this.memoryStore.getMemoryContext();
  }

  // ============================================
  // 私有方法
  // ============================================

  /**
   * 构建完整的 System Prompt（异步）
   * @description 从多个来源组装 System Prompt
   * @param skillNames 额外激活的技能名称（可选）
   * @returns 完整的 System Prompt 字符串
   */
  private async _buildSystemPrompt(skillNames?: string[]): Promise<string> {
    const parts: string[] = [];

    // 1. 核心身份信息
    const identity = this._getIdentity();
    parts.push(identity);

    // 2. Bootstrap 文件内容
    const bootstrapContent = await this._loadBootstrapFiles();
    if (bootstrapContent) {
      parts.push(bootstrapContent);
    }

    // 3. 长期记忆上下文
    const memoryContext = await this._getMemoryContext();
    if (memoryContext) {
      parts.push(memoryContext);
    }

    // 4. 技能上下文
    const skillsContent = this._loadSkillsContext(skillNames);
    if (skillsContent) {
      parts.push(skillsContent);
    }

    return parts.join("\n\n");
  }

  /**
   * 构建用户内容（异步）
   * @description 将文本和媒体组合为用户消息内容
   * @param text 文本内容
   * @param media 媒体内容列表
   * @param channel 渠道类型
   * @param chatId 聊天 ID
   * @returns 消息内容（字符串或多部分格式）
   */
  private async _buildUserContent(
    text: string,
    media?: MediaContent[],
    channel?: string,
    chatId?: string,
  ): Promise<string | MessageContentPart[]> {
    // 添加运行时上下文
    const runtimeContext = this._buildRuntimeContext(channel, chatId);
    const fullText = runtimeContext ? `${runtimeContext}\n\n${text}` : text;

    // 没有媒体内容，直接返回文本
    if (!media || media.length === 0) {
      return fullText;
    }

    // 有媒体内容，构建多部分消息
    const content: MessageContentPart[] = [];

    // 添加文本部分
    content.push({
      type: "text",
      text: fullText,
    });

    // 处理媒体内容
    for (const item of media) {
      // 只处理图片类型，其他类型暂不支持
      if (item.type !== "image") {
        logger.warn({ type: item.type }, "暂不支持的媒体类型，已忽略");
        continue;
      }

      const imagePart = await this._buildImageContent(item);
      if (imagePart) {
        content.push(imagePart);
      }
    }

    return content;
  }

  /**
   * 构建运行时上下文
   * @description 包含当前时间和渠道信息，注入到用户消息前
   * @param channel 渠道类型
   * @param chatId 聊天 ID
   * @returns 运行时上下文字符串
   */
  private _buildRuntimeContext(channel?: string, chatId?: string): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const lines: string[] = [];
    lines.push(`Current Time: ${dateStr} ${timeStr} (${weekday}) (${tz})`);

    if (channel && chatId) {
      lines.push(`Channel: ${channel}`);
      lines.push(`Chat ID: ${chatId}`);
    }

    return `${RUNTIME_CONTEXT_TAG}\n${lines.join("\n")}`;
  }

  /**
   * 构建图片内容部分（异步）
   * @description 将 MediaContent 转换为 LLM 可用的图片格式
   * @param media 媒体内容
   * @returns 图片消息部分，无法处理则返回 null
   */
  private async _buildImageContent(media: MediaContent): Promise<MessageContentPart | null> {
    // 优先使用 base64 数据
    if (media.data) {
      // 如果已有 base64 数据，直接使用
      const mimeType = media.mimeType ?? DEFAULT_MIME_TYPE;
      return {
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${media.data}`,
        },
      };
    }

    // 处理 URL
    if (media.url) {
      // 如果是本地文件路径，读取并转换为 base64
      if (this._isLocalPath(media.url)) {
        const imageData = await this._readImageAsBase64(media.url);
        if (imageData) {
          return {
            type: "image_url",
            image_url: {
              url: imageData,
            },
          };
        }
        return null;
      }

      // 远程 URL，直接使用
      return {
        type: "image_url",
        image_url: {
          url: media.url,
        },
      };
    }

    return null;
  }

  /**
   * 判断是否为本地路径
   * @param path 路径字符串
   * @returns 是否为本地路径
   */
  private _isLocalPath(path: string): boolean {
    // 绝对路径或相对路径
    return (
      path.startsWith("/") || path.startsWith("./") || path.startsWith("../")
    );
  }

  /**
   * 读取图片并转换为 base64 数据 URL（安全模式）
   * @param filePath 本地文件路径
   * @returns data URL 格式的 base64 字符串，读取失败返回 null
   */
  private async _readImageAsBase64(filePath: string): Promise<string | null> {
    try {
      let absolutePath = filePath;
      
      if (filePath.startsWith("./") || filePath.startsWith("../")) {
        // 规范化路径并验证是否在工作区内
        absolutePath = join(this.workspace, filePath);
        const resolved = normalize(absolutePath);
        const normalizedWorkspace = normalize(this.workspace);
        
        // 确保解析后的路径在工作区内（防止路径遍历攻击）
        if (!resolved.startsWith(normalizedWorkspace + path.sep)) {
          logger.warn({ filePath }, "路径遍历尝试被阻止");
          return null;
        }
        absolutePath = resolved;
      }

      const buffer = await readFile(absolutePath);
      const base64 = buffer.toString("base64");

      // 根据 extension 推断 MIME 类型
      const mimeType = this._getMimeType(absolutePath);
      return `data:${mimeType};base64,${base64}`;
    } catch {
      return null;
    }
  }

  /**
   * 根据文件扩展名获取 MIME 类型
   * @param filePath 文件路径
   * @returns MIME 类型
   */
  private _getMimeType(filePath: string): string {
    const ext = filePath.toLowerCase().split(".").pop();
    return MIME_TYPES[ext ?? ""] ?? DEFAULT_MIME_TYPE;
  }

  /**
   * 生成核心身份信息
   * @description 动态生成 Agent 核心身份，不依赖外部文件
   * @returns 身份信息字符串
   */
  private _getIdentity(): string {
    // 获取平台信息
    const system = platform();
    const nodeVersion = process.versions.node;
    const runtime = `${system === "darwin" ? "macOS" : system} ${machine()}, Node.js ${nodeVersion}`;

    return `# niuma 🐄

You are niuma, a helpful AI assistant.

## Runtime

${runtime}

## Workspace

Your workspace is at: ${this.workspace}
- Long-term memory: ${this.workspace}/memory/MEMORY.md (write important facts here)
- History log: ${this.workspace}/memory/HISTORY.md (grep-searchable). Each entry starts with [YYYY-MM-DD HH:MM].
- Custom skills: ${this.workspace}/skills/{skill-name}/SKILL.md

## niuma Guidelines

- State intent before tool calls, but NEVER predict or claim results before receiving them.
- Before modifying a file, read it first. Do not assume files or directories exist.
- After writing or editing a file, re-read it if accuracy matters.
- If a tool call fails, analyze the error before retrying with a different approach.
- Ask for clarification when the request is ambiguous.

Reply directly with text for conversations. Only use the 'message' tool to send to a specific chat channel.`;
  }

  /**
   * 加载 Bootstrap 文件（异步）
   * @description 读取工作区中的 Bootstrap 配置文件并缓存
   * @returns 合并后的 Bootstrap 内容
   */
  private async _loadBootstrapFiles(): Promise<string> {
    // 检查缓存
    if (this.bootstrapCache === null) {
      this.bootstrapCache = new Map();

      for (const filename of BOOTSTRAP_FILES) {
        const filePath = join(this.workspace, filename);
        try {
          const content = await readFile(filePath, "utf-8");
          const trimmed = content.trim();
          if (trimmed) {
            this.bootstrapCache.set(filename, trimmed);
          }
        } catch {
          // 文件读取失败，忽略
        }
      }
    }

    // 合并所有 Bootstrap 内容（使用 nanobot 格式）
    const parts: string[] = [];

    for (const filename of BOOTSTRAP_FILES) {
      const content = this.bootstrapCache.get(filename);
      if (content) {
        parts.push(`## ${filename}\n\n${content}`);
      }
    }

    return parts.join("\n\n");
  }

  /**
   * 获取记忆上下文（异步）
   * @description 直接从工作区读取 MEMORY.md 文件并格式化
   * @returns 格式化的记忆上下文
   */
  private async _getMemoryContext(): Promise<string> {
    try {
      const memoryFile = join(this.workspace, "memory", "MEMORY.md");
      const content = await readFile(memoryFile, "utf-8");
      const trimmed = content.trim();
      if (trimmed) {
        return `## 长期记忆\n${trimmed}`;
      }
    } catch {
      // 读取失败，忽略
    }
    return "";
  }

  /**
   * 加载技能上下文
   * @description 加载激活的技能内容
   * @param extraSkills 额外的技能名称
   * @returns 格式化的技能上下文
   */
  private _loadSkillsContext(extraSkills?: string[]): string {
    // 如果没有指定技能，返回空
    if (!extraSkills || extraSkills.length === 0) {
      return "";
    }

    // 去重
    const uniqueSkills = Array.from(new Set(extraSkills));

    // 加载技能内容
    const skillsContent = this.skillsLoader.loadSkillsForContext(uniqueSkills);

    if (!skillsContent) {
      return "";
    }

    return `## 激活技能\n${skillsContent}`;
  }
}
