/**
 * CLI 渠道实现
 * 命令行界面的渠道实现，通过 stdin/stdout 进行消息交互
 */

import readline from "readline";

import { sleep } from "../../utils/retry";
import { BaseChannel, ChannelStatus } from "../base";

import type { InboundMessage, OutboundMessage } from "../../types/message";

/**
 * CLI 渠道配置
 */
export interface CLIChannelConfig {
  /** 是否启用 */
  enabled?: boolean;
  /** 提示符 */
  prompt?: string;
  /** 欢迎消息 */
  welcomeMessage?: string;
}

/**
 * CLI 渠道
 * 命令行界面的渠道实现
 */
export class CLIChannel extends BaseChannel {
  /** Readline 接口 */
  private rl?: readline.Interface;

  /** CLI 配置 */
  private config: Required<CLIChannelConfig>;

  /** 用户标识 */
  private userId: string = "cli:user";

  /** 聊天标识 */
  private chatId: string = "cli:default";

  /** 消息计数器 */
  private messageCounter: number = 0;

  constructor(config: CLIChannelConfig = {}) {
    super();
    this.config = {
      enabled: config.enabled ?? true,
      prompt: config.prompt ?? "You > ",
      welcomeMessage: config.welcomeMessage ?? "Niuma 助手已启动，输入消息开始对话（输入 /exit 退出）",
    };
  }

  public getType(): string {
    return "cli";
  }

  public async start(): Promise<void> {
    if (this.config.enabled === false) {
      this.logInfo("CLI 渠道已禁用");
      return;
    }

    this.setStatus(ChannelStatus.STARTING);
    this.logInfo("启动 CLI 渠道...");

    try {
      // 创建 readline 接口
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: this.config.prompt,
      });

      // 监听行输入
      this.rl.on("line", (input) => {
        this.handleUserInput(input).catch((error) => {
          this.logError("处理用户输入失败", this.classifyError(error));
        });
      });

      // 监听关闭事件
      this.rl.on("close", () => {
        this.logInfo("CLI 渠道已关闭");
        this.setStatus(ChannelStatus.STOPPED);
      });

      // 显示欢迎消息
      if (this.config.welcomeMessage) {
        console.log(this.config.welcomeMessage);
      }

      // 显示提示符
      this.rl?.prompt();

      this.setStatus(ChannelStatus.RUNNING);
      this.logInfo("CLI 渠道启动成功");
    } catch (error) {
      this.logError("CLI 渠道启动失败", this.classifyError(error));
      this.setStatus(ChannelStatus.ERROR);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (this.getStatus() === ChannelStatus.STOPPED) {
      return;
    }

    this.setStatus(ChannelStatus.STOPPING);
    this.logInfo("停止 CLI 渠道...");

    try {
      if (this.rl) {
        this.rl.close();
        this.rl = undefined;
      }

      this.setStatus(ChannelStatus.STOPPED);
      this.logInfo("CLI 渠道已停止");
    } catch (error) {
      this.logError("CLI 渠道停止失败", this.classifyError(error));
      this.setStatus(ChannelStatus.ERROR);
      throw error;
    }
  }

  public async send(message: OutboundMessage): Promise<void> {
    if (this.getStatus() !== ChannelStatus.RUNNING) {
      this.logWarn("CLI 渠道未运行，无法发送消息");
      return;
    }

    try {
      console.log(`Niuma > ${message.content}`);
      this.rl?.prompt();
    } catch (error) {
      this.logError("发送消息失败", this.classifyError(error));
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    return this.getStatus() === ChannelStatus.RUNNING && this.rl !== undefined;
  }

  /**
   * 处理用户输入
   * @param input 用户输入的内容
   * @private
   */
  private async handleUserInput(input: string): Promise<void> {
    const trimmedInput = input.trim();

    // 处理退出命令
    if (trimmedInput === "/exit" || trimmedInput === "/quit") {
      this.logInfo("用户请求退出");
      await this.stop();
      // 给消息处理循环一点时间完成
      await sleep(100);
      process.exit(0);
      return;
    }

    // 处理空输入
    if (!trimmedInput) {
      this.rl?.prompt();
      return;
    }

    // 处理斜杠命令
    if (trimmedInput.startsWith("/")) {
      await this.handleSlashCommand(trimmedInput);
      return;
    }

    // 构造入站消息
    const message: InboundMessage = {
      channel: "cli",
      senderId: this.userId,
      chatId: this.chatId,
      content: trimmedInput,
      sessionKey: `${this.chatId}:${this.userId}`,
      timestamp: Date.now(),
      messageId: `cli:${++this.messageCounter}`,
    };

    // 处理消息
    await this.handleMessage(message);
  }

  /**
   * 处理斜杠命令
   * @param command 命令字符串
   * @private
   */
  private async handleSlashCommand(command: string): Promise<void> {
    const [cmd, ...args] = command.split(" ");

    switch (cmd) {
      case "/exit":
      case "/quit":
        this.logInfo("用户请求退出");
        await this.stop();
        await sleep(100);
        process.exit(0);
        return;

      case "/clear":
        console.clear();
        break;

      case "/status":
        console.log(`
CLI 渠道状态：
  状态: ${this.getStatus()}
  用户ID: ${this.userId}
  聊天ID: ${this.chatId}
  消息数: ${this.messageCounter}
        `);
        break;

      default: {
        // 将未知命令作为消息发送给 AgentLoop 处理
        const message: InboundMessage = {
          channel: "cli",
          senderId: this.userId,
          chatId: this.chatId,
          content: command,
          sessionKey: `${this.chatId}:${this.userId}`,
          timestamp: Date.now(),
          messageId: `cli:${++this.messageCounter}`,
        };
        await this.handleMessage(message);
        return; // handleMessage 会调用 prompt，这里直接返回
      }
    }

    this.rl?.prompt();
  }

  /**
   * 设置用户标识
   * @param userId 用户标识
   */
  public setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * 设置聊天标识
   * @param chatId 聊天标识
   */
  public setChatId(chatId: string): void {
    this.chatId = chatId;
  }
}