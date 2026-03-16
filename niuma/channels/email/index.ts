/**
 * Email 渠道实现
 * @description 邮件渠道实现，支持 IMAP 接收和 SMTP 发送
 * @note 需要安装 nodemailer 和 imapflow 依赖
 *       pnpm add nodemailer imapflow
 */

import { BaseChannel, ChannelStatus } from "../base";
import type { InboundMessage, OutboundMessage } from "../../types/message";
import { createLogger } from "../../log";
import type { Transporter } from "nodemailer";
import type { ImapFlow, FetchMessageObject } from "imapflow";

const logger = createLogger("email-channel");

/**
 * Email 渠道配置
 */
export interface EmailChannelConfig {
  enabled?: boolean;
  /** IMAP 配置（接收邮件） */
  imap?: {
    host: string;
    port?: number;
    user: string;
    password: string;
    secure?: boolean;
    inbox?: string;
  };
  /** SMTP 配置（发送邮件） */
  smtp?: {
    host: string;
    port?: number;
    secure?: boolean;
    user: string;
    password: string;
    from: string;
  };
  /** 邮件检查间隔（毫秒） */
  checkInterval?: number;
}

/**
 * Email 渠道
 * @description 邮件渠道实现，支持 IMAP 接收和 SMTP 发送
 */
export class EmailChannel extends BaseChannel {
  private config: Required<Omit<EmailChannelConfig, "imap" | "smtp" | "enabled">> & {
    imap?: EmailChannelConfig["imap"];
    smtp?: EmailChannelConfig["smtp"];
    enabled: boolean;
  };
  private imapClient: ImapFlow | null;
  private smtpTransporter: Transporter | null;
  private checkTimer?: NodeJS.Timeout;
  private lastEmailId?: string;

  constructor(config: EmailChannelConfig) {
    super();
    this.config = {
      enabled: config.enabled ?? true,
      imap: config.imap,
      smtp: config.smtp,
      checkInterval: config.checkInterval ?? 60000, // 默认每分钟检查一次
    };
    this.imapClient = null;
    this.smtpTransporter = null;
  }

  public getType(): string {
    return "email";
  }

  public async start(): Promise<void> {
    if (this.config.enabled === false) {
      this.logInfo("Email 渠道已禁用");
      return;
    }

    this.setStatus(ChannelStatus.STARTING);
    this.logInfo("启动 Email 渠道...");

    try {
      // 初始化 IMAP 客户端
      if (this.config.imap) {
        await this._initIMAP();
      }

      // 初始化 SMTP 传输器
      if (this.config.smtp) {
        await this._initSMTP();
      }

      // 启动邮件检查定时器
      if (this.config.imap) {
        this._startEmailCheck();
      }

      this.setStatus(ChannelStatus.RUNNING);
      this.logInfo("Email 渠道启动成功");
    } catch (error) {
      logger.error({ error }, "Email 渠道启动失败");
      this.setStatus(ChannelStatus.ERROR);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    this.setStatus(ChannelStatus.STOPPING);
    this.logInfo("停止 Email 渠道...");

    try {
      // 停止邮件检查定时器
      if (this.checkTimer) {
        clearInterval(this.checkTimer);
        this.checkTimer = undefined;
      }

      // 关闭 IMAP 连接
      if (this.imapClient) {
        try {
          await this.imapClient.logout();
        } catch (error) {
          logger.error({ error }, "关闭 IMAP 连接失败");
        }
        this.imapClient = null;
      }

      // 关闭 SMTP 连接
      if (this.smtpTransporter) {
        try {
          await this.smtpTransporter.close();
        } catch (error) {
          logger.error({ error }, "关闭 SMTP 连接失败");
        }
        this.smtpTransporter = null;
      }

      this.setStatus(ChannelStatus.STOPPED);
      this.logInfo("Email 渠道已停止");
    } catch (error) {
      logger.error({ error }, "Email 渠道停止失败");
      this.setStatus(ChannelStatus.ERROR);
      throw error;
    }
  }

  public async send(message: OutboundMessage): Promise<void> {
    if (this.getStatus() !== ChannelStatus.RUNNING) {
      this.logWarn("Email 渠道未运行，无法发送消息");
      return;
    }

    if (!this.config.smtp || !this.smtpTransporter) {
      this.logWarn("SMTP 未配置，无法发送邮件");
      return;
    }

    try {
      const { chatId, content } = message;

      // 发送邮件
      await this.smtpTransporter.sendMail({
        from: this.config.smtp.from,
        to: chatId,
        subject: "Niuma 自动回复",
        text: content,
      });

      this.logInfo(`邮件已发送至: ${chatId}`);
    } catch (error) {
      logger.error({ error }, "邮件发送失败");
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      return this.getStatus() === ChannelStatus.RUNNING;
    } catch (error) {
      logger.error({ error }, "Email 健康检查失败");
      return false;
    }
  }

  /**
   * 初始化 IMAP 客户端
   * @private
   */
  private async _initIMAP(): Promise<void> {
    try {
      // 动态导入 imapflow
      const { ImapFlow } = await import("imapflow");

      this.imapClient = new ImapFlow({
        host: this.config.imap!.host,
        port: this.config.imap!.port ?? 993,
        secure: this.config.imap!.secure ?? true,
        auth: {
          user: this.config.imap!.user,
          pass: this.config.imap!.password,
        },
      });

      await this.imapClient.connect();
      this.logInfo("IMAP 连接已建立");
    } catch (error) {
      logger.error({ error }, "IMAP 初始化失败");
      throw error;
    }
  }

  /**
   * 初始化 SMTP 传输器
   * @private
   */
  private async _initSMTP(): Promise<void> {
    try {
      // 动态导入 nodemailer
      const nodemailer = await import("nodemailer");

      this.smtpTransporter = nodemailer.createTransport({
        host: this.config.smtp!.host,
        port: this.config.smtp!.port ?? 587,
        secure: this.config.smtp!.secure ?? false,
        auth: {
          user: this.config.smtp!.user,
          pass: this.config.smtp!.password,
        },
      });

      // 验证 SMTP 连接
      await this.smtpTransporter.verify();
      this.logInfo("SMTP 连接已建立");
    } catch (error) {
      logger.error({ error }, "SMTP 初始化失败");
      throw error;
    }
  }

  /**
   * 启动邮件检查定时器
   * @private
   */
  private _startEmailCheck(): void {
    this.checkTimer = setInterval(() => {
      void (async () => {
        try {
          await this._checkNewEmails();
        } catch (error) {
          logger.error({ error }, "检查新邮件失败");
        }
      })();
    }, this.config.checkInterval);
  }

  /**
   * 检查新邮件
   * @private
   */
  private async _checkNewEmails(): Promise<void> {
    if (!this.imapClient) {
      return;
    }

    try {
      await this.imapClient.mailboxOpen(this.config.imap!.inbox ?? "INBOX");

      // 搜索未读邮件
      const searchResult = await this.imapClient.search({ seen: false });

      // 如果没有未读邮件，直接返回
      if (!searchResult) {
        return;
      }

      // 获取未读邮件
      for await (const message of this.imapClient.fetch(
        searchResult,
        { envelope: true, source: true }
      )) {
        try {
          await this._handleEmail(message);
        } catch (error) {
          logger.error({ error }, "处理邮件失败");
        }
      }
    } catch (error) {
      logger.error({ error }, "检查新邮件失败");
    }
  }

  /**
   * 处理邮件
   * @param message 邮件对象
   * @private
   */
  private async _handleEmail(message: FetchMessageObject): Promise<void> {
    try {
      // 检查必要字段是否存在
      if (!message.envelope || !message.envelope.from || message.envelope.from.length === 0) {
        logger.warn("邮件缺少必要的信封信息，跳过处理");
        return;
      }

      const messageId = message.envelope.messageId;

      // 跳过已处理的邮件
      if (this.lastEmailId === messageId) {
        return;
      }

      const sender = message.envelope.from[0];
      const senderAddress = sender.address ?? "unknown";

      const inboundMessage: InboundMessage = {
        channel: "email",
        senderId: senderAddress,
        chatId: senderAddress,
        content: message.source?.toString() ?? "",
        timestamp: message.envelope.date ? new Date(message.envelope.date).getTime() : Date.now(),
        messageId,
        metadata: {
          envelope: message.envelope,
          raw: message,
        },
      };

      await this.handleMessage(inboundMessage);

      // 标记为已读
      if (this.imapClient && message.uid) {
        await this.imapClient.messageFlagsAdd(message.uid, ["\\Seen"]);
      }

      this.lastEmailId = messageId;
    } catch (error) {
      logger.error({ error }, "处理邮件失败");
    }
  }
}
