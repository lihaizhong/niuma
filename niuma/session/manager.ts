/**
 * 会话管理器 - 处理会话创建、持久化和历史记录
 * @description 提供会话的生命周期管理，包括创建、持久化、历史记录查询和清理
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
} from "node:fs";
import { readFile, writeFile, rename, unlink } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { createHash } from "node:crypto";
import type { ChatMessage } from "../types";

/**
 * 会话消息结构
 * @description 单条会话消息的完整信息
 */
export interface SessionMessage {
  /** 消息角色 */
  role: "user" | "assistant" | "system";
  /** 消息内容 */
  content: string;
  /** 消息时间戳 (ISO 格式) */
  timestamp: string;
  /** 使用的工具列表 */
  toolsUsed?: string[];
}

/**
 * 会话数据结构
 * @description 会话的完整状态信息
 */
export interface Session {
  /** 会话唯一标识 */
  key: string;
  /** 消息列表 */
  messages: SessionMessage[];
  /** 上次整合时间戳（用于记忆压缩） */
  lastConsolidated: number;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 会话管理器配置
 */
export interface SessionManagerConfig {
  /** 工作区目录 */
  workspace?: string;
  /** 会话存储目录（优先级高于默认值） */
  sessionsDir?: string;
}

/**
 * 会话管理器
 * @description 负责会话的创建、持久化和历史记录管理
 *
 * @example
 * ```typescript
 * // 使用默认配置（~/.niuma/sessions）
 * const manager = new SessionManager()
 *
 * // 直接指定会话目录
 * const manager = new SessionManager({ sessionsDir: '/path/to/sessions' })
 *
 * // 获取或创建会话
 * const session = manager.getOrCreate('cli:user-123')
 *
 * // 添加消息
 * manager.addMessage(session, 'user', 'Hello!')
 *
 * // 保存会话
 * manager.save(session)
 * ```
 */
export class SessionManager {
  /** 内存缓存（带时间戳） */
  private cache: Map<string, { session: Session; timestamp: number }> = new Map();
  
  /** 缓存 TTL（毫秒） */
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 分钟

  /** 会话存储目录 */
  private sessionsDir: string;

  /**
   * 创建会话管理器实例
   * @param config 配置选项
   * @description 存储位置优先级：sessionsDir > ~/.niuma/sessions
   */
  constructor(config?: SessionManagerConfig) {
    if (config?.sessionsDir) {
      this.sessionsDir = config.sessionsDir;
    } else {
      // 默认存储在 ~/.niuma/sessions/
      this.sessionsDir = join(homedir(), ".niuma", "sessions");
    }
  }

  /**
   * 获取或创建会话
   * @description 如果会话存在则从缓存或文件加载，否则创建新会话（异步）
   * @param sessionKey 会话标识
   * @returns 会话对象
   */
  async getOrCreate(sessionKey: string): Promise<Session> {
    const now = Date.now();
    
    // 优先从内存缓存获取（检查是否过期）
    const cached = this.cache.get(sessionKey);
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.session;
    }
    
    // 缓存过期，删除
    if (cached) {
      this.cache.delete(sessionKey);
    }

    // 尝试从文件加载
    const session = await this._loadFromFile(sessionKey);
    if (session) {
      this.cache.set(sessionKey, { session, timestamp: now });
      return session;
    }

    // 创建新会话
    const newSession: Session = {
      key: sessionKey,
      messages: [],
      lastConsolidated: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.cache.set(sessionKey, { session: newSession, timestamp: now });
    return newSession;
  }

  /**
   * 保存会话到文件
   * @description 将会话数据持久化到文件系统（异步原子写入）
   * @param session 会话对象
   */
  async save(session: Session): Promise<void> {
    session.updatedAt = new Date();

    // 确保目录存在
    if (!existsSync(this.sessionsDir)) {
      mkdirSync(this.sessionsDir, { recursive: true });
    }

    // 使用原子写入：先写入临时文件，然后重命名
    const filePath = this._getSessionFilePath(session.key);
    const tempPath = `${filePath}.tmp`;
    const data = JSON.stringify(session, null, 2);

    try {
      await writeFile(tempPath, data, "utf-8");
      await rename(tempPath, filePath); // 使用异步重命名
    } catch (error) {
      // 清理临时文件
      try {
        await unlink(tempPath);
      } catch {
        // 忽略清理失败
      }
      throw error;
    }

    // 更新缓存
    this.cache.set(session.key, { session, timestamp: Date.now() });
  }

  /**
   * 获取会话历史记录
   * @description 将 SessionMessage 转换为 ChatMessage 格式，用于 LLM 调用
   * @param session 会话对象
   * @param maxMessages 最大消息数量
   * @returns ChatMessage 格式的消息列表
   */
  getHistory(session: Session, maxMessages: number): ChatMessage[] {
    return session.messages
      .slice(-maxMessages)
      .map(({ role, content }) => ({ role, content }));
  }

  /**
   * 添加消息到会话
   * @description 创建新的会话消息并追加到消息列表
   * @param session 会话对象
   * @param role 消息角色
   * @param content 消息内容
   * @param toolsUsed 使用的工具列表（可选）
   */
  addMessage(
    session: Session,
    role: SessionMessage["role"] | string,
    content: string,
    toolsUsed?: string[],
  ): void {
    const validRoles: SessionMessage["role"][] = ['user', 'assistant', 'system']
    const safeRole = validRoles.includes(role as SessionMessage["role"])
      ? (role as SessionMessage["role"])
      : 'user'  // 默认值

    session.messages.push({
      role: safeRole,
      content,
      timestamp: new Date().toISOString(),
      toolsUsed,
    });
    session.updatedAt = new Date();
  }

  /**
   * 清空会话消息
   * @description 重置会话消息列表和整合时间戳
   * @param session 会话对象
   */
  clear(session: Session): void {
    session.messages = [];
    session.lastConsolidated = 0;
    session.updatedAt = new Date();
  }

  /**
   * 使会话缓存失效
   * @description 从内存缓存中移除会话，不影响文件存储
   * @param sessionKey 会话标识
   */
  invalidate(sessionKey: string): void {
    this.cache.delete(sessionKey);
  }

  /**
   * 清理过期缓存
   * @description 删除所有过期的缓存项
   */
  private _cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 删除会话（包括文件）
   * @description 从内存缓存和文件系统中彻底删除会话
   * @param sessionKey 会话标识
   */
  delete(sessionKey: string): void {
    this.cache.delete(sessionKey);

    const filePath = this._getSessionFilePath(sessionKey);
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch {
      // 文件删除失败时忽略错误
    }
  }

  /**
   * 获取所有会话键
   * @description 列出存储目录中的所有会话标识
   * @returns 会话键列表
   */
  listSessions(): string[] {
    try {
      if (!existsSync(this.sessionsDir)) {
        return [];
      }
      const files = readdirSync(this.sessionsDir);
      return files
        .filter((file) => file.endsWith(".json"))
        .map((file) => file.slice(0, -5));
    } catch {
      return [];
    }
  }

  /**
   * 获取会话存储目录
   * @returns 当前配置的会话存储目录路径
   */
  getSessionsDir(): string {
    return this.sessionsDir;
  }

  /**
   * 批量添加消息
   * @description 一次性添加多条消息，减少重复更新时间戳
   * @param session 会话对象
   * @param messages 消息列表
   */
  addMessages(
    session: Session,
    messages: Array<{
      role: SessionMessage["role"];
      content: string;
      toolsUsed?: string[];
    }>,
  ): void {
    const now = new Date();
    const timestamp = now.toISOString();

    for (const msg of messages) {
      session.messages.push({
        role: msg.role,
        content: msg.content,
        timestamp,
        toolsUsed: msg.toolsUsed,
      });
    }

    session.updatedAt = now;
  }

  /**
   * 更新整合时间戳
   * @description 记录最后一次记忆整合的时间点
   * @param session 会话对象
   */
  updateConsolidated(session: Session): void {
    session.lastConsolidated = Date.now();
    session.updatedAt = new Date();
  }

  // ==================== 私有方法 ====================

  /**
   * 获取会话文件路径
   * @description 使用 SHA256 hash 生成安全的文件名，防止路径遍历攻击
   * @param sessionKey 会话标识
   * @returns 文件完整路径
   */
  private _getSessionFilePath(sessionKey: string): string {
    const hash = createHash("sha256")
      .update(sessionKey)
      .digest("hex")
      .substring(0, 16);
    return join(this.sessionsDir, `session_${hash}.json`);
  }

  /**
   * 从文件加载会话
   * @description 读取并解析会话文件，转换日期字段（异步）
   * @param sessionKey 会话标识
   * @returns 会话对象或 null（文件不存在或解析失败时）
   */
  private async _loadFromFile(sessionKey: string): Promise<Session | null> {
    const filePath = this._getSessionFilePath(sessionKey);

    try {
      if (!existsSync(filePath)) {
        return null;
      }

      const data = await readFile(filePath, "utf-8");
      const parsed = JSON.parse(data) as Session;

      // 转换日期字段，确保类型正确
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
      };
    } catch {
      // 文件读取或解析失败时返回 null
      return null;
    }
  }
}

/**
 * 默认会话管理器实例
 * @description 使用默认配置创建的会话管理器
 */
export const sessionManager = new SessionManager();
