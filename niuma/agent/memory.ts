/**
 * 记忆系统 - 双层记忆架构
 *
 * @description 实现双层记忆结构：
 * - MEMORY.md - 长期结构化知识
 * - HISTORY.md - 时间线日志（grep 可搜索）
 *
 * @see 参考 nanobot: https://github.com/HKUDS/nanobot/blob/main/nanobot/agent/memory.py
 */

import { readFile, writeFile, appendFile, rename } from "fs/promises";
import { join } from "path";
import * as fs from "fs-extra";
import { sanitizeObject } from "../utils/sanitize";
import { createLogger } from "../log";
import type { ToolDefinition } from "../types";
import type { Session, SessionMessage } from "../session/manager";
import type { LLMProvider } from "../providers/base";

const logger = createLogger("memory");

/**
 * 记忆整合选项
 */
export interface ConsolidateOptions {
  /** 会话对象 */
  session: Session;
  /** LLM 提供商 */
  provider: LLMProvider;
  /** 使用的模型 */
  model: string;
  /** 是否全量归档（默认 false） */
  archiveAll?: boolean;
  /** 记忆窗口大小 */
  memoryWindow: number;
}

/**
 * save_memory 工具定义
 * @description 用于 LLM 调用以保存记忆整合结果
 */
export const SAVE_MEMORY_TOOL: ToolDefinition = {
  name: "save_memory",
  description: "Save the memory consolidation result to persistent storage.",
  parameters: {
    type: "object",
    properties: {
      history_entry: {
        type: "string",
        description:
          "A paragraph (2-5 sentences) summarizing key events/decisions/topics. " +
          "Start with [YYYY-MM-DD HH:MM]. Include detail useful for grep search.",
      },
      memory_update: {
        type: "string",
        description:
          "Full updated long-term memory as markdown. Include all existing " +
          "facts plus new ones. Return unchanged if nothing new.",
      },
    },
    required: ["history_entry", "memory_update"],
  },
};

/**
 * 记忆存储类
 * @description 实现双层记忆：MEMORY.md（长期记忆）+ HISTORY.md（时间线日志）
 * 存储位置：workspace/memory/
 */
export class MemoryStore {
  // ============================================
  // 属性
  // ============================================

  /** 记忆目录路径 */
  private readonly memoryDir: string;
  /** MEMORY.md 文件路径 */
  private readonly memoryFile: string;
  /** HISTORY.md 文件路径 */
  private readonly historyFile: string;

  // ============================================
  // 构造函数
  // ============================================

  /**
   * 创建记忆存储实例
   * @param workspace 工作区根目录，记忆将存储在 workspace/memory/
   */
  constructor(workspace: string) {
    this.memoryDir = join(workspace, "memory");
    this.memoryFile = join(this.memoryDir, "MEMORY.md");
    this.historyFile = join(this.memoryDir, "HISTORY.md");
  }

  // ============================================
  // 公共方法 - 文件操作
  // ============================================

  /**
   * 读取长期记忆
   * @description 从 MEMORY.md 读取长期结构化知识
   * @returns 记忆内容，如果文件不存在则返回空字符串
   */
  async readLongTerm(): Promise<string> {
    try {
      return await readFile(this.memoryFile, "utf-8");
    } catch {
      return "";
    }
  }

  /**
   * 写入长期记忆
   * @description 覆盖写入 MEMORY.md（使用原子写入避免竞态条件）
   * @param content 要写入的内容
   */
  async writeLongTerm(content: string): Promise<void> {
    await fs.ensureDir(this.memoryDir);
    // 使用原子写入：先写入临时文件，然后重命名
    const tempPath = `${this.memoryFile}.tmp`;
    await writeFile(tempPath, content, "utf-8");
    await rename(tempPath, this.memoryFile);
  }

  /**
   * 追加历史条目
   * @description 将条目追加到 HISTORY.md
   * @param entry 历史条目内容
   */
  async appendHistory(entry: string): Promise<void> {
    await fs.ensureDir(this.memoryDir);
    // 追加条目并添加换行
    await appendFile(this.historyFile, entry.trimEnd() + "\n\n", "utf-8");
  }

  /**
   * 获取记忆上下文
   * @description 格式化长期记忆用于 System Prompt 注入
   * @returns 格式化的记忆上下文，如果记忆为空则返回空字符串
   */
  async getMemoryContext(): Promise<string> {
    const longTerm = await this.readLongTerm();
    if (!longTerm) {
      return "";
    }
    return `## Long-term Memory\n${longTerm}`;
  }

  // ============================================
  // 公共方法 - 记忆整合
  // ============================================

  /**
   * 整合记忆
   * @description 通过 LLM 工具调用将会话历史整合到记忆系统
   * @param options 整合选项
   * @returns 整合是否成功
   */
  async consolidate(options: ConsolidateOptions): Promise<boolean> {
    const {
      session,
      provider,
      model,
      archiveAll = false,
      memoryWindow,
    } = options;

    let oldMessages: SessionMessage[];
    let keepCount = 0;

    if (archiveAll) {
      // 全量归档模式：整合所有消息
      oldMessages = session.messages;
      logger.info(
        { totalMessages: session.messages.length },
        "Memory 全量归档",
      );
    } else {
      // 增量整合模式：只整合超出窗口的旧消息
      keepCount = Math.floor(memoryWindow / 2);

      // 如果消息数量不超过保留数量，无需整合
      if (session.messages.length <= keepCount) {
        return true;
      }

      // 如果没有新消息需要整合，跳过
      if (session.messages.length - session.lastConsolidated <= 0) {
        return true;
      }

      // 提取需要整合的消息段
      oldMessages = session.messages.slice(
        session.lastConsolidated,
        -keepCount,
      );

      if (oldMessages.length === 0) {
        return true;
      }

      logger.info(
        { oldMessagesCount: oldMessages.length, keepCount },
        "Memory 增量整合",
      );
    }

    // 格式化消息为文本
    const lines = this._formatMessagesForConsolidation(oldMessages);

    if (lines.length === 0) {
      return true;
    }

    // 获取当前长期记忆
    const currentMemory = await this.readLongTerm();

    // 构建整合提示词
    const prompt = this._buildConsolidationPrompt(currentMemory, lines);

    try {
      // 调用 LLM 进行记忆整合
      const response = await provider.chat({
        messages: [
          {
            role: "system",
            content:
              "You are a memory consolidation agent. Call the save_memory tool with your consolidation of the conversation.",
          },
          { role: "user", content: prompt },
        ],
        tools: [SAVE_MEMORY_TOOL],
        model,
      });

      // 检查是否有工具调用
      if (!response.hasToolCalls || !response.toolCalls?.length) {
        logger.warn("LLM 未调用 save_memory 工具，跳过整合");
        return false;
      }

      // 解析工具调用参数
      const args = this._parseToolCallArguments(
        response.toolCalls[0].arguments,
      );

      if (!args) {
        logger.warn("工具调用参数解析失败");
        return false;
      }

      // 处理历史条目
      const entry = args.history_entry;
      if (entry) {
        const entryStr =
          typeof entry === "string" ? entry : JSON.stringify(entry);
        await this.appendHistory(entryStr);
      }

      // 处理记忆更新
      const update = args.memory_update;
      if (update) {
        const updateStr =
          typeof update === "string" ? update : JSON.stringify(update);
        // 只有内容变化时才写入
        if (updateStr !== currentMemory) {
          await this.writeLongTerm(updateStr);
        }
      }

      // 更新会话的整合标记
      session.lastConsolidated = archiveAll
        ? 0
        : session.messages.length - keepCount;

      logger.info(
        {
          totalMessages: session.messages.length,
          lastConsolidated: session.lastConsolidated,
        },
        "Memory 整合完成",
      );

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error({ error: message }, "Memory 整合失败");
      return false;
    }
  }

  /**
   * 格式化消息用于整合
   * @description 将会话消息转换为易读的文本格式
   * @param messages 消息列表
   * @returns 格式化后的行数组
   */
  private _formatMessagesForConsolidation(
    messages: SessionMessage[],
  ): string[] {
    const lines: string[] = [];

    for (const msg of messages) {
      if (!msg.content) {
        continue;
      }

      // 格式化时间戳
      const timestamp = msg.timestamp?.slice(0, 16) || "?";

      // 格式化使用的工具
      const toolsInfo = msg.toolsUsed?.length
        ? ` [tools: ${msg.toolsUsed.join(", ")}]`
        : "";

      // 格式化消息行
      lines.push(
        `[${timestamp}] ${msg.role.toUpperCase()}${toolsInfo}: ${msg.content}`,
      );
    }

    return lines;
  }

  /**
   * 构建整合提示词
   * @description 生成发送给 LLM 的整合提示
   * @param currentMemory 当前长期记忆
   * @param conversationLines 对话行数组
   * @returns 完整的提示词
   */
  private _buildConsolidationPrompt(
    currentMemory: string,
    conversationLines: string[],
  ): string {
    const memorySection = currentMemory || "(empty)";

    return `Process this conversation and call the save_memory tool with your consolidation.

## Current Long-term Memory
${memorySection}

## Conversation to Process
${conversationLines.join("\n")}`;
  }

  /**
   * 解析工具调用参数（安全模式）
   * @description 处理不同提供商返回的参数格式差异，并进行安全验证
   * @param args 原始参数（可能是对象、字符串或数组）
   * @returns 解析后的参数对象，解析失败返回 null
   */
  private _parseToolCallArguments(
    args: Record<string, unknown> | string | unknown[],
  ): Record<string, unknown> | null {
    // 字符串格式，尝试 JSON 解析
    if (typeof args === "string") {
      try {
        const parsed = JSON.parse(args);
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed)
        ) {
          return sanitizeObject(parsed, { keepNull: true });
        }
      } catch {
        logger.warn("JSON 解析参数失败");
        return null;
      }
      return null;
    }

    // 数组格式的特殊情况
    if (Array.isArray(args)) {
      logger.warn("工具参数为数组格式，只使用第一个元素");
      if (
        args.length > 0 &&
        typeof args[0] === "object" &&
        args[0] !== null &&
        !Array.isArray(args[0])
      ) {
        return sanitizeObject(args[0] as Record<string, unknown>, { keepNull: true });
      }
      return null;
    }

    // 已经是对象，进行安全清理
    if (typeof args === "object" && args !== null && !Array.isArray(args)) {
      return sanitizeObject(args, { keepNull: true });
    }

    logger.warn({ type: typeof args }, "未知的参数类型");
    return null;
  }
}
