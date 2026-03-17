/**
 * QQ 渠道实现
 * 基于 oicq SDK 的 QQ Bot 渠道实现
 */

import { createClient, type Client } from "oicq";

import { createLogger } from "../../log";
import { BaseChannel, ChannelStatus } from "../base";

import type { InboundMessage, OutboundMessage } from "../../types/message";
import type {
  PrivateMessageEvent,
  GroupMessageEvent,
  DiscussMessageEvent,
} from "oicq";


const logger = createLogger("qq-channel");

/**
 * QQ 渠道配置
 */
export interface QQChannelConfig {
  enabled?: boolean;
  /** QQ 账号 */
  account: number;
  /** QQ 密码 */
  password: string;
  /** 登录平台 */
  platform?: number;
  /** 是否使用滑块验证码 */
  useSlider?: boolean;
  /** 设备信息文件路径 */
  deviceFilePath?: string;
}

/**
 * QQ 渠道
 * 基于 oicq SDK 的 QQ Bot 渠道实现
 */
export class QQChannel extends BaseChannel {
  private config: Required<Omit<QQChannelConfig, "enabled">> & {
    enabled: boolean;
  };
  private client: Client | null;

  constructor(config: QQChannelConfig) {
    super();
    this.config = {
      enabled: config.enabled ?? true,
      account: config.account,
      password: config.password,
      platform: config.platform ?? 1,
      useSlider: config.useSlider ?? false,
      deviceFilePath: config.deviceFilePath ?? "",
    };
    this.client = null;
  }

  public getType(): string {
    return "qq";
  }

  public async start(): Promise<void> {
    if (this.config.enabled === false) {
      this.logInfo("QQ 渠道已禁用");
      return;
    }

    this.setStatus(ChannelStatus.STARTING);
    this.logInfo(`启动 QQ 渠道，账号: ${this.config.account}...`);

    try {
      // 创建 oicq 客户端
      this.client = createClient(this.config.account, {
        platform: this.config.platform,
        data_dir: this.config.deviceFilePath,
      });

      // 监听系统事件
      this.client.on("system.login.qrcode", () => {
        this.logInfo("扫码登录中...");
      });

      this.client.on("system.login.slider", () => {
        this.logInfo("需要滑块验证码");
      });

      this.client.on("system.login.error", (error: unknown) => {
        logger.error({ error }, "QQ 登录失败");
        this.setStatus(ChannelStatus.ERROR);
      });

      this.client.on("system.online", () => {
        this.logInfo("QQ 登录成功");
        this.setStatus(ChannelStatus.RUNNING);
      });

      // 监听消息事件
      this.client.on("message", (event) => {
        void this._handleMessage(event);
      });

      // 监听群消息事件
      this.client.on("message.group", (event) => {
        void this._handleGroupMessage(event);
      });

      // 监听私聊消息事件
      this.client.on("message.private", (event) => {
        void this._handlePrivateMessage(event);
      });

      // 登录
      if (this.config.password) {
        await this.client.login(this.config.password);
      } else {
        await this.client.login();
      }

      this.logInfo("QQ 渠道启动成功");
    } catch (error) {
      logger.error({ error }, "QQ 渠道启动失败");
      this.setStatus(ChannelStatus.ERROR);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    this.setStatus(ChannelStatus.STOPPING);
    this.logInfo("停止 QQ 渠道...");

    try {
      if (this.client) {
        // 注销登录
        this.client.terminate();
        this.client = null;
      }

      this.setStatus(ChannelStatus.STOPPED);
      this.logInfo("QQ 渠道已停止");
    } catch (error) {
      logger.error({ error }, "QQ 渠道停止失败");
      this.setStatus(ChannelStatus.ERROR);
      throw error;
    }
  }

  public async send(message: OutboundMessage): Promise<void> {
    if (this.getStatus() !== ChannelStatus.RUNNING) {
      this.logWarn("QQ 渠道未运行，无法发送消息");
      return;
    }

    if (!this.client) {
      this.logWarn("QQ 客户端未初始化");
      return;
    }

    try {
      const { chatId, content } = message;

      if (chatId.includes(":")) {
        // 群消息: qq:groupId
        const groupId = parseInt(chatId.split(":")[1], 10);
        await this.client.sendGroupMsg(groupId, content);
      } else {
        // 私聊消息: userId
        const userId = parseInt(chatId, 10);
        await this.client.sendPrivateMsg(userId, content);
      }
    } catch (error) {
      logger.error({ error }, "QQ 消息发送失败");
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      return this.getStatus() === ChannelStatus.RUNNING && this.client?.isOnline() === true;
    } catch (error) {
      logger.error({ error }, "QQ 健康检查失败");
      return false;
    }
  }

  /**
   * 处理消息事件
   * @param event 消息事件对象
   * @private
   */
  private async _handleMessage(
    event: PrivateMessageEvent | GroupMessageEvent | DiscussMessageEvent
  ): Promise<void> {
    try {
      const chatId = "group_id" in event ? `qq:${event.group_id}` : String(event.user_id);
      const inboundMessage: InboundMessage = {
        channel: "qq",
        senderId: String(event.user_id),
        chatId,
        content: event.raw_message ?? "",
        timestamp: event.time * 1000,
        messageId: event.message_id,
        metadata: {
          sender: event.sender,
          group: "group" in event ? event.group : undefined,
          raw: event,
        },
      };

      await this.handleMessage(inboundMessage);
    } catch (error) {
      logger.error({ error }, "处理 QQ 消息失败");
    }
  }

  /**
   * 处理群消息事件
   * @param event 群消息事件对象
   * @private
   */
  private async _handleGroupMessage(event: GroupMessageEvent): Promise<void> {
    try {
      const inboundMessage: InboundMessage = {
        channel: "qq",
        senderId: String(event.user_id),
        chatId: `qq:${event.group_id}`,
        content: event.raw_message ?? "",
        timestamp: event.time * 1000,
        messageId: event.message_id,
        metadata: {
          sender: event.sender,
          group: event.group,
          raw: event,
        },
      };

      await this.handleMessage(inboundMessage);
    } catch (error) {
      logger.error({ error }, "处理 QQ 群消息失败");
    }
  }

  /**
   * 处理私聊消息事件
   * @param event 私聊消息事件对象
   * @private
   */
  private async _handlePrivateMessage(event: PrivateMessageEvent): Promise<void> {
    try {
      const inboundMessage: InboundMessage = {
        channel: "qq",
        senderId: String(event.user_id),
        chatId: String(event.user_id),
        content: event.raw_message ?? "",
        timestamp: event.time * 1000,
        messageId: event.message_id,
        metadata: {
          sender: event.sender,
          raw: event,
        },
      };

      await this.handleMessage(inboundMessage);
    } catch (error) {
      logger.error({ error }, "处理 QQ 私聊消息失败");
    }
  }
}