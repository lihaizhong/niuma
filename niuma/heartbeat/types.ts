/**
 * 心跳服务类型定义
 */

import type { Logger } from "pino";

/**
 * 心跳任务状态
 */
export enum HeartbeatTaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  SUCCESS = "success",
  FAILED = "failed",
  TIMEOUT = "timeout",
}

/**
 * 心跳任务
 */
export interface HeartbeatTask {
  /** 任务名称 */
  name: string;
  /** 任务状态 */
  status: HeartbeatTaskStatus;
  /** 任务输出（成功时） */
  output?: string;
  /** 错误信息（失败时） */
  error?: string;
  /** 执行时长（毫秒） */
  duration?: number;
}

/**
 * 心跳结果
 */
export interface HeartbeatResult {
  /** 执行时间戳 */
  timestamp: string;
  /** 成功任务数量 */
  successCount: number;
  /** 失败任务数量 */
  failureCount: number;
  /** 超时任务数量 */
  timeoutCount: number;
  /** 任务列表 */
  tasks: HeartbeatTask[];
}

/**
 * HEARTBEAT.md 解析结果
 */
export interface HeartbeatParseResult {
  /** 配置信息 */
  config: {
    /** 是否启用 */
    enabled: boolean;
    /** 检查间隔（Cron 表达式） */
    interval: string;
  };
  /** 任务列表 */
  tasks: string[];
}

/**
 * 心跳服务配置
 */
export interface HeartbeatConfig {
  /** 是否启用心跳服务 */
  enabled: boolean;
  /** 检查间隔（Cron 表达式，默认每 30 分钟） */
  interval: string;
  /** HEARTBEAT.md 文件路径（相对于工作区根目录） */
  filePath: string;
  /** 任务执行超时时间（秒，默认 5 分钟） */
  taskTimeout: number;
}

/**
 * Heartbeat 需要的 Agent 接口
 * @description 只包含 HeartbeatService 需要的方法和属性
 */
export interface HeartbeatAgent {
  /** 直接处理消息的方法 */
  processDirect(content: string, options?: { channel?: string; sessionKey?: string }): Promise<string>;
  /** 会话管理器（用于获取活跃渠道） */
  sessions: { getLastActiveChannel(): string | null };
}

/**
 * 心跳服务选项
 */
export interface HeartbeatServiceOptions {
  /** Agent 实例 */
  agent: HeartbeatAgent;
  /** 心跳配置 */
  config: HeartbeatConfig;
  /** Logger 实例 */
  logger: Logger;
  /** 工作区根目录 */
  workspaceRoot: string;
}