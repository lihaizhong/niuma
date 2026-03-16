/**
 * 会话管理器 - 处理会话创建、持久化和历史记录
 * @description 提供会话的生命周期管理，包括创建、持久化、历史记录查询和清理
 */

// ==================== 内置库 ====================
import { join } from "path";
import { homedir } from "os";
import { createHash } from "crypto";

// ==================== 第三方库 ====================
import fs from "fs-extra";

// ==================== 本地模块 ====================
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
  /** 渠道类型 */
  channel?: string;
  /** 用户标识 */
  userId?: string;
  /** 聊天标识 */
  chatId?: string;
  /** 元数据 */
  metadata?: Record<string, unknown>;
  /** 最后活跃时间 */
  lastActiveAt?: Date;
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
  private cache: Map<string, { session: Session; timestamp: number }> =
    new Map();

  /** 缓存 TTL（毫秒） */
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 分钟

  /** 会话存储目录 */
  private sessionsDir: string;

  /** 最后活跃的会话键 */
  private lastActiveSessionKey: string | null = null;

  /** 最后活跃的渠道 */
  private lastActiveChannel: string | null = null;

  /** 会话 TTL（毫秒） */
  private readonly SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 天

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

    // 更新最后活跃的会话键
    this.lastActiveSessionKey = sessionKey;

    // 优先从内存缓存获取（检查是否过期）
    const cached = this.cache.get(sessionKey);
    if (cached && now - cached.timestamp < this.CACHE_TTL) {
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

    // 解析 SessionKey 并设置渠道信息
    try {
      const parsed = this.parseSessionKey(sessionKey);
      newSession.channel = parsed.channel;
      newSession.chatId = parsed.chatId;
      newSession.userId = parsed.userId;
    } catch {
      // SessionKey 格式无效，保持默认值
    }

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
    await fs.ensureDir(this.sessionsDir);

    // 使用原子写入：先写入临时文件，然后重命名
    const filePath = this._getSessionFilePath(session.key);
    const tempPath = `${filePath}.tmp`;
    const data = JSON.stringify(session, null, 2);

    try {
      await fs.writeFile(tempPath, data, "utf-8");
      await fs.rename(tempPath, filePath); // 使用异步重命名
    } catch (error) {
      // 清理临时文件
      try {
        await fs.unlink(tempPath);
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
    const validRoles: SessionMessage["role"][] = [
      "user",
      "assistant",
      "system",
    ];
    const safeRole = validRoles.includes(role as SessionMessage["role"])
      ? (role as SessionMessage["role"])
      : "user"; // 默认值

    session.messages.push({
      role: safeRole,
      content,
      timestamp: new Date().toISOString(),
      toolsUsed,
    });
    session.updatedAt = new Date();
    session.lastActiveAt = new Date();

    // 更新最后活跃的渠道
    if (session.channel) {
      this.lastActiveChannel = session.channel;
    }
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
   * 删除会话（包括文件）
   * @description 从内存缓存和文件系统中彻底删除会话
   * @param sessionKey 会话标识
   */
  delete(sessionKey: string): void {
    this.cache.delete(sessionKey);

    const filePath = this._getSessionFilePath(sessionKey);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
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
      if (!fs.existsSync(this.sessionsDir)) {
        return [];
      }
      const files = fs.readdirSync(this.sessionsDir);
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

  /**
   * 生成 SessionKey
   * @description 根据渠道、聊天ID和用户ID生成标准化的会话键
   * @param channel 渠道类型
   * @param chatId 聊天ID
   * @param userId 用户ID（可选）
   * @returns SessionKey
   */
  generateSessionKey(channel: string, chatId: string, userId?: string): string {
    if (userId) {
      return `${channel}:${chatId}:${userId}`;
    }
    return `${channel}:${chatId}`;
  }

  /**
   * 解析 SessionKey
   * @description 解析 SessionKey，返回渠道、聊天ID和用户ID
   * @param sessionKey 会话键
   * @returns 解析结果
   */
  parseSessionKey(sessionKey: string): {
    channel: string;
    chatId: string;
    userId?: string;
  } {
    const parts = sessionKey.split(":");
    if (parts.length >= 3) {
      return {
        channel: parts[0],
        chatId: parts[1],
        userId: parts[2],
      };
    } else if (parts.length === 2) {
      return {
        channel: parts[0],
        chatId: parts[1],
      };
    } else {
      throw new Error(`Invalid session key: ${sessionKey}`);
    }
  }

  /**
   * 获取最后活跃的渠道
   * @returns 最后活跃的渠道类型
   */
  getLastActiveChannel(): string | null {
    return this.lastActiveChannel;
  }

  /**
   * 获取最后活跃的会话键
   * @returns 最后活跃的会话键
   */
  getLastActiveSessionKey(): string | null {
    return this.lastActiveSessionKey;
  }

  /**
   * 按渠道查询会话
   * @description 获取指定渠道的所有会话
   * @param channel 渠道类型
   * @returns 会话列表
   */
  async getSessionsByChannel(channel: string): Promise<Session[]> {
    const sessions: Session[] = [];

    // 遍历缓存中的会话
    for (const cached of this.cache.values()) {
      if (cached.session.channel === channel) {
        sessions.push(cached.session);
      }
    }

    // 从文件系统加载指定渠道的会话
    try {
      const metadata = await this._scanSessionFiles();

      // 遍历文件系统中的会话元数据
      for (const [sessionKey, meta] of metadata.entries()) {
        // 跳过已在缓存中的会话
        if (this.cache.has(sessionKey)) {
          continue;
        }

        // 检查是否匹配指定渠道
        if (meta.channel === channel) {
          // 从文件加载完整会话
          const session = await this._loadFromFile(sessionKey);
          if (session) {
            sessions.push(session);
          }
        }
      }
    } catch (error) {
      console.error(`从文件系统加载渠道 ${channel} 的会话失败`, error);
    }

    return sessions;
  }

  /**
   * 按用户查询会话
   * @description 获取指定用户的所有会话
   * @param userId 用户ID
   * @returns 会话列表
   */
  async getSessionsByUser(userId: string): Promise<Session[]> {
    const sessions: Session[] = [];

    // 遍历缓存中的会话
    for (const cached of this.cache.values()) {
      if (cached.session.userId === userId) {
        sessions.push(cached.session);
      }
    }

    // 从文件系统加载指定用户的会话
    try {
      const metadata = await this._scanSessionFiles();

      // 遍历文件系统中的会话元数据
      for (const [sessionKey, meta] of metadata.entries()) {
        // 跳过已在缓存中的会话
        if (this.cache.has(sessionKey)) {
          continue;
        }

        // 检查是否匹配指定用户
        if (meta.userId === userId) {
          // 从文件加载完整会话
          const session = await this._loadFromFile(sessionKey);
          if (session) {
            sessions.push(session);
          }
        }
      }
    } catch (error) {
      console.error(`从文件系统加载用户 ${userId} 的会话失败`, error);
    }

    return sessions;
  }

  /**
   * 获取会话统计
   * @description 统计各渠道的会话数量和活跃会话数量
   * @returns 会话统计信息
   */
  async getSessionStats(): Promise<{
    total: number;
    active: number;
    byChannel: Record<string, number>;
  }> {
    const byChannel: Record<string, number> = {};
    let active = 0;
    const now = Date.now();
    const ACTIVE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 小时

    // 统计缓存中的会话
    for (const cached of this.cache.values()) {
      const channel = cached.session.channel || "unknown";
      byChannel[channel] = (byChannel[channel] || 0) + 1;

      // 统计活跃会话（24 小时内有更新）
      if (cached.session.lastActiveAt && now - cached.session.lastActiveAt.getTime() < ACTIVE_THRESHOLD) {
        active++;
      }
    }

    // 统计文件系统中的会话
    try {
      const metadata = await this._scanSessionFiles();

      // 遍历文件系统中的会话元数据
      for (const [sessionKey, meta] of metadata.entries()) {
        // 跳过已在缓存中的会话
        if (this.cache.has(sessionKey)) {
          continue;
        }

        // 统计渠道分布
        const channel = meta.channel || "unknown";
        byChannel[channel] = (byChannel[channel] || 0) + 1;
      }
    } catch (error) {
      console.error("统计文件系统中的会话失败", error);
    }

    // 计算总数量（缓存 + 文件系统）
    const total = this.cache.size + (await this._scanSessionFiles()).size;

    return {
      total,
      active,
      byChannel,
    };
  }

  /**
   * 清理过期会话
   * @description 删除超过 TTL 的会话
   * @returns 清理的会话数量
   */
  async cleanExpiredSessions(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    // 清理缓存中的过期会话
    for (const [sessionKey, cached] of this.cache.entries()) {
      if (now - cached.session.createdAt.getTime() > this.SESSION_TTL) {
        this.cache.delete(sessionKey);

        // 删除文件
        const filePath = this._getSessionFilePath(sessionKey);
        try {
          if (fs.existsSync(filePath)) {
            await fs.unlink(filePath);
            cleaned++;
          }
        } catch (error) {
          console.error(`删除会话文件失败: ${filePath}`, error);
        }
      }
    }

    if (cleaned > 0) {
      console.log(`清理了 ${cleaned} 个过期会话`);
    }

    return cleaned;
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
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const data = await fs.readFile(filePath, "utf-8");
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

  /**
   * 扫描会话文件
   * @description 扫描会话目录中的所有文件，解析 SessionKey 提取元数据
   * @returns 会话文件元数据映射 {sessionKey: {channel, userId, chatId}}
   * @private
   */
  private async _scanSessionFiles(): Promise<
    Map<
      string,
      { channel?: string; userId?: string; chatId?: string; createdAt: number }
    >
  > {
    const metadata = new Map<
      string,
      { channel?: string; userId?: string; chatId?: string; createdAt: number }
    >();

    try {
      // 读取会话目录中的所有文件
      const files = await fs.readdir(this.sessionsDir);

      // 过滤出 JSON 文件
      const jsonFiles = files.filter((file) => file.endsWith(".json"));

      // 解析每个文件
      for (const file of jsonFiles) {
        const filePath = join(this.sessionsDir, file);

        try {
          // 读取文件内容
          const data = await fs.readFile(filePath, "utf-8");
          const parsed = JSON.parse(data) as Session;

          // 解析 SessionKey 提取元数据
          const sessionKey = parsed.key;
          if (!sessionKey) {
            continue;
          }

          // SessionKey 格式: "channel:chatId:userId"
          const parts = sessionKey.split(":");
          let channel: string | undefined;
          let chatId: string | undefined;
          let userId: string | undefined;

          if (parts.length >= 1) {
            channel = parts[0];
          }
          if (parts.length >= 2) {
            chatId = parts[1];
          }
          if (parts.length >= 3) {
            userId = parts[2];
          }

          // 存储元数据
          metadata.set(sessionKey, {
            channel,
            userId,
            chatId,
            createdAt: new Date(parsed.createdAt).getTime(),
          });
        } catch (error) {
          // 忽略解析失败的文件
          console.error(`解析会话文件失败: ${filePath}`, error);
        }
      }
    } catch (error) {
      // 忽略扫描失败
      console.error(`扫描会话目录失败: ${this.sessionsDir}`, error);
    }

    return metadata;
  }
}

/**
 * 默认会话管理器实例
 * @description 使用默认配置创建的会话管理器
 */
export const sessionManager = new SessionManager();
