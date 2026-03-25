/**
 * 类型安全的事件总线
 */

// ==================== 内置库 ====================
import { EventEmitter } from "events";

// ==================== 本地模块 ====================
import { createLogger } from "../log";

import type { EventType, EventMap, EventPayload } from "../types/events";

const logger = createLogger("events");

// ============================================
// EventBus 类
// ============================================

/**
 * 类型安全的事件总线
 * 直接使用 EventEmitter，提供类型安全的封装
 */
export class EventBus {
  private bus = new EventEmitter();

  constructor() {
    this.bus.setMaxListeners(100);
  }

  /**
   * 发射事件
   */
  emit<K extends EventType>(type: K, data: EventMap[K]): void {
    this.bus.emit(type, {
      type,
      data,
      timestamp: Date.now(),
    } satisfies EventPayload<K>);
  }

  /**
   * 监听事件
   */
  on<K extends EventType>(
    type: K,
    handler: (data: EventMap[K]) => void | Promise<void>,
  ): void {
    this.bus.on(type, (payload: EventPayload<K>) => {
      try {
        const result = handler(payload.data);
        if (result instanceof Promise) {
          result.catch((error) => {
            logger.error({ event: type, error }, "事件处理器执行错误");
            // 发射错误事件
            this.emit("ERROR", {
              error: error instanceof Error ? error : new Error(String(error)),
              context: { event: type },
            });
          });
        }
      } catch (error) {
        logger.error({ event: type, error }, "事件处理器执行错误");
        // 发射错误事件
        this.emit("ERROR", {
          error: error instanceof Error ? error : new Error(String(error)),
          context: { event: type },
        });
      }
    });
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(type?: EventType): void {
    this.bus.removeAllListeners(type);
  }
}

// ============================================
// 事件名称常量
// ============================================

export const EventNames = {
  MESSAGE_RECEIVED: "MESSAGE_RECEIVED",
  MESSAGE_SENT: "MESSAGE_SENT",
  TOOL_CALL_START: "TOOL_CALL_START",
  TOOL_CALL_END: "TOOL_CALL_END",
  LLM_REQUEST_START: "LLM_REQUEST_START",
  LLM_RESPONSE: "LLM_RESPONSE",
  ERROR: "ERROR",
  HEARTBEAT: "HEARTBEAT",
} as const;

export type EventName = (typeof EventNames)[keyof typeof EventNames];
