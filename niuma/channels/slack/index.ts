/**
 * Slack 渠道实现
 * @description 基于 Slack Web API 的渠道实现
 * @note 支持 Web API 发送消息，需要配合 Webhook 或 Events API 接收消息
 */

import { BaseChannel, ChannelStatus } from "../base";
import type { InboundMessage, OutboundMessage } from "../../types/message";
import { createLogger } from "../../log";
import { WebClient } from "@slack/web-api";
import type { Server, IncomingMessage, ServerResponse } from "http";

const logger = createLogger("slack-channel");

/**
 * Slack 消息事件
 */
interface SlackMessageEvent {
  type: string;
  user?: string;
  channel?: string;
  text?: string;
  ts?: string;
  thread_ts?: string;
  subtype?: string;
  bot_id?: string;
  [key: string]: unknown;
}

/**
 * Slack 事件回调数据
 */
interface SlackEventCallback {
  type: "event_callback";
  event: SlackMessageEvent;
}

/**
 * Slack URL 验证数据
 */
interface SlackUrlVerification {
  type: "url_verification";
  challenge: string;
}

/**
 * Slack 渠道配置
 */
export interface SlackChannelConfig {
  enabled?: boolean;
  /** Bot Token (xoxb-...) */
  botToken: string;
  /** App Level Token (xapp-...)，用于 Socket Mode */
  appToken?: string;
  /** Signing Secret，用于验证 Webhook 请求 */
  signingSecret?: string;
  /** 服务器端口（用于接收 Webhook） */
  serverPort?: number;
  /** 服务器路径（用于接收 Webhook） */
  serverPath?: string;
}

/**
 * Slack 渠道
 * @description 基于 Slack Web API 的渠道实现
 */
export class SlackChannel extends BaseChannel {
  private config: Required<Omit<SlackChannelConfig, "appToken" | "signingSecret" | "enabled">> & {
    appToken?: string;
    signingSecret?: string;
    enabled: boolean;
  };
  private client: WebClient | null;
  private server?: Server;

  constructor(config: SlackChannelConfig) {
    super();
    this.config = {
      enabled: config.enabled ?? true,
      botToken: config.botToken,
      appToken: config.appToken,
      signingSecret: config.signingSecret,
      serverPort: config.serverPort ?? 3001,
      serverPath: config.serverPath ?? "/slack/events",
    };
    this.client = null;
  }

  public getType(): string {
    return "slack";
  }

  public async start(): Promise<void> {
    if (this.config.enabled === false) {
      this.logInfo("Slack 渠道已禁用");
      return;
    }

    this.setStatus(ChannelStatus.STARTING);
    this.logInfo("启动 Slack 渠道...");

    try {
      // 创建 Slack Web 客户端
      this.client = new WebClient(this.config.botToken);

      // 验证认证
      const authResult = await this.client.auth.test();

      if (!authResult.ok) {
        throw new Error(`Slack 认证失败: ${authResult.error}`);
      }

      this.logInfo(`Slack 客户端初始化成功，Bot: ${authResult.user}`);

      // 如果配置了签名密钥，启动事件服务器
      if (this.config.signingSecret) {
        await this._startEventServer();
      } else {
        this.logInfo("未配置签名密钥，跳过事件服务器启动");
      }

      this.setStatus(ChannelStatus.RUNNING);
      this.logInfo("Slack 渠道启动成功");
    } catch (error) {
      logger.error({ error }, "Slack 渠道启动失败");
      this.setStatus(ChannelStatus.ERROR);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    this.setStatus(ChannelStatus.STOPPING);
    this.logInfo("停止 Slack 渠道...");

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
      this.logInfo("Slack 渠道已停止");
    } catch (error) {
      logger.error({ error }, "Slack 渠道停止失败");
      this.setStatus(ChannelStatus.ERROR);
      throw error;
    }
  }

  public async send(message: OutboundMessage): Promise<void> {
    if (this.getStatus() !== ChannelStatus.RUNNING) {
      this.logWarn("Slack 渠道未运行，无法发送消息");
      return;
    }

    if (!this.client) {
      this.logWarn("Slack 客户端未初始化");
      return;
    }

    try {
      const { chatId, content, replyTo } = message;

      // 发送消息
      const result = await this.client.chat.postMessage({
        channel: chatId,
        text: content,
        thread_ts: replyTo || undefined,
      });

      if (!result.ok) {
        throw new Error(`Slack 消息发送失败: ${result.error}`);
      }

      this.logInfo(`Slack 消息已发送至: ${chatId}`);
    } catch (error) {
      logger.error({ error }, "Slack 消息发送失败");
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      if (this.getStatus() !== ChannelStatus.RUNNING || !this.client) {
        return false;
      }

      const result = await this.client.auth.test();
      return result.ok === true;
    } catch (error) {
      logger.error({ error }, "Slack 健康检查失败");
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

    this.logInfo(`Slack 事件服务器已启动，监听端口: ${this.config.serverPort}`);
  }

  /**
   * 处理请求体
   * @param body 请求体
   * @param res 响应对象
   * @private
   */
  private async _handleRequestBody(body: string, res: ServerResponse): Promise<void> {
    try {
      const data = JSON.parse(body) as SlackUrlVerification | SlackEventCallback;

      // 处理 URL 验证
      if (data.type === "url_verification") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ challenge: data.challenge }));
        return;
      }

      // 处理事件回调
      if (data.type === "event_callback") {
        await this._handleEvent(data.event);
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    } catch (error) {
      logger.error({ error }, "处理 Slack 事件失败");
      res.writeHead(500);
      res.end();
    }
  }

  /**
   * 处理 Slack 事件
   * @param event 事件对象
   * @private
   */
  private async _handleEvent(event: SlackMessageEvent): Promise<void> {
    try {
      // 只处理消息事件
      if (event.type !== "message") {
        return;
      }

      // 跳过 Bot 发送的消息
      if (event.subtype === "bot_message" || event.bot_id) {
        return;
      }

      // 跳过没有文本内容的消息
      if (!event.text) {
        return;
      }

      const inboundMessage: InboundMessage = {
        channel: "slack",
        senderId: event.user ?? "unknown",
        chatId: event.channel ?? "unknown",
        content: event.text,
        timestamp: event.ts ? parseFloat(event.ts) * 1000 : Date.now(),
        messageId: event.ts,
        replyTo: event.thread_ts || undefined,
        metadata: {
          eventType: event.type,
          subtype: event.subtype,
          raw: event,
        },
      };

      await this.handleMessage(inboundMessage);
    } catch (error) {
      logger.error({ error }, "处理 Slack 消息失败");
    }
  }
}