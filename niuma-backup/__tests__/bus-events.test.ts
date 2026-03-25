/**
 * 事件总线测试
 */

// ==================== 第三方库 ====================
import { describe, it, expect, beforeEach, vi } from "vitest";

// ==================== 本地模块 ====================
import { EventBus, EventNames } from "../bus/events";

import type { EventPayload, EventMap } from "../types/events";
import type { LLMResponse } from "../types/llm";
import type { InboundMessage, OutboundMessage } from "../types/message";

describe("EventBus", () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  describe("emit 和 on", () => {
    it("应该发射和监听事件", () => {
      const handler = vi.fn();
      bus.on("MESSAGE_RECEIVED", handler);

      bus.emit("MESSAGE_RECEIVED", {
        message: {
          channel: "cli",
          senderId: "test-user",
          chatId: "test-123",
          content: "Hello",
        },
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("应该传递正确的事件数据", () => {
      let receivedData: EventMap["TOOL_CALL_START"] | null = null;
      bus.on("TOOL_CALL_START", (data) => {
        receivedData = data;
      });

      bus.emit("TOOL_CALL_START", {
        toolName: "read_file",
        args: { path: "/test" },
        callId: "call-123",
      });

      expect(receivedData).toEqual({
        toolName: "read_file",
        args: { path: "/test" },
        callId: "call-123",
      });
    });

    it("应该支持多个监听器", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      bus.on("ERROR", handler1);
      bus.on("ERROR", handler2);

      bus.emit("ERROR", {
        error: new Error("Test error"),
        context: { test: true },
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("应该处理异步监听器", async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      bus.on("LLM_RESPONSE", handler);

      bus.emit("LLM_RESPONSE", {
        response: { content: "test" } as unknown as LLMResponse,
        duration: 100,
      });

      // 等待异步处理完成
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("错误处理", () => {
    it("应该捕获同步处理器的错误", async () => {
      const errorHandler = vi.fn();
      bus.on("ERROR", errorHandler);

      bus.on("MESSAGE_SENT", () => {
        throw new Error("Handler error");
      });

      bus.emit("MESSAGE_SENT", {
        message: {
          channel: "cli",
          chatId: "test",
          content: "Test",
        },
      });

      // 等待错误事件处理
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(errorHandler).toHaveBeenCalled();
    });

    it("应该捕获异步处理器的错误", async () => {
      const errorHandler = vi.fn();
      bus.on("ERROR", errorHandler);

      bus.on("TOOL_CALL_END", async () => {
        throw new Error("Async handler error");
      });

      bus.emit("TOOL_CALL_END", {
        toolName: "test",
        result: "ok",
        success: true,
        duration: 0,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe("removeAllListeners", () => {
    it("应该能够移除指定类型的监听器", () => {
      const freshBus = new EventBus();
      
      const handler = vi.fn();
      freshBus.on("MESSAGE_RECEIVED", handler);

      // 验证监听器已注册并工作
      freshBus.emit("MESSAGE_RECEIVED", {
        message: { channel: "cli", senderId: "test-user", chatId: "test", content: "test" },
      });
      expect(handler).toHaveBeenCalledTimes(1);

      // 移除监听器
      freshBus.removeAllListeners("MESSAGE_RECEIVED");

      // 清空 mock 计数
      handler.mockClear();

      // 再次发射事件
      freshBus.emit("MESSAGE_RECEIVED", {
        message: { channel: "cli", senderId: "test-user", chatId: "test", content: "test" },
      });

      // 验证监听器已被移除
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("EventNames 常量", () => {
    it("应该导出正确的事件名称", () => {
      expect(EventNames.MESSAGE_RECEIVED).toBe("MESSAGE_RECEIVED");
      expect(EventNames.MESSAGE_SENT).toBe("MESSAGE_SENT");
      expect(EventNames.TOOL_CALL_START).toBe("TOOL_CALL_START");
      expect(EventNames.TOOL_CALL_END).toBe("TOOL_CALL_END");
      expect(EventNames.LLM_REQUEST_START).toBe("LLM_REQUEST_START");
      expect(EventNames.LLM_RESPONSE).toBe("LLM_RESPONSE");
      expect(EventNames.ERROR).toBe("ERROR");
      expect(EventNames.HEARTBEAT).toBe("HEARTBEAT");
    });
  });

  describe("事件载荷格式", () => {
    it("应该包含正确的元数据", () => {
      let receivedPayload: EventPayload | null = null;

      // 直接访问内部 EventEmitter 来验证载荷格式
      // 注意：这里需要访问私有属性进行测试，使用 any 是合理的
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const busInternal = bus as any;
      const originalEmit = busInternal.bus.emit.bind(busInternal.bus);
      busInternal.bus.emit = (type: string, payload: EventPayload) => {
        receivedPayload = payload;
        return originalEmit(type, payload);
      };
      /* eslint-enable @typescript-eslint/no-explicit-any */

      const handler = vi.fn();
      bus.on("HEARTBEAT", handler);

      const beforeEmit = Date.now();
      bus.emit("HEARTBEAT", {
        timestamp: beforeEmit,
        uptime: 12345,
      });

      expect(receivedPayload).not.toBeNull();
      expect(receivedPayload!.type).toBe("HEARTBEAT");
      expect(receivedPayload!.timestamp).toBeGreaterThanOrEqual(beforeEmit);
      expect(receivedPayload!.data).toEqual({
        timestamp: beforeEmit,
        uptime: 12345,
      });
    });
  });

  describe("类型安全", () => {
    it("应该接受所有定义的事件类型", () => {
      // 这个测试主要是 TypeScript 编译时检查
      const handlers = {
        MESSAGE_RECEIVED: vi.fn(),
        MESSAGE_SENT: vi.fn(),
        TOOL_CALL_START: vi.fn(),
        TOOL_CALL_END: vi.fn(),
        LLM_REQUEST_START: vi.fn(),
        LLM_RESPONSE: vi.fn(),
        ERROR: vi.fn(),
        HEARTBEAT: vi.fn(),
      };

      // 注册所有类型的处理器
      (Object.keys(handlers) as Array<keyof typeof handlers>).forEach((type) => {
        bus.on(type, handlers[type]);
      });

      // 发射所有类型的事件
      bus.emit("MESSAGE_RECEIVED", { message: {} as unknown as InboundMessage });
      bus.emit("MESSAGE_SENT", { message: {} as unknown as OutboundMessage });
      bus.emit("TOOL_CALL_START", { toolName: "test", args: {}, callId: "1" });
      bus.emit("TOOL_CALL_END", { toolName: "test", result: "", success: true, duration: 0 });
      bus.emit("LLM_REQUEST_START", { messages: [], model: "test" });
      bus.emit("LLM_RESPONSE", { response: {} as unknown as LLMResponse, duration: 0 });
      bus.emit("ERROR", { error: new Error() });
      bus.emit("HEARTBEAT", { timestamp: 0, uptime: 0 });

      // 验证所有处理器都被调用
      Object.values(handlers).forEach((handler) => {
        expect(handler).toHaveBeenCalledTimes(1);
      });
    });
  });
});
