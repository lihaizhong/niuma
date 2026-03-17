/**
 * WhatsApp 渠道实现
 * 基于 @whiskeysockets/baileys SDK 的 WhatsApp 渠道实现
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  type WASocket,
  type BaileysEventMap,
  type ConnectionState,
  type WAMessage,
} from "@whiskeysockets/baileys";

import { createLogger } from "../../log";
import { BaseChannel, ChannelStatus } from "../base";

import type { InboundMessage, OutboundMessage } from "../../types/message";

const logger = createLogger("whatsapp-channel");

/**
 * WhatsApp 连接断开信息
 */
interface DisconnectError {
  error?: {
    output?: {
      statusCode?: number;
    };
  };
}

/**
 * WhatsApp 渠道配置
 */
export interface WhatsAppChannelConfig {
  enabled?: boolean;
  /** 认证状态文件路径 */
  authStatePath?: string;
  /** 浏览器标识 */
  browser?: [string, string, string];
}

/**
 * WhatsApp 渠道
 * 基于 @whiskeysockets/baileys SDK 的 WhatsApp 渠道实现
 */
export class WhatsAppChannel extends BaseChannel {
  private config: Required<Omit<WhatsAppChannelConfig, "enabled">> & {
    enabled: boolean;
  };
  private socket: WASocket | null;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;

  constructor(config: WhatsAppChannelConfig) {
    super();
    this.config = {
      enabled: config.enabled ?? true,
      authStatePath: config.authStatePath ?? "./auth_info_whatsapp",
      browser: config.browser ?? ["Niuma", "Chrome", "1.0.0"],
    };
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  public getType(): string {
    return "whatsapp";
  }

  public async start(): Promise<void> {
    if (this.config.enabled === false) {
      this.logInfo("WhatsApp 渠道已禁用");
      return;
    }

    this.setStatus(ChannelStatus.STARTING);
    this.logInfo("启动 WhatsApp 渠道...");

    try {
      // 加载认证状态
      const { state, saveCreds } = await useMultiFileAuthState(this.config.authStatePath);

      // 创建 Socket
      this.socket = makeWASocket({
        auth: state,
        browser: this.config.browser,
      });

      // 监听连接更新
      this.socket.ev.on("connection.update", (update) => {
        void this._handleConnectionUpdate(update);
      });

      // 监听凭据更新
      this.socket.ev.on("creds.update", () => {
        void saveCreds();
      });

      // 监听消息事件
      this.socket.ev.on("messages.upsert", (event) => {
        void this._handleMessageUpsert(event);
      });

      this.logInfo("WhatsApp 渠道启动成功");
    } catch (error) {
      logger.error({ error }, "WhatsApp 渠道启动失败");
      this.setStatus(ChannelStatus.ERROR);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    this.setStatus(ChannelStatus.STOPPING);
    this.logInfo("停止 WhatsApp 渠道...");

    try {
      if (this.socket) {
        // 关闭连接
        await this.socket.end(undefined);
        this.socket = null;
      }

      this.setStatus(ChannelStatus.STOPPED);
      this.logInfo("WhatsApp 渠道已停止");
    } catch (error) {
      logger.error({ error }, "WhatsApp 渠道停止失败");
      this.setStatus(ChannelStatus.ERROR);
      throw error;
    }
  }

  public async send(message: OutboundMessage): Promise<void> {
    if (this.getStatus() !== ChannelStatus.RUNNING) {
      this.logWarn("WhatsApp 渠道未运行，无法发送消息");
      return;
    }

    if (!this.socket) {
      this.logWarn("WhatsApp Socket 未初始化");
      return;
    }

    try {
      const { chatId, content } = message;

      // 发送文本消息
      await this.socket.sendMessage(chatId, { text: content });
    } catch (error) {
      logger.error({ error }, "WhatsApp 消息发送失败");
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      return this.getStatus() === ChannelStatus.RUNNING && this.socket?.user !== undefined;
    } catch (error) {
      logger.error({ error }, "WhatsApp 健康检查失败");
      return false;
    }
  }

  /**
   * 处理连接更新
   * @param update 连接更新信息
   * @private
   */
  private async _handleConnectionUpdate(update: Partial<ConnectionState>): Promise<void> {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const disconnectInfo = lastDisconnect as DisconnectError | undefined;
      const statusCode = disconnectInfo?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.logInfo(`连接关闭，尝试重连 (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
        this.reconnectAttempts++;
        await this.start();
      } else {
        this.logInfo("连接已关闭，不再重连");
        this.setStatus(ChannelStatus.STOPPED);
      }
    } else if (connection === "open") {
      this.logInfo("WhatsApp 连接已建立");
      this.setStatus(ChannelStatus.RUNNING);
      this.reconnectAttempts = 0;
    }
  }

  /**
   * 处理消息更新
   * @param messagesUpsert 消息更新信息
   * @private
   */
  private async _handleMessageUpsert(messagesUpsert: BaileysEventMap["messages.upsert"]): Promise<void> {
    const { messages, type } = messagesUpsert;

    // 只处理新消息（通知类型的消息）
    if (type !== "notify") {
      return;
    }

    for (const message of messages) {
      if (!message.key.fromMe) {
        await this._handleMessage(message);
      }
    }
  }

  /**
   * 处理单条消息
   * @param message 消息对象
   * @private
   */
  private async _handleMessage(message: WAMessage): Promise<void> {
    try {
      const messageContent = message.message?.conversation ||
                            message.message?.extendedTextMessage?.text ||
                            "";

      if (!messageContent) {
        return;
      }

      const remoteJid = message.key.remoteJid ?? "unknown";
      const inboundMessage: InboundMessage = {
        channel: "whatsapp",
        senderId: remoteJid,
        chatId: remoteJid,
        content: messageContent,
        timestamp: typeof message.messageTimestamp === "number" 
          ? message.messageTimestamp * 1000 
          : Date.now(),
        messageId: message.key.id ?? undefined,
        metadata: {
          pushName: message.pushName,
          raw: message,
        },
      };

      await this.handleMessage(inboundMessage);
    } catch (error) {
      logger.error({ error }, "处理 WhatsApp 消息失败");
    }
  }
}