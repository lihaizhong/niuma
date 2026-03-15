/**
 * 类型系统测试
 */

import { describe, it, expect } from "vitest";
import type { ChatMessage, ToolDefinition, Session } from "../types";

describe("类型系统", () => {
  describe("ChatMessage", () => {
    it("应该接受有效的消息角色", () => {
      const message1: ChatMessage = {
        role: "user",
        content: "Hello",
      };
      const message2: ChatMessage = {
        role: "assistant",
        content: "Hi there",
      };
      const message3: ChatMessage = {
        role: "system",
        content: "You are a helpful assistant",
      };

      expect(message1.role).toBe("user");
      expect(message2.role).toBe("assistant");
      expect(message3.role).toBe("system");
    });
  });

  describe("ToolDefinition", () => {
    it("应该接受有效的工具定义", () => {
      const tool: ToolDefinition = {
        name: "test_tool",
        description: "A test tool",
        parameters: {
          type: "object",
          properties: {
            input: {
              type: "string",
              description: "Input value",
            },
          },
          required: ["input"],
        },
      };

      expect(tool.name).toBe("test_tool");
      expect(tool.parameters?.type).toBe("object");
    });
  });

  describe("Session", () => {
    it("应该接受有效的会话对象", () => {
      const session: Session = {
        key: "cli:user-123",
        messages: [],
        lastConsolidated: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(session.key).toBe("cli:user-123");
      expect(session.messages).toHaveLength(0);
    });
  });
});
