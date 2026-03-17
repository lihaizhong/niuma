/**
 * 会话管理器测试
 */

// ==================== 内置库 ====================
import { join } from "path";
import { tmpdir } from "os";
import fs from "fs-extra";

// ==================== 第三方库 ====================
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ==================== 本地模块 ====================
import { SessionManager, type Session } from "../session/manager";

describe("SessionManager", () => {
  let manager: SessionManager;
  let tempDir: string;

  beforeEach(async () => {
    // 创建临时目录用于测试
    tempDir = join(tmpdir(), `niuma-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    manager = new SessionManager({ sessionsDir: tempDir });
  });

  afterEach(async () => {
    // 清理临时目录
    await fs.remove(tempDir);
  });

  describe("构造函数", () => {
    it("应该使用自定义 sessionsDir", () => {
      expect(manager.getSessionsDir()).toBe(tempDir);
    });

    it("应该能够使用默认配置创建实例", () => {
      const defaultManager = new SessionManager();
      expect(defaultManager.getSessionsDir()).toContain(".niuma");
    });
  });

  describe("getOrCreate", () => {
    it("应该创建新会话", async () => {
      const session = await manager.getOrCreate("cli:test-chat");

      expect(session.key).toBe("cli:test-chat");
      expect(session.messages).toEqual([]);
      expect(session.channel).toBe("cli");
      expect(session.chatId).toBe("test-chat");
    });

    it("应该返回已存在的会话", async () => {
      const session1 = await manager.getOrCreate("cli:test-chat");
      session1.messages.push({
        role: "user",
        content: "Hello",
        timestamp: new Date().toISOString(),
      });

      const session2 = await manager.getOrCreate("cli:test-chat");

      expect(session2).toBe(session1);
      expect(session2.messages.length).toBe(1);
    });

    it("应该解析包含用户ID的 sessionKey", async () => {
      const session = await manager.getOrCreate("cli:chat-123:user-456");

      expect(session.channel).toBe("cli");
      expect(session.chatId).toBe("chat-123");
      expect(session.userId).toBe("user-456");
    });

    it("应该正确处理无效的 sessionKey 格式", async () => {
      const session = await manager.getOrCreate("invalid-key");

      expect(session.key).toBe("invalid-key");
      expect(session.channel).toBeUndefined();
    });
  });

  describe("save 和加载", () => {
    it("应该保存会话到文件", async () => {
      const session = await manager.getOrCreate("cli:test-save");
      session.messages.push({
        role: "user",
        content: "Test message",
        timestamp: new Date().toISOString(),
      });

      await manager.save(session);

      // 验证文件已创建
      const sessions = manager.listSessions();
      expect(sessions.length).toBeGreaterThan(0);
    });

    it("应该从文件加载已保存的会话", async () => {
      const session1 = await manager.getOrCreate("cli:test-load");
      session1.messages.push({
        role: "user",
        content: "Saved message",
        timestamp: new Date().toISOString(),
      });
      await manager.save(session1);

      // 使缓存失效
      manager.invalidate("cli:test-load");

      // 重新加载
      const session2 = await manager.getOrCreate("cli:test-load");
      expect(session2.messages.length).toBe(1);
      expect(session2.messages[0].content).toBe("Saved message");
    });
  });

  describe("addMessage", () => {
    it("应该添加消息到会话", async () => {
      const session = await manager.getOrCreate("cli:test-add");

      manager.addMessage(session, "user", "Hello");

      expect(session.messages.length).toBe(1);
      expect(session.messages[0].role).toBe("user");
      expect(session.messages[0].content).toBe("Hello");
    });

    it("应该记录工具使用", async () => {
      const session = await manager.getOrCreate("cli:test-tools");

      manager.addMessage(session, "assistant", "Done", ["read_file", "write_file"]);

      expect(session.messages[0].toolsUsed).toEqual(["read_file", "write_file"]);
    });

    it("应该处理无效角色", async () => {
      const session = await manager.getOrCreate("cli:test-invalid-role");

      manager.addMessage(session, "invalid" as any, "Test");

      expect(session.messages[0].role).toBe("user");
    });

    it("应该更新时间戳", async () => {
      const session = await manager.getOrCreate("cli:test-time");
      const oldUpdatedAt = session.updatedAt;

      // 确保有足够的时间差
      await new Promise(resolve => setTimeout(resolve, 10));
      manager.addMessage(session, "user", "Test");

      expect(session.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });
  });

  describe("addMessages", () => {
    it("应该批量添加消息", async () => {
      const session = await manager.getOrCreate("cli:test-batch");

      manager.addMessages(session, [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ]);

      expect(session.messages.length).toBe(2);
    });
  });

  describe("getHistory", () => {
    it("应该返回 ChatMessage 格式的消息", async () => {
      const session = await manager.getOrCreate("cli:test-history");
      manager.addMessage(session, "user", "Hello");
      manager.addMessage(session, "assistant", "Hi");

      const history = manager.getHistory(session, 10);

      expect(history.length).toBe(2);
      expect(history[0]).toEqual({ role: "user", content: "Hello" });
    });

    it("应该限制最大消息数量", async () => {
      const session = await manager.getOrCreate("cli:test-limit");
      manager.addMessage(session, "user", "Msg 1");
      manager.addMessage(session, "assistant", "Msg 2");
      manager.addMessage(session, "user", "Msg 3");

      const history = manager.getHistory(session, 2);

      expect(history.length).toBe(2);
      expect(history[0].content).toBe("Msg 2");
    });
  });

  describe("clear", () => {
    it("应该清空会话消息", async () => {
      const session = await manager.getOrCreate("cli:test-clear");
      manager.addMessage(session, "user", "Hello");

      manager.clear(session);

      expect(session.messages).toEqual([]);
      expect(session.lastConsolidated).toBe(0);
    });
  });

  describe("invalidate 和 delete", () => {
    it("invalidate 应该从缓存中移除会话", async () => {
      await manager.getOrCreate("cli:test-invalidate");

      manager.invalidate("cli:test-invalidate");

      // 重新获取应该是新会话
      const session = await manager.getOrCreate("cli:test-invalidate");
      expect(session.messages).toEqual([]);
    });

    it("delete 应该删除缓存和文件", async () => {
      const session = await manager.getOrCreate("cli:test-delete");
      await manager.save(session);

      manager.delete("cli:test-delete");

      // 重新获取应该是新会话
      const newSession = await manager.getOrCreate("cli:test-delete");
      expect(newSession.messages).toEqual([]);
    });
  });

  describe("listSessions", () => {
    it("应该列出所有会话", async () => {
      const session1 = await manager.getOrCreate("cli:test-list-1");
      const session2 = await manager.getOrCreate("cli:test-list-2");
      await manager.save(session1);
      await manager.save(session2);

      const sessions = manager.listSessions();

      expect(sessions.length).toBeGreaterThanOrEqual(2);
    });

    it("空目录应该返回空数组", () => {
      const emptyManager = new SessionManager({
        sessionsDir: join(tempDir, "empty"),
      });
      expect(emptyManager.listSessions()).toEqual([]);
    });
  });

  describe("parseSessionKey", () => {
    it("应该解析三部分 sessionKey", () => {
      const result = manager.parseSessionKey("cli:chat-123:user-456");

      expect(result).toEqual({
        channel: "cli",
        chatId: "chat-123",
        userId: "user-456",
      });
    });

    it("应该解析两部分 sessionKey", () => {
      const result = manager.parseSessionKey("cli:chat-123");

      expect(result).toEqual({
        channel: "cli",
        chatId: "chat-123",
      });
    });

    it("应该抛出无效 sessionKey 错误", () => {
      expect(() => manager.parseSessionKey("invalid")).toThrow("Invalid session key");
    });
  });

  describe("generateSessionKey", () => {
    it("应该生成包含用户ID的 sessionKey", () => {
      const key = manager.generateSessionKey("cli", "chat-123", "user-456");
      expect(key).toBe("cli:chat-123:user-456");
    });

    it("应该生成不包含用户ID的 sessionKey", () => {
      const key = manager.generateSessionKey("cli", "chat-123");
      expect(key).toBe("cli:chat-123");
    });
  });

  describe("getLastActive", () => {
    it("应该记录最后活跃的会话键", async () => {
      await manager.getOrCreate("cli:test-active");

      expect(manager.getLastActiveSessionKey()).toBe("cli:test-active");
    });

    it("应该记录最后活跃的渠道", async () => {
      const session = await manager.getOrCreate("cli:test-channel");
      manager.addMessage(session, "user", "Test");

      expect(manager.getLastActiveChannel()).toBe("cli");
    });
  });

  describe("updateConsolidated", () => {
    it("应该更新整合时间戳", async () => {
      const session = await manager.getOrCreate("cli:test-consolidate");
      expect(session.lastConsolidated).toBe(0);

      manager.updateConsolidated(session);

      expect(session.lastConsolidated).toBeGreaterThan(0);
    });
  });

  describe("getSessionsByChannel", () => {
    it("应该返回指定渠道的会话", async () => {
      const session1 = await manager.getOrCreate("cli:chat-1");
      const session2 = await manager.getOrCreate("slack:chat-2");
      await manager.save(session1);
      await manager.save(session2);

      const cliSessions = await manager.getSessionsByChannel("cli");

      expect(cliSessions.length).toBeGreaterThanOrEqual(1);
      expect(cliSessions.some(s => s.key === "cli:chat-1")).toBe(true);
    });
  });

  describe("getSessionsByUser", () => {
    it("应该返回指定用户的会话", async () => {
      const session1 = await manager.getOrCreate("cli:chat-1:user-123");
      const session2 = await manager.getOrCreate("cli:chat-2:user-456");
      await manager.save(session1);
      await manager.save(session2);

      const userSessions = await manager.getSessionsByUser("user-123");

      expect(userSessions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getSessionStats", () => {
    it("应该返回会话统计", async () => {
      const session1 = await manager.getOrCreate("cli:chat-1");
      const session2 = await manager.getOrCreate("slack:chat-2");
      await manager.save(session1);
      await manager.save(session2);

      const stats = await manager.getSessionStats();

      expect(stats.total).toBeGreaterThanOrEqual(2);
      expect(typeof stats.byChannel).toBe("object");
    });
  });
});
