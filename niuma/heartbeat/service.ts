/**
 * 心跳服务实现
 */

import { readFile } from "fs/promises";
import { join } from "path";
import type { Logger } from "pino";
import cron from "node-cron";
import type { ScheduledTask } from "node-cron";
import type {
  HeartbeatConfig,
  HeartbeatParseResult,
  HeartbeatResult,
  HeartbeatServiceOptions,
  HeartbeatTask,
  HeartbeatAgent,
} from "./types";
import { HeartbeatTaskStatus } from "./types";

/**
 * 解析 HEARTBEAT.md 文件
 * @param filePath HEARTBEAT.md 文件路径
 * @param logger Logger 实例
 * @returns 解析结果
 */
export async function parseHeartbeatFile(
  filePath: string,
  logger: Logger,
): Promise<HeartbeatParseResult | null> {
  try {
    const content = await readFile(filePath, "utf-8");

    // 解析 YAML Frontmatter
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const frontmatterMatch = content.match(frontmatterRegex);

    let enabled = true;
    let interval = "0 */30 * * * *"; // 默认每 30 分钟

    if (frontmatterMatch) {
      const frontmatterText = frontmatterMatch[1];
      const lines = frontmatterText.split("\n");

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("enabled:")) {
          const value = trimmedLine.split(":")[1].trim();
          enabled = value === "true" || value === "1";
        } else if (trimmedLine.startsWith("interval:")) {
          const value = trimmedLine.split(":")[1].trim().replace(/['"]/g, "");
          interval = value;
        }
      }
    }

    // 解析 Markdown 任务列表
    const taskRegex = /^- \[([ x])\]\s+(.+)$/gm;
    const tasks: string[] = [];
    let match;

    while ((match = taskRegex.exec(content)) !== null) {
      tasks.push(match[2].trim());
    }

    return {
      config: {
        enabled,
        interval,
      },
      tasks,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      logger.warn(`HEARTBEAT.md 文件不存在: ${filePath}`);
    } else {
      logger.error({ error }, `解析 HEARTBEAT.md 文件失败: ${filePath}`);
    }
    return null;
  }
}

/**
 * 心跳服务类
 */
export class HeartbeatService {
  /** Agent 实例 */
  private agent: HeartbeatAgent;
  /** 心跳配置 */
  private config: HeartbeatConfig;
  /** Logger 实例 */
  private logger: Logger;
  /** 工作区根目录 */
  private workspaceRoot: string;
  /** 运行状态 */
  private isRunning: boolean = false;
  /** Cron 任务 */
  private cronJob: ScheduledTask | null = null;
  /** 执行计数 */
  private executionCount: number = 0;

  constructor(options: HeartbeatServiceOptions) {
    this.agent = options.agent;
    this.config = options.config;
    this.logger = options.logger;
    this.workspaceRoot = options.workspaceRoot;
  }

  /**
   * 启动心跳服务
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn("心跳服务已经在运行中");
      return;
    }

    this.logger.info({ config: this.config }, "启动心跳服务");

    this.isRunning = true;
    this.executionCount = 0;

    try {
      // 创建 CronJob
      this.cronJob = cron.schedule(
        this.config.interval,
        () => {
          this.checkHeartbeat().catch((error) => {
            this.logger.error({ error }, "心跳检查执行失败");
          });
        },
        {
          timezone: "Asia/Shanghai",
        },
      );

      this.logger.info({ interval: this.config.interval }, "心跳服务已启动");
    } catch (error) {
      this.logger.error({ error }, "创建 CronJob 失败");
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * 停止心跳服务
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn("心跳服务未运行");
      return;
    }

    this.logger.info({ executionCount: this.executionCount }, "停止心跳服务");

    this.isRunning = false;

    if (this.cronJob) {
      void this.cronJob.stop();
      this.cronJob = null;
    }

    this.logger.info("心跳服务已停止");
  }

  /**
   * 检查心跳（主循环）
   */
  private async checkHeartbeat(): Promise<void> {
    this.executionCount++;
    this.logger.info({ count: this.executionCount }, "执行心跳检查");

    const filePath = join(this.workspaceRoot, this.config.filePath);
    const parseResult = await parseHeartbeatFile(filePath, this.logger);

    if (!parseResult) {
      this.logger.warn("无法解析 HEARTBEAT.md 文件，跳过本次心跳检查");
      return;
    }

    if (!parseResult.config.enabled) {
      this.logger.info("HEARTBEAT.md 中禁用了心跳任务");
      return;
    }

    if (parseResult.tasks.length === 0) {
      this.logger.info("HEARTBEAT.md 中没有任务");
      return;
    }

    this.logger.info({ tasks: parseResult.tasks }, `发现 ${parseResult.tasks.length} 个任务`);

    // 执行任务
    const result = await this.executeTasks(parseResult.tasks);

    // 格式化并发送结果
    const formattedResult = this.formatHeartbeatResult(result);
    await this.sendHeartbeatResult(result);
  }

  /**
   * 执行任务列表
   * @param tasks 任务名称列表
   * @returns 心跳结果
   */
  private async executeTasks(tasks: string[]): Promise<HeartbeatResult> {
    const taskResults: HeartbeatTask[] = [];
    let successCount = 0;
    let failureCount = 0;
    let timeoutCount = 0;

    for (const taskName of tasks) {
      const startTime = Date.now();
      const task: HeartbeatTask = {
        name: taskName,
        status: HeartbeatTaskStatus.RUNNING,
      };

      taskResults.push(task);

      try {
        // 设置超时保护
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error(`任务超时（${this.config.taskTimeout}秒）`)),
            this.config.taskTimeout * 1000,
          );
        });

        // 执行任务（这里简单模拟，实际应该通过 Agent 执行）
        const taskPromise = this.executeSingleTask(taskName);

        await Promise.race([taskPromise, timeoutPromise]);

        task.status = HeartbeatTaskStatus.SUCCESS;
        task.duration = Date.now() - startTime;
        successCount++;

        this.logger.info({ task: taskName, duration: task.duration }, "任务执行成功");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        task.duration = Date.now() - startTime;

        if (errorMessage.includes("超时")) {
          task.status = HeartbeatTaskStatus.TIMEOUT;
          task.error = errorMessage;
          timeoutCount++;
          this.logger.error({ task: taskName, duration: task.duration }, "任务执行超时");
        } else {
          task.status = HeartbeatTaskStatus.FAILED;
          task.error = errorMessage;
          failureCount++;
          this.logger.error({ task: taskName, error: errorMessage }, "任务执行失败");
        }
      }
    }

    return {
      timestamp: new Date().toISOString(),
      successCount,
      failureCount,
      timeoutCount,
      tasks: taskResults,
    };
  }

  /**
   * 执行单个任务
   * @param taskName 任务名称
   * @returns 任务执行结果
   */
  private async executeSingleTask(taskName: string): Promise<string> {
    this.logger.info({ taskName }, "执行任务");

    try {
      // 通过 Agent 执行任务
      // 将任务作为消息发送给 Agent，让 Agent 决定如何执行
      const response = await this.agent.processDirect(taskName, {
        channel: "heartbeat",
        sessionKey: "heartbeat:tasks",
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error({ taskName, error: errorMessage }, "通过 Agent 执行任务失败");
      throw error;
    }
  }

  /**
   * 格式化心跳结果
   */
  private formatHeartbeatResult(result: HeartbeatResult): string {
    const timestamp = new Date(result.timestamp).toLocaleString("zh-CN");

    let message = `## 心跳检查结果\n\n`;
    message += `**执行时间**: ${timestamp}\n\n`;
    message += `### 统计\n\n`;
    message += `- ✅ 成功: ${result.successCount}\n`;
    message += `- ❌ 失败: ${result.failureCount}\n`;
    message += `- ⏱️ 超时: ${result.timeoutCount}\n`;
    message += `- 📊 总计: ${result.tasks.length}\n\n`;

    if (result.tasks.length > 0) {
      message += `### 任务详情\n\n`;

      for (const task of result.tasks) {
        const statusIcon = this.getStatusIcon(task.status);
        message += `${statusIcon} **${task.name}**\n`;

        if (task.duration !== undefined) {
          message += `   - 耗时: ${task.duration}ms\n`;
        }

        if (task.status === HeartbeatTaskStatus.SUCCESS && task.output) {
          message += `   - 输出: ${task.output}\n`;
        }

        if (task.status === HeartbeatTaskStatus.FAILED && task.error) {
          message += `   - 错误: ${task.error}\n`;
        }

        if (task.status === HeartbeatTaskStatus.TIMEOUT && task.error) {
          message += `   - 错误: ${task.error}\n`;
        }

        message += `\n`;
      }
    }

    return message;
  }

  /**
   * 获取状态图标
   * @param status 任务状态
   * @returns 状态图标
   */
  private getStatusIcon(status: HeartbeatTaskStatus): string {
    switch (status) {
      case HeartbeatTaskStatus.SUCCESS:
        return "✅";
      case HeartbeatTaskStatus.FAILED:
        return "❌";
      case HeartbeatTaskStatus.TIMEOUT:
        return "⏱️";
      case HeartbeatTaskStatus.RUNNING:
        return "⏳";
      case HeartbeatTaskStatus.PENDING:
        return "⏸️";
      default:
        return "❓";
    }
  }

  /**
   * 发送心跳结果
   */
  private async sendHeartbeatResult(result: HeartbeatResult): Promise<void> {
    try {
      // 获取最近活跃的渠道
      const activeChannel = await this.agent.sessions.getLastActiveChannel();

      if (!activeChannel) {
        this.logger.warn("没有活跃的渠道，使用 CLI 渠道发送结果");
        this.sendToCLI(result);
        return;
      }

      // 格式化结果为 Markdown
      const formattedResult = this.formatHeartbeatResult(result);

      // 通过 Agent 的 processDirect 方法发送结果
      // 注意：这里只是通过 Agent 处理消息，实际的消息发送由 Agent 的消息总线处理
      this.logger.info({ channel: activeChannel }, "发送心跳结果到活跃渠道");

      // 将心跳结果作为消息发送给 Agent
      await this.agent.processDirect(formattedResult, {
        channel: activeChannel,
        sessionKey: `heartbeat:${activeChannel}`,
      });

      this.logger.info("心跳结果已发送");
    } catch (error) {
      this.logger.error({ error }, "发送心跳结果失败");

      // 回退到 CLI 渠道
      this.logger.info("回退到 CLI 渠道发送结果");
      this.sendToCLI(result);
    }
  }

  /**
   * 发送到 CLI 渠道
   * @param result 心跳结果
   */
  private sendToCLI(result: HeartbeatResult): void {
    const formattedResult = this.formatHeartbeatResult(result);
    console.log("\n" + "=".repeat(50));
    console.log(formattedResult);
    console.log("=".repeat(50) + "\n");
  }
}