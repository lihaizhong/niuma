/**
 * 渠道抽象基类
 * 定义所有渠道必须实现的接口
 */

import { createLogger, type Logger } from "../log";

import type { InboundMessage, OutboundMessage } from "../types/message";

// ============================================
// 类型定义
// ============================================

/**
 * 渠道状态枚举
 */
export enum ChannelStatus {
  /** 未启动 */
  IDLE = "idle",
  /** 启动中 */
  STARTING = "starting",
  /** 运行中 */
  RUNNING = "running",
  /** 停止中 */
  STOPPING = "stopping",
  /** 已停止 */
  STOPPED = "stopped",
  /** 错误状态 */
  ERROR = "error",
}

/**
 * 错误类型枚举
 */
export enum ChannelErrorType {
  /** 网络错误 */
  NETWORK = "network",
  /** 认证错误 */
  AUTHENTICATION = "authentication",
  /** 速率限制错误 */
  RATE_LIMIT = "rate_limit",
  /** 消息格式错误 */
  MESSAGE_FORMAT = "message_format",
  /** 配置错误 */
  CONFIGURATION = "configuration",
  /** 未知错误 */
  UNKNOWN = "unknown",
}

/**
 * 消息处理器类型
 */
export type MessageHandler = (message: InboundMessage) => Promise<void>;

// ============================================
// 错误类
// ============================================

/**
 * 渠道错误类
 */
export class ChannelError extends Error {
  constructor(
    message: string,
    public readonly type: ChannelErrorType,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "ChannelError";
  }
}

// ============================================
// 渠道抽象基类
// ============================================

/**
 * 渠道抽象基类
 * 所有渠道实现必须继承此基类
 */
export abstract class BaseChannel {
  // ============================================
  // 属性
  // ============================================

  /** 渠道状态 */
  protected status: ChannelStatus = ChannelStatus.IDLE;

  /** 最后错误信息 */
  protected lastError?: string;

  /** 最后错误时间 */
  protected lastErrorAt?: Date;

  /** Logger 实例缓存 */
  private _logger?: Logger;

  /** 消息处理器 */
  private messageHandler?: MessageHandler;

  /** 错误处理器 */
  private errorHandler?: (error: ChannelError) => void;

  // ============================================
  // 抽象方法
  // ============================================

  /**
   * 获取渠道类型
   * @returns 渠道类型标识符
   */
  public abstract getType(): string;

  /**
   * 启动渠道
   * 连接到对应的消息平台并开始接收消息
   */
  public abstract start(): Promise<void>;

  /**
   * 停止渠道
   * 断开连接并释放所有资源
   */
  public abstract stop(): Promise<void>;

  /**
   * 发送消息
   * @param message 要发送的消息
   */
  public abstract send(message: OutboundMessage): Promise<void>;

  /**
   * 健康检查
   * @returns 渠道是否健康
   */
  public abstract healthCheck(): Promise<boolean>;

  // ============================================
  // 公共方法
  // ============================================

  /**
   * 注册消息处理器
   * @param handler 消息处理函数
   * 在收到消息时调用此处理器
   */
  public onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  /**
   * 注册错误处理器
   * @param handler 错误处理函数
   * 在发生错误时调用此处理器
   */
  public onError(handler: (error: ChannelError) => void): void {
    this.errorHandler = handler;
  }

  /**
   * 获取渠道状态
   * @returns 当前渠道状态
   */
  public getStatus(): ChannelStatus {
    return this.status;
  }

  /**
   * 获取最后错误信息
   * @returns 最后错误信息
   */
  public getLastError(): { error: string; at: Date } | undefined {
    if (this.lastError && this.lastErrorAt) {
      return { error: this.lastError, at: this.lastErrorAt };
    }
    return undefined;
  }

  // ============================================
  // 保护方法
  // ============================================

  /**
   * 设置渠道状态
   * @param status 新的渠道状态
   */
  protected setStatus(status: ChannelStatus): void {
    this.status = status;
  }

  /**
   * 处理收到的消息
   * @param message 入站消息
   */
  protected async handleMessage(message: InboundMessage): Promise<void> {
    if (this.messageHandler) {
      try {
        await this.messageHandler(message);
      } catch (error) {
        const channelError = this.classifyError(error);
        this.logError("消息处理失败", channelError);
        this.handleError(channelError);
      }
    } else {
      this.logWarn("消息处理器未设置，消息将被丢弃");
    }
  }

  /**
   * 睡眠指定时间
   * @param ms 毫秒数
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 指数退避重试
   * @param fn 要重试的函数
   * @param maxRetries 最大重试次数
   * @param baseDelay 基础延迟时间（毫秒）
   */
  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) {
          const channelError = this.classifyError(error);
          this.logError(`重试失败（第 ${i + 1}/${maxRetries} 次）`, channelError);
          throw channelError;
        }
        const delay = baseDelay * Math.pow(2, i);
        this.logInfo(`重试中...（第 ${i + 1}/${maxRetries} 次，延迟 ${delay}ms）`);
        await this.sleep(delay);
      }
    }
    throw new ChannelError("重试次数耗尽", ChannelErrorType.UNKNOWN);
  }

  /**
   * 分类错误
   * @param error 原始错误
   * @returns 渠道错误
   */
  protected classifyError(error: unknown): ChannelError {
    if (error instanceof ChannelError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);

    // 网络错误
    if (message.includes("ECONNREFUSED") || message.includes("ETIMEDOUT") || message.includes("ENOTFOUND")) {
      return new ChannelError(message, ChannelErrorType.NETWORK, error instanceof Error ? error : undefined);
    }

    // 认证错误
    if (message.includes("401") || message.includes("Unauthorized") || message.includes("authentication")) {
      return new ChannelError(message, ChannelErrorType.AUTHENTICATION, error instanceof Error ? error : undefined);
    }

    // 速率限制错误
    if (message.includes("429") || message.includes("rate limit") || message.includes("Too Many Requests")) {
      return new ChannelError(message, ChannelErrorType.RATE_LIMIT, error instanceof Error ? error : undefined);
    }

    // 配置错误
    if (message.includes("config") || message.includes("configuration") || message.includes("missing")) {
      return new ChannelError(message, ChannelErrorType.CONFIGURATION, error instanceof Error ? error : undefined);
    }

    // 未知错误
    return new ChannelError(message, ChannelErrorType.UNKNOWN, error instanceof Error ? error : undefined);
  }

  /**
   * 处理错误
   */
  protected handleError(error: ChannelError): void {
    this.errorHandler?.(error);
  }

  /**
   * 获取 Logger 实例（延迟初始化）
   * Logger 的 name 已包含渠道类型，可直接调用：
   * - this.logger.info('消息')
   * - this.logger.warn('警告')
   * - this.logger.error({ err }, '错误')
   */
  protected get logger(): Logger {
    if (!this._logger) {
      this._logger = createLogger(`channel-${this.getType()}`);
    }
    return this._logger;
  }

  /**
   * 记录错误日志（同时保存最后错误信息）
   * @param message 错误消息
   * @param error 渠道错误
   */
  protected logError(message: string, error: ChannelError): void {
    this.lastError = `${message}: ${error.message}`;
    this.lastErrorAt = new Date();
    this.logger.error({ error }, message);
    if (error.originalError) {
      this.logger.error({ originalError: error.originalError }, "原始错误");
    }
  }

  /**
   * 记录信息日志
   * @param message 信息消息
   */
  protected logInfo(message: string): void {
    this.logger.info(message);
  }

  /**
   * 记录警告日志
   * @param message 警告消息
   */
  protected logWarn(message: string): void {
    this.logger.warn(message);
  }
}
