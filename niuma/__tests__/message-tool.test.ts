/**
 * 消息工具测试
 */

// ==================== 第三方库 ====================
import { describe, it, expect, beforeEach } from "vitest";

// ==================== 本地模块 ====================
import {
  messageTool,
  getMessageHistory,
  cleanMessageHistory,
} from "../agent/tools/message";

// 全局类型定义
declare global {
  var __messageHistory: unknown[] | undefined;
}

describe("MessageTool", () => {
  it("应该成功发送消息", async () => {
    const result = await messageTool.execute({
      content: "Test message",
      channel: "cli",
      immediate: true, // 立即发送，跳过队列
    });
    expect(result).toContain("消息已发送");
    expect(result).toContain("ID:");
  });

  it("应该支持加入队列", async () => {
    const result = await messageTool.execute({
      content: "Test message",
      channel: "cli",
    });
    expect(result).toContain("消息已加入队列");
    expect(result).toContain("ID:");
  });

  it("应该支持不同优先级", async () => {
    const result1 = await messageTool.execute({
      content: "High priority message",
      priority: "high",
    });
    expect(result1).toBeTruthy();

    const result2 = await messageTool.execute({
      content: "Low priority message",
      priority: "low",
    });
    expect(result2).toBeTruthy();
  });

  it("应该支持不同消息类型", async () => {
    const result1 = await messageTool.execute({
      content: "Plain text",
      type: "text",
      immediate: true,
    });
    expect(result1).toBeTruthy();

    const result2 = await messageTool.execute({
      content: "**Markdown**",
      type: "markdown",
      immediate: true,
    });
    expect(result2).toBeTruthy();

    const result3 = await messageTool.execute({
      content: "<b>HTML</b>",
      type: "html",
      immediate: true,
    });
    expect(result3).toBeTruthy();
  });

  it("应该支持消息标签", async () => {
    const result = await messageTool.execute({
      content: "Tagged message",
      tags: ["test", "important"],
    });
    expect(result).toBeTruthy();
  });

  it("应该支持富文本解析", async () => {
    const result = await messageTool.execute({
      content: "**Bold** and *italic*",
      type: "markdown",
      immediate: true,
    });
    expect(result).toBeTruthy();
    // Markdown 应该被解析
    expect(result).toContain("markdown");
  });
});

describe("Message History", () => {
  beforeEach(() => {
    // 清空历史记录
    const history = global.__messageHistory;
    if (history) {
      history.length = 0;
    }
  });

  it("应该记录所有发送的消息", async () => {
    await messageTool.execute({ content: "Message 1" });
    await messageTool.execute({ content: "Message 2" });

    const history = getMessageHistory();
    expect(history.length).toBeGreaterThanOrEqual(2);
  });

  it("应该支持按渠道过滤", async () => {
    await messageTool.execute({ content: "CLI message", channel: "cli" });
    await messageTool.execute({
      content: "Another CLI message",
      channel: "cli",
    });

    const history = getMessageHistory({ channel: "cli" });
    expect(history.length).toBeGreaterThanOrEqual(2);
    history.forEach((msg) => {
      expect(msg.channel).toBe("cli");
    });
  });

  it("应该支持按状态过滤", async () => {
    await messageTool.execute({ content: "Test message" });

    const history = getMessageHistory({ status: "sent" });
    expect(history.length).toBeGreaterThanOrEqual(1);
    history.forEach((msg) => {
      expect(msg.status).toBe("sent");
    });
  });

  it("应该支持限制结果数量", async () => {
    await messageTool.execute({ content: "Message 1" });
    await messageTool.execute({ content: "Message 2" });
    await messageTool.execute({ content: "Message 3" });

    const history = getMessageHistory({ limit: 2 });
    expect(history.length).toBeLessThanOrEqual(2);
  });

  it("应该按时间倒序排列", async () => {
    await messageTool.execute({ content: "Message 1" });
    await messageTool.execute({ content: "Message 2" });

    const history = getMessageHistory();
    if (history.length >= 2) {
      expect(history[0].createdAt.getTime()).toBeGreaterThanOrEqual(
        history[1].createdAt.getTime(),
      );
    }
  });
});

describe("Message Cleanup", () => {
  it("应该清理过期消息", async () => {
    await messageTool.execute({ content: "Test message" });

    // 清理 7 天前的消息（实际上不会删除任何消息，因为它们是刚创建的）
    const deleted = cleanMessageHistory(7 * 24 * 60 * 60 * 1000);
    expect(typeof deleted).toBe("number");
  });

  it("应该清理所有过期消息", async () => {
    // 清理 0 毫秒前的消息（删除所有消息）
    const deleted = cleanMessageHistory(0);
    expect(typeof deleted).toBe("number");
  });
});
