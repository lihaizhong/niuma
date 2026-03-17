/**
 * 渠道类型定义
 * 渠道相关的类型定义
 */

import type { BaseChannel } from "./base";
import type { ChannelConfig } from "../config/schema";

/**
 * 渠道选项
 */
export interface ChannelOptions {
  /** 渠道配置 */
  config: ChannelConfig;
  /** 全局默认配置 */
  defaults: {
    timeout: number;
    retryAttempts: number;
  };
  /** 调试模式 */
  debug?: boolean;
}

/**
 * 渠道配置信息
 */
export interface ChannelInfo {
  /** 渠道类型 */
  type: string;
  /** 是否启用 */
  enabled: boolean;
  /** 状态 */
  status: "idle" | "starting" | "running" | "stopping" | "stopped" | "error";
  /** 配置 */
  config: ChannelConfig;
  /** 启动时间 */
  startedAt?: Date;
  /** 最后错误信息 */
  lastError?: string;
  /** 最后错误时间 */
  lastErrorAt?: Date;
}

/**
 * 渠道统计信息
 */
export interface ChannelStats {
  /** 接收的消息数 */
  messagesReceived: number;
  /** 发送的消息数 */
  messagesSent: number;
  /** 发送失败的消息数 */
  messagesFailed: number;
  /** 最后活跃时间 */
  lastActiveAt?: Date;
  /** 平均响应时间（毫秒） */
  avgResponseTime?: number;
}

/**
 * 渠道注册信息
 */
export interface ChannelRegistration {
  /** 渠道实例 */
  channel: BaseChannel;
  /** 渠道配置 */
  config: ChannelConfig;
  /** 渠道统计 */
  stats: ChannelStats;
}