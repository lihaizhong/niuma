/**
 * 工具上下文测试
 */

// ==================== 第三方库 ====================
import { describe, it, expect, afterEach } from "vitest";

// ==================== 本地模块 ====================
import {
  setGlobalRegistry,
  getGlobalRegistry,
  setGlobalSessionManager,
  getGlobalSessionManager,
  clearGlobalContext,
} from "../agent/tools/context";
import { ToolRegistry } from "../agent/tools/registry";
import { SessionManager } from "../session/manager";

describe("全局上下文", () => {
  describe("ToolRegistry", () => {
    afterEach(() => {
      // 清空全局状态
      clearGlobalContext();
    });

    it("应该能够设置和获取全局 ToolRegistry", () => {
      const registry = new ToolRegistry();
      setGlobalRegistry(registry);
      expect(getGlobalRegistry()).toBe(registry);
    });

    it("未设置时应该返回 null", () => {
      expect(getGlobalRegistry()).toBeNull();
    });

    it("应该能够覆盖已存在的 ToolRegistry", () => {
      const registry1 = new ToolRegistry();
      const registry2 = new ToolRegistry();

      setGlobalRegistry(registry1);
      expect(getGlobalRegistry()).toBe(registry1);

      setGlobalRegistry(registry2);
      expect(getGlobalRegistry()).toBe(registry2);
    });
  });

  describe("SessionManager", () => {
    afterEach(() => {
      // 清空全局状态
      clearGlobalContext();
    });

    it("应该能够设置和获取全局 SessionManager", () => {
      const sessionManager = new SessionManager();
      setGlobalSessionManager(sessionManager);
      expect(getGlobalSessionManager()).toBe(sessionManager);
    });

    it("未设置时应该返回 null", () => {
      expect(getGlobalSessionManager()).toBeNull();
    });

    it("应该能够覆盖已存在的 SessionManager", () => {
      const sessionManager1 = new SessionManager();
      const sessionManager2 = new SessionManager();

      setGlobalSessionManager(sessionManager1);
      expect(getGlobalSessionManager()).toBe(sessionManager1);

      setGlobalSessionManager(sessionManager2);
      expect(getGlobalSessionManager()).toBe(sessionManager2);
    });
  });

  describe("独立性", () => {
    it("ToolRegistry 和 SessionManager 应该独立工作", () => {
      const registry = new ToolRegistry();
      const sessionManager = new SessionManager();

      setGlobalRegistry(registry);
      setGlobalSessionManager(sessionManager);

      expect(getGlobalRegistry()).toBe(registry);
      expect(getGlobalSessionManager()).toBe(sessionManager);

      setGlobalRegistry(null);
      expect(getGlobalRegistry()).toBeNull();
      expect(getGlobalSessionManager()).toBe(sessionManager);

      setGlobalSessionManager(null);
      expect(getGlobalSessionManager()).toBeNull();
    });
  });
});