/**
 * Telegram 渠道实现
 * @description Telegram Bot API 的渠道实现
 */

import { Telegraf, type Context } from "telegraf";

import { BaseChannel, ChannelStatus, ChannelError, ChannelErrorType } from "../base";

import type { InboundMessage, OutboundMessage, MediaContent } from "../../types/message";

/**
 * Telegram 渠道配置
 */
export interface TelegramChannelConfig {
  /** 是否启用 */
  enabled?: boolean;
  /** Bot Token */
  token: string;
  /** Webhook URL */
  webhookUrl?: string;
  /** 超时时间（毫秒） */
  timeout?: number;
}

/**
 * Telegram 渠道
 * @description Telegram Bot API 的渠道实现
 */
export class TelegramChannel extends BaseChannel {
  /** Telegraf 实例 */
  private bot?: Telegraf;

  /** Telegram 配置 */
  private config: Required<Omit<TelegramChannelConfig, "webhookUrl">> & {
    webhookUrl?: string;
  };

  constructor(config: TelegramChannelConfig) {
    super();
    this.config = {
      enabled: config.enabled ?? true,
      token: config.token,
      webhookUrl: config.webhookUrl,
      timeout: config.timeout ?? 30000,
    };
  }

  public getType(): string {
    return "telegram";
  }

  public async start(): Promise<void> {
    if (this.config.enabled === false) {
      this.logInfo("Telegram 渠道已禁用");
      return;
    }

    this.setStatus(ChannelStatus.STARTING);
    this.logInfo("启动 Telegram 渠道...");

    try {
      // 创建 Telegraf 实例
      this.bot = new Telegraf(this.config.token, {
        handlerTimeout: this.config.timeout,
      });

      // 监听消息
      this.bot.on("message", async (ctx: Context) => {
        await this.handleTelegramMessage(ctx);
      });

      // 监听错误
      this.bot.catch((error: unknown) => {
        const channelError = this.classifyError(error instanceof Error ? error : new Error(String(error)));
        this.logError("Telegram Bot 错误", channelError);
        this.handleError(channelError);
      });

      // 启动 webhook 或 polling
      if (this.config.webhookUrl) {
        await this.bot.launch({
          webhook: {
            domain: this.config.webhookUrl,
            hookPath: `/webhook/telegram/${this.config.token}`,
          },
        });
        this.logInfo(`Telegram webhook 已启动: ${this.config.webhookUrl}`);
      } else {
        await this.bot.launch();
        this.logInfo("Telegram polling 已启动");
      }

      this.setStatus(ChannelStatus.RUNNING);
      this.logInfo("Telegram 渠道启动成功");
    } catch (error) {
      this.logError("Telegram 渠道启动失败", this.classifyError(error));
      this.setStatus(ChannelStatus.ERROR);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (this.getStatus() === ChannelStatus.STOPPED) {
      return;
    }

    this.setStatus(ChannelStatus.STOPPING);
    this.logInfo("停止 Telegram 渠道...");

    try {
      if (this.bot) {
        this.bot.stop();
        this.bot = undefined;
      }

      this.setStatus(ChannelStatus.STOPPED);
      this.logInfo("Telegram 渠道已停止");
    } catch (error) {
      this.logError("Telegram 渠道停止失败", this.classifyError(error));
      this.setStatus(ChannelStatus.ERROR);
      throw error;
    }
  }

  public async send(message: OutboundMessage): Promise<void> {
    if (this.getStatus() !== ChannelStatus.RUNNING || !this.bot) {
      this.logWarn("Telegram 渠道未运行，无法发送消息");
      return;
    }

    try {
      // 解析 chatId（格式：telegram:chatId）
      const chatId = message.chatId.replace("telegram:", "");

      // 发送消息
      if (message.media && message.media.length > 0) {
        // 发送媒体消息
        for (const media of message.media) {
          await this.sendMedia(chatId, media, message.content);
        }
      } else {
        // 发送文本消息
        await this.bot.telegram.sendMessage(chatId, message.content);
      }
    } catch (error) {
      const channelError = this.classifyError(error);
      this.logError("发送 Telegram 消息失败", channelError);
      throw channelError;
    }
  }

  public async healthCheck(): Promise<boolean> {
    if (this.getStatus() !== ChannelStatus.RUNNING || !this.bot) {
      return false;
    }

    try {
      await this.bot.telegram.getMe();
      return true;
    } catch (error) {
      const channelError = this.classifyError(error);
      this.logError("Telegram 健康检查失败", channelError);
      return false;
    }
  }

  /**
   * 处理 Telegram 消息
   * @param ctx Telegraf Context
   * @private
   */
  private async handleTelegramMessage(ctx: Context): Promise<void> {
    try {
      if (!ctx.message || !ctx.from) {
        return;
      }

      const userId = ctx.from.id.toString();
      const chatId = ctx.chat?.id.toString() || userId;

      // 解析文本内容
      let content = "";
      const media: MediaContent[] = [];

      if ("text" in ctx.message && ctx.message.text) {
        content = ctx.message.text;
      }

      // 处理图片
      if ("photo" in ctx.message && ctx.message.photo) {
        const largestPhoto = ctx.message.photo[ctx.message.photo.length - 1];
        const file = await ctx.telegram.getFile(largestPhoto.file_id);
        media.push({
          type: "image",
          url: `https://api.telegram.org/file/bot${this.config.token}/${file.file_path}`,
        });
      }

      // 处理文档
      if ("document" in ctx.message && ctx.message.document) {
        const file = await ctx.telegram.getFile(ctx.message.document.file_id);
        media.push({
          type: "document",
          url: `https://api.telegram.org/file/bot${this.config.token}/${file.file_path}`,
          filename: ctx.message.document.file_name,
          size: ctx.message.document.file_size,
        });
      }

      // 构造入站消息
      const message: InboundMessage = {
        channel: "telegram",
        senderId: userId,
        chatId: `telegram:${chatId}`,
        content,
        media: media.length > 0 ? media : undefined,
        sessionKey: `telegram:${chatId}:${userId}`,
        timestamp: Date.now(),
        messageId: ctx.message.message_id.toString(),
      };

      // 处理消息
      await this.handleMessage(message);
    } catch (error) {
      const channelError = this.classifyError(error);
      this.logError("处理 Telegram 消息失败", channelError);
      this.handleError(channelError);
    }
  }

  /**
   * 发送媒体消息
   * @param chatId 聊天 ID
   * @param media 媒体内容
   * @param caption 说明文字
   * @private
   */
  private async sendMedia(chatId: string, media: MediaContent, caption?: string): Promise<void> {
    if (!this.bot) {
      throw new ChannelError("Bot 未初始化", ChannelErrorType.CONFIGURATION);
    }

    switch (media.type) {
      case "image":
        if (media.url) {
          await this.bot.telegram.sendPhoto(chatId, media.url, { caption });
        }
        break;

      case "document":
        if (media.url) {
          await this.bot.telegram.sendDocument(chatId, media.url, {
            caption,
          });
        }
        break;

      default:
        this.logWarn(`不支持的媒体类型: ${media.type}`);
        break;
    }
  }
}