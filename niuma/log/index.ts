/**
 * 统一日志管理模块
 *
 * @description 提供统一的 pino logger 实例，支持：
 * - 默认 logger 实例
 * - 创建带上下文的 logger
 * - 可配置的日志级别
 */

import pino, { type Logger as PinoLogger } from "pino";

// 重新导出 Logger 类型
export type Logger = PinoLogger;

/**
 * 默认日志配置
 */
const DEFAULT_CONFIG = {
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        }
      : undefined,
};

/**
 * 默认 logger 实例
 * 输出到 stderr，避免和 CLI 交互混在一起
 */
export const logger: Logger = pino(DEFAULT_CONFIG, pino.destination(2));

/**
 * 创建带上下文的 logger
 * @param context 上下文名称（如模块名）
 * @returns 带上下文的 logger 实例
 */
export function createLogger(context: string): Logger {
  return pino(
    {
      ...DEFAULT_CONFIG,
      name: context,
    },
    pino.destination(2)
  );
}
