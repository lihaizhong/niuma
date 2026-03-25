/**
 * 飞书渠道实现
 * 基于 @larksuiteoapi/node-sdk 的飞书开放平台渠道实现
 */

import * as lark from "@larksuiteoapi/node-sdk";

import { createLogger } from "../../log";
import { BaseChannel, ChannelStatus } from "../base";

import type { InboundMessage, OutboundMessage } from "../../types/message";
import type { Server, IncomingMessage, ServerResponse } from "http";

const logger = createLogger("feishu-channel");

/**
 * 飞书消息事件
 */
interface FeishuMessageEvent {
  message: {
    message_id: string;
    content: string;
    msg_type: string;
  };
  sender: {
    sender_id: {
      user_id: string;
    };
  };
  chat: {
    chat_id: string;
  };
  create_time: number;
}

/**
 * 飞书事件数据
 */
interface FeishuEventData {
  type?: string;
  challenge?: string;
  header?: {
    event_type: string;
  };
  event?: FeishuMessageEvent;
}

/**
 * 飞书渠道配置
 */
export interface FeishuChannelConfig {
  enabled?: boolean;
  /** App ID */
  appId: string;
  /** App Secret */
  appSecret: string;
  /** 事件订阅加密密钥（可选） */
  encryptKey?: string;
  /** 验证令牌（可选） */
  verificationToken?: string;
  /** 服务器端口（用于接收 Webhook） */
  serverPort?: number;
  /** 服务器路径（用于接收 Webhook） */
  serverPath?: string;
}

/**
 * 飞书渠道
 * 基于 @larksuiteoapi/node-sdk 的飞书开放平台渠道实现
 */
export class FeishuChannel extends BaseChannel {
  private config: Required<Omit<FeishuChannelConfig, "encryptKey" | "verificationToken" | "enabled">> & {
    encryptKey?: string;
    verificationToken?: string;
    enabled: boolean;
  };
  private client: lark.Client | null;
  private server?: Server;

  constructor(config: FeishuChannelConfig) {
    super();
    this.config = {
      enabled: config.enabled ?? true,
      appId: config.appId,
      appSecret: config.appSecret,
      encryptKey: config.encryptKey,
      verificationToken: config.verificationToken,
      serverPort: config.serverPort ?? 3000,
      serverPath: config.serverPath ?? "/feishu/events",
    };
    this.client = null;
  }

  public getType(): string {
    return "feishu";
  }

  public async start(): Promise<void> {
    if (this.config.enabled === false) {
      this.logInfo("飞书渠道已禁用");
      return;
    }

    this.setStatus(ChannelStatus.STARTING);
    this.logInfo("启动飞书渠道...");

    try {
      // 创建飞书客户端
      this.client = new lark.Client({
        appId: this.config.appId,
        appSecret: this.config.appSecret,
      });

      // 验证客户端
      const token = await this.client.auth.tenantAccessToken.internal({
        data: {
          app_id: this.config.appId,
          app_secret: this.config.appSecret,
        },
      });

      if (token.code !== 0) {
        throw new Error(`飞书认证失败: ${token.msg}`);
      }

      this.logInfo("飞书客户端初始化成功");

      // 启动事件订阅服务器
      await this._startEventServer();

      this.setStatus(ChannelStatus.RUNNING);
      this.logInfo("飞书渠道启动成功");
    } catch (error) {
      logger.error({ error }, "飞书渠道启动失败");
      this.setStatus(ChannelStatus.ERROR);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    this.setStatus(ChannelStatus.STOPPING);
    this.logInfo("停止飞书渠道...");

    try {
      // 停止事件服务器
      if (this.server) {
        const server = this.server;
        await new Promise<void>((resolve, reject) => {
          server.close((err?: Error) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        this.server = undefined;
      }

      this.client = null;

      this.setStatus(ChannelStatus.STOPPED);
      this.logInfo("飞书渠道已停止");
    } catch (error) {
      logger.error({ error }, "飞书渠道停止失败");
      this.setStatus(ChannelStatus.ERROR);
      throw error;
    }
  }

  public async send(message: OutboundMessage): Promise<void> {
    if (this.getStatus() !== ChannelStatus.RUNNING) {
      this.logWarn("飞书渠道未运行，无法发送消息");
      return;
    }

    if (!this.client) {
      this.logWarn("飞书客户端未初始化");
      return;
    }

    try {
      const { chatId, content } = message;

      // 发送文本消息
      const result = await this.client.im.message.create({
        params: {
          receive_id_type: "chat_id",
        },
        data: {
          receive_id: chatId,
          msg_type: "text",
          content: JSON.stringify({ text: content }),
        },
      });

      if (result.code !== 0) {
        throw new Error(`飞书消息发送失败: ${result.msg}`);
      }

      this.logInfo(`飞书消息已发送至: ${chatId}`);
    } catch (error) {
      logger.error({ error }, "飞书消息发送失败");
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      return this.getStatus() === ChannelStatus.RUNNING && this.client !== null;
    } catch (error) {
      logger.error({ error }, "飞书健康检查失败");
      return false;
    }
  }

  /**
   * 启动事件订阅服务器
   * @private
   */
  private async _startEventServer(): Promise<void> {
    const http = await import("http");

    this.server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
      // 验证路径
      if (req.url && req.method === "POST" && req.url === this.config.serverPath) {
        let body = "";
        req.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          void this._handleRequestBody(body, res);
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    const server = this.server;
    await new Promise<void>((resolve, reject) => {
      if (!server) {
        reject(new Error("Server not initialized"));
        return;
      }
      server.listen(this.config.serverPort, (err?: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    this.logInfo(`飞书事件服务器已启动，监听端口: ${this.config.serverPort}`);
  }

  /**
   * 处理请求体
   * @param body 请求体字符串
   * @param res HTTP 响应对象
   * @private
   */
  private async _handleRequestBody(body: string, res: ServerResponse): Promise<void> {
    try {
      const data = JSON.parse(body) as FeishuEventData;

      // 验证挑战请求
      if (data.type === "url_verification" && data.challenge) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ challenge: data.challenge }));
        return;
      }

      // 处理事件
      if (data.header?.event_type === "im.message.receive_v1" && data.event) {
        await this._handleMessage(data.event);
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: 0 }));
    } catch (error) {
      logger.error({ error }, "处理飞书事件失败");
      res.writeHead(500);
      res.end();
    }
  }

  /**
   * 处理飞书消息
   * @param event 消息事件
   * @private
   */
  private async _handleMessage(event: FeishuMessageEvent): Promise<void> {
    try {
      const message = event.message;
      const sender = event.sender;
      const chat = event.chat;

      // 解析消息内容
      let content = "";
      if (message.content) {
        const contentData = JSON.parse(message.content);
        content = contentData.text || contentData.content || "";
      }

      const inboundMessage: InboundMessage = {
        channel: "feishu",
        senderId: sender.sender_id.user_id,
        chatId: chat.chat_id,
        content,
        timestamp: event.create_time,
        messageId: message.message_id,
        metadata: {
          messageType: message.msg_type,
          sender,
          chat,
          raw: event,
        },
      };

      await this.handleMessage(inboundMessage);
    } catch (error) {
      logger.error({ error }, "处理飞书消息失败");
    }
  }
}