/**
 * 钉钉渠道实现
 * 基于 dingtalk-sdk 的钉钉开放平台渠道实现
 */

import dingtalkSdk from "dingtalk-sdk";

import { createLogger } from "../../log";
import { BaseChannel, ChannelStatus } from "../base";

import type { InboundMessage, OutboundMessage } from "../../types/message";
import type { Server, IncomingMessage, ServerResponse } from "http";

// dingtalk-sdk 是 UMD 包，需要从默认导出中获取 Client
const Client = (dingtalkSdk as Record<string, unknown>).Client as typeof dingtalkSdk.Client;
type ClientType = InstanceType<typeof Client>;

const logger = createLogger("dingtalk-channel");

/**
 * 钉钉发送者信息
 */
interface DingtalkSender {
  staffId?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * 钉钉会话信息
 */
interface DingtalkConversation {
  conversationId: string;
  [key: string]: unknown;
}

/**
 * 钉钉文本消息内容
 */
interface DingtalkTextContent {
  Content: string;
}

/**
 * 钉钉事件
 */
interface DingtalkEvent {
  EventType: string;
  Sender: DingtalkSender;
  Conversation: DingtalkConversation;
  Text?: DingtalkTextContent;
  CreateTime?: number;
  MsgId?: string;
  [key: string]: unknown;
}

/**
 * 钉钉渠道配置
 */
export interface DingtalkChannelConfig {
  enabled?: boolean;
  /** App Key */
  appKey: string;
  /** App Secret */
  appSecret: string;
  /** 服务器端口（用于接收 Webhook） */
  serverPort?: number;
  /** 服务器路径（用于接收 Webhook） */
  serverPath?: string;
}

/**
 * 钉钉渠道
 * 基于 dingtalk-sdk 的钉钉开放平台渠道实现
 */
export class DingtalkChannel extends BaseChannel {
  private config: Required<Omit<DingtalkChannelConfig, "enabled">> & {
    enabled: boolean;
  };
  private client: ClientType | null;
  private server?: Server;
  private accessToken?: string;

  constructor(config: DingtalkChannelConfig) {
    super();
    this.config = {
      enabled: config.enabled ?? true,
      appKey: config.appKey,
      appSecret: config.appSecret,
      serverPort: config.serverPort ?? 3002,
      serverPath: config.serverPath ?? "/dingtalk/events",
    };
    this.client = null;
  }

  public getType(): string {
    return "dingtalk";
  }

  public async start(): Promise<void> {
    if (this.config.enabled === false) {
      this.logInfo("钉钉渠道已禁用");
      return;
    }

    this.setStatus(ChannelStatus.STARTING);
    this.logInfo("启动钉钉渠道...");

    try {
      // 创建钉钉客户端
      this.client = new Client({
        appKey: this.config.appKey,
        appSecret: this.config.appSecret,
      });

      // 获取访问令牌
      const tokenResult = await this.client.getAccessToken();

      if (!tokenResult || !tokenResult.access_token) {
        throw new Error("获取钉钉访问令牌失败");
      }

      this.accessToken = tokenResult.access_token;
      this.logInfo("钉钉客户端初始化成功");

      // 启动事件订阅服务器
      await this._startEventServer();

      this.setStatus(ChannelStatus.RUNNING);
      this.logInfo("钉钉渠道启动成功");
    } catch (error) {
      logger.error({ error }, "钉钉渠道启动失败");
      this.setStatus(ChannelStatus.ERROR);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    this.setStatus(ChannelStatus.STOPPING);
    this.logInfo("停止钉钉渠道...");

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
      this.accessToken = undefined;

      this.setStatus(ChannelStatus.STOPPED);
      this.logInfo("钉钉渠道已停止");
    } catch (error) {
      logger.error({ error }, "钉钉渠道停止失败");
      this.setStatus(ChannelStatus.ERROR);
      throw error;
    }
  }

  public async send(message: OutboundMessage): Promise<void> {
    if (this.getStatus() !== ChannelStatus.RUNNING) {
      this.logWarn("钉钉渠道未运行，无法发送消息");
      return;
    }

    if (!this.client || !this.accessToken) {
      this.logWarn("钉钉客户端未初始化");
      return;
    }

    try {
      const { chatId, content } = message;

      // 发送消息
      const result = await this.client.message.send({
        access_token: this.accessToken,
        msg: {
          msgtype: "text",
          text: {
            content,
          },
        },
        agent_id: this.config.appKey,
        userid_list: chatId,
      });

      if (result.errcode !== 0) {
        throw new Error(`钉钉消息发送失败: ${result.errmsg}`);
      }

      this.logInfo(`钉钉消息已发送至: ${chatId}`);
    } catch (error) {
      logger.error({ error }, "钉钉消息发送失败");
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      return this.getStatus() === ChannelStatus.RUNNING && this.client !== null && this.accessToken !== undefined;
    } catch (error) {
      logger.error({ error }, "钉钉健康检查失败");
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

    await new Promise<void>((resolve, reject) => {
      const server = this.server;
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

    this.logInfo(`钉钉事件服务器已启动，监听端口: ${this.config.serverPort}`);
  }

  /**
   * 处理请求体
   * @param body 请求体字符串
   * @param res HTTP 响应对象
   * @private
   */
  private async _handleRequestBody(body: string, res: ServerResponse): Promise<void> {
    try {
      const data = JSON.parse(body) as DingtalkEvent;

      // 处理事件
      if (data.EventType) {
        await this._handleEvent(data);
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: 0 }));
    } catch (error) {
      logger.error({ error }, "处理钉钉事件失败");
      res.writeHead(500);
      res.end();
    }
  }

  /**
   * 处理钉钉事件
   * @param event 事件对象
   * @private
   */
  private async _handleEvent(event: DingtalkEvent): Promise<void> {
    try {
      // 只处理消息事件
      if (event.EventType !== "check_create" && !event.Text) {
        return;
      }

      const sender = event.Sender;
      const conversation = event.Conversation;

      if (!sender || !conversation) {
        return;
      }

      const senderId = sender.staffId || sender.userId || "unknown";

      const inboundMessage: InboundMessage = {
        channel: "dingtalk",
        senderId,
        chatId: conversation.conversationId,
        content: event.Text?.Content || "",
        timestamp: event.CreateTime || Date.now(),
        messageId: event.MsgId,
        metadata: {
          eventType: event.EventType,
          sender,
          conversation,
          raw: event,
        },
      };

      await this.handleMessage(inboundMessage);
    } catch (error) {
      logger.error({ error }, "处理钉钉消息失败");
    }
  }
}