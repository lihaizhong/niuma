/**
 * 上下文集成测试
 * 测试 Agent ID、SessionManager 和工具之间的协同工作
 */

// ==================== 第三方库 ====================
import { describe, it, expect, beforeEach, afterEach } from "vitest";

// ==================== 本地模块 ====================
import {
  setGlobalRegistry,
  setGlobalSessionManager,
  clearGlobalContext,
} from "../agent/tools/context";
import { messageTool } from "../agent/tools/message";
import { ToolRegistry } from "../agent/tools/registry";
import { SessionManager } from "../session/manager";

describe("上下文集成测试", () => {
  let registry: ToolRegistry;
  let sessionManager: SessionManager;

  beforeEach(() => {
    // 初始化全局上下文
    registry = new ToolRegistry();
    registry.setAgentId("integration-test-agent");
    setGlobalRegistry(registry);

    sessionManager = new SessionManager();
    setGlobalSessionManager(sessionManager);
  });

  afterEach(() => {
    // 清空全局状态
    clearGlobalContext();

    // 清空测试会话
    const sessions = sessionManager.listSessions();
    sessions.forEach((sessionKey) => {
      sessionManager.delete(sessionKey);
    });
  });

  describe("Agent ID 传递", () => {
    it("应该在消息工具中使用正确的 Agent ID", async () => {
      // 验证 Agent ID 已设置
      expect(registry.getAgentId()).toBe("integration-test-agent");

      // 发送消息
      const result = await messageTool.execute({
        content: "Integration test message",
        immediate: true,
      });

      expect(result).toContain("消息已发送");
      expect(result).toContain("ID:");
    });

    it("应该能够动态更新 Agent ID", async () => {
      // 初始 Agent ID
      expect(registry.getAgentId()).toBe("integration-test-agent");

      // 更新 Agent ID
      registry.setAgentId("updated-agent-id");
      expect(registry.getAgentId()).toBe("updated-agent-id");

      // 发送消息应该使用新的 Agent ID
      const result = await messageTool.execute({
        content: "Message with updated agent ID",
        immediate: true,
      });

      expect(result).toContain("消息已发送");
    });
  });

  describe("SessionManager 集成", () => {
    it("应该能够创建和管理会话", async () => {
      const sessionKey = `test-session-key-${Date.now()}`;
      const session = await sessionManager.getOrCreate(sessionKey);
      expect(session).toBeDefined();
      expect(session.key).toBe(sessionKey);

      // 添加消息到会话
      sessionManager.addMessage(session, "user", "Test message");
      await sessionManager.save(session);

      // 验证消息已保存
      const updatedSession = await sessionManager.getOrCreate(sessionKey);
      expect(updatedSession).toBeDefined();
      expect(updatedSession.messages.length).toBeGreaterThan(0);
      expect(updatedSession.messages[updatedSession.messages.length - 1].content).toBe("Test message");
    });

    it("应该支持多个独立会话", async () => {
      const session1 = await sessionManager.getOrCreate("session-1");
      const session2 = await sessionManager.getOrCreate("session-2");

      // 添加不同的消息
      sessionManager.addMessage(session1, "user", "Message 1");
      sessionManager.addMessage(session2, "user", "Message 2");
      await sessionManager.save(session1);
      await sessionManager.save(session2);

      // 验证会话独立性
      const retrieved1 = await sessionManager.getOrCreate("session-1");
      const retrieved2 = await sessionManager.getOrCreate("session-2");

      expect(retrieved1.messages[0].content).toBe("Message 1");
      expect(retrieved2.messages[0].content).toBe("Message 2");
    });

    it("应该能够删除会话", async () => {
      const session = await sessionManager.getOrCreate("delete-test-session");
      sessionManager.addMessage(session, "user", "Message to delete");
      await sessionManager.save(session);

      // 验证会话存在
      const retrievedSession = await sessionManager.getOrCreate("delete-test-session");
      expect(retrievedSession).toBeDefined();
      expect(retrievedSession.messages.length).toBeGreaterThan(0);

      // 删除会话
      sessionManager.delete("delete-test-session");

      // 验证会话已删除（创建新会话应该返回空消息列表）
      const newSession = await sessionManager.getOrCreate("delete-test-session");
      expect(newSession.messages.length).toBe(0);
    });
  });

  describe("跨工具上下文共享", () => {
    it("多个工具应该共享相同的 Agent ID", async () => {
      const agentId = "shared-context-agent";
      registry.setAgentId(agentId);

      expect(registry.getAgentId()).toBe(agentId);

      // 使用消息工具
      const messageResult = await messageTool.execute({
        content: "Test message",
        immediate: true,
      });
      expect(messageResult).toContain("消息已发送");

      // 验证 Agent ID 保持一致
      expect(registry.getAgentId()).toBe(agentId);
    });

    it("多个工具应该共享相同的 SessionManager", async () => {
      // 创建会话
      const session = await sessionManager.getOrCreate("shared-session");
      sessionManager.addMessage(session, "user", "Shared session message");
      await sessionManager.save(session);

      // 验证会话可以通过全局 SessionManager 访问
      const retrieved = await sessionManager.getOrCreate("shared-session");
      expect(retrieved).toBeDefined();
      expect(retrieved.messages[0].content).toBe("Shared session message");
    });
  });

  describe("错误处理", () => {
    it("未设置全局上下文时应该使用默认值", async () => {
      // 清空全局上下文
      setGlobalRegistry(null);
      setGlobalSessionManager(null);

      // 工具应该能够正常工作（使用默认值）
      const result = await messageTool.execute({
        content: "Message without context",
        immediate: true,
      });

      expect(result).toContain("消息已发送");
    });

    it("无效的会话键应该创建新会话", async () => {
      const session = await sessionManager.getOrCreate("non-existent-session");
      expect(session).toBeDefined();
      expect(session.messages.length).toBe(0);
    });
  });
});
