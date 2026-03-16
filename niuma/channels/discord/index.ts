/**
 * Discord 渠道实现
 * @description Discord Bot API 的渠道实现
 */

import {
  Client,
  GatewayIntentBits,
  type Message,
  type Attachment,
  type TextBasedChannel,
  type TextChannel,
  type DMChannel,
  type NewsChannel,
  type ThreadChannel,
  type VoiceChannel,
} from "discord.js";

import { BaseChannel, ChannelStatus, ChannelError, ChannelErrorType } from "../base";

import type { InboundMessage, OutboundMessage, MediaContent } from "../../types/message";

/** 可发送消息的渠道类型（排除 PartialGroupDMChannel） */
type SendableChannel = TextChannel | DMChannel | NewsChannel | ThreadChannel | VoiceChannel;

/**
 * Discord 渠道配置
 */
export interface DiscordChannelConfig {
  /** 是否启用 */
  enabled?: boolean;
  /** Bot Token */
  token: string;
  /** Application ID */
  applicationId: string;
  /** Gateway Intents */
  intents?: string[];
}

/**
 * Discord 渠道
 * @description Discord Bot API 的渠道实现
 */
export class DiscordChannel extends BaseChannel {
  /** Discord 客户端实例 */
  private client?: Client;

  /** Discord 配置 */
  private config: Required<Omit<DiscordChannelConfig, "intents">> & {
    intents: string[];
  };

  constructor(config: DiscordChannelConfig) {
    super();
    this.config = {
      enabled: config.enabled ?? true,
      token: config.token,
      applicationId: config.applicationId,
      intents: config.intents ?? ["GUILDS", "GUILD_MESSAGES", "MESSAGE_CONTENT"],
    };
  }

  public getType(): string {
    return "discord";
  }

  public async start(): Promise<void> {
    if (this.config.enabled === false) {
      this.logInfo("Discord 渠道已禁用");
      return;
    }

    this.setStatus(ChannelStatus.STARTING);
    this.logInfo("启动 Discord 渠道...");

    try {
      // 创建 Discord 客户端
      this.client = new Client({
        intents: this.parseIntents(this.config.intents),
      });

      // 监听消息
      this.client.on("messageCreate", (message: Message) => {
        this.handleDiscordMessage(message).catch((error) => {
          this.logError("处理 Discord 消息失败", this.classifyError(error));
        });
      });

      // 监听错误
      this.client.on("error", (error: Error) => {
        const channelError = this.classifyError(error);
        this.logError("Discord 客户端错误", channelError);
        this.handleError(channelError);
      });

      // 登录
      await this.client.login(this.config.token);

      this.setStatus(ChannelStatus.RUNNING);
      this.logInfo("Discord 渠道启动成功");
    } catch (error) {
      this.logError("Discord 渠道启动失败", this.classifyError(error));
      this.setStatus(ChannelStatus.ERROR);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (this.getStatus() === ChannelStatus.STOPPED) {
      return;
    }

    this.setStatus(ChannelStatus.STOPPING);
    this.logInfo("停止 Discord 渠道...");

    try {
      if (this.client) {
        await this.client.destroy();
        this.client = undefined;
      }

      this.setStatus(ChannelStatus.STOPPED);
      this.logInfo("Discord 渠道已停止");
    } catch (error) {
      this.logError("Discord 渠道停止失败", this.classifyError(error));
      this.setStatus(ChannelStatus.ERROR);
      throw error;
    }
  }

  public async send(message: OutboundMessage): Promise<void> {
    if (this.getStatus() !== ChannelStatus.RUNNING || !this.client) {
      this.logWarn("Discord 渠道未运行，无法发送消息");
      return;
    }

    try {
      // 解析 chatId（格式：discord:channelId）
      const channelId = message.chatId.replace("discord:", "");
      const channel = await this.client.channels.fetch(channelId);

      if (!channel || !channel.isTextBased()) {
        throw new ChannelError(`无效的频道 ID: ${channelId}`, ChannelErrorType.CONFIGURATION);
      }

      const textChannel = channel as TextBasedChannel;

      // 检查 send 方法是否存在（排除 PartialGroupDMChannel）
      if (!("send" in textChannel) || typeof textChannel.send !== "function") {
        throw new ChannelError(`频道不支持发送消息: ${channelId}`, ChannelErrorType.CONFIGURATION);
      }

      const sendableChannel = textChannel as SendableChannel;

      // 发送消息
      if (message.media && message.media.length > 0) {
        // 发送媒体消息
        for (const media of message.media) {
          await this.sendMedia(sendableChannel, media, message.content);
        }
      } else {
        // 发送文本消息
        await sendableChannel.send(message.content);
      }
    } catch (error) {
      const channelError = this.classifyError(error);
      this.logError("发送 Discord 消息失败", channelError);
      throw channelError;
    }
  }

  public async healthCheck(): Promise<boolean> {
    if (this.getStatus() !== ChannelStatus.RUNNING || !this.client) {
      return false;
    }

    try {
      return this.client.isReady();
    } catch (error) {
      const channelError = this.classifyError(error);
      this.logError("Discord 健康检查失败", channelError);
      return false;
    }
  }

  /**
   * 解析 Gateway Intents
   * @param intents Intents 字符串数组
   * @returns GatewayIntentsBits
   * @private
   */
  private parseIntents(intents: string[]): number {
    let result = 0;
    for (const intent of intents) {
      const bit = GatewayIntentBits[intent as keyof typeof GatewayIntentBits];
      if (typeof bit === "number") {
        result |= bit;
      }
    }
    return result;
  }

  /**
   * 处理 Discord 消息
   * @param message Discord 消息
   * @private
   */
  private async handleDiscordMessage(message: Message): Promise<void> {
    try {
      // 忽略机器人消息
      if (message.author.bot) {
        return;
      }

      const userId = message.author.id;
      const channelId = message.channelId;

      // 解析文本内容
      let content = message.content || "";
      const media: MediaContent[] = [];

      // 处理图片
      if (message.attachments.size > 0) {
        message.attachments.forEach((attachment: Attachment) => {
          if (attachment.contentType?.startsWith("image/")) {
            media.push({
              type: "image",
              url: attachment.url,
              size: attachment.size,
            });
          } else {
            media.push({
              type: "document",
              url: attachment.url,
              filename: attachment.name,
              size: attachment.size,
            });
          }
        });
      }

      // 构造入站消息
      const inboundMessage: InboundMessage = {
        channel: "discord",
        senderId: userId,
        chatId: `discord:${channelId}`,
        content,
        media: media.length > 0 ? media : undefined,
        sessionKey: `discord:${channelId}:${userId}`,
        timestamp: Date.now(),
        messageId: message.id,
      };

      // 处理消息
      await this.handleMessage(inboundMessage);
    } catch (error) {
      const channelError = this.classifyError(error);
      this.logError("处理 Discord 消息失败", channelError);
      this.handleError(channelError);
    }
  }

  /**
   * 发送媒体消息
   * @param channel Discord 频道
   * @param media 媒体内容
   * @param caption 说明文字
   * @private
   */
  private async sendMedia(
    channel: SendableChannel,
    media: MediaContent,
    caption?: string
  ): Promise<void> {
    switch (media.type) {
      case "image":
        if (media.url) {
          await channel.send({
            files: [{ attachment: media.url, description: caption }],
          });
        }
        break;

      case "document":
        if (media.url) {
          await channel.send({
            files: [{ attachment: media.url, name: media.filename }],
          });
        }
        break;

      default:
        this.logWarn(`不支持的媒体类型: ${media.type}`);
        break;
    }
  }
}