/**
 * 沙箱 Provider 插件架构测试
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import { SandboxManager } from "../agent/sandbox/manager";
import { SandboxRegistry } from "../agent/sandbox/providers/index";
import { NoopSandboxProvider } from "../agent/sandbox/providers/noop";

describe("SandboxRegistry", () => {
  beforeEach(() => {
    SandboxRegistry.clear();
  });

  describe("Provider 注册表", () => {
    it("应该能够注册和获取 Provider", () => {
      const mockFactory = () => null;
      SandboxRegistry.register("test-provider", mockFactory);
      
      const factory = SandboxRegistry.get("test-provider");
      expect(factory).toBe(mockFactory);
    });

    it("获取不存在的 Provider 应该返回 null", () => {
      const factory = SandboxRegistry.get("nonexistent");
      expect(factory).toBeNull();
    });
  });
});

describe("NoopSandboxProvider", () => {
  describe("isAvailable", () => {
    it("Noop Provider 应该始终返回 true", async () => {
      const provider = NoopSandboxProvider.create();
      const available = await provider.isAvailable();
      expect(available).toBe(true);
    });
  });

  describe("execute", () => {
    it("执行只记录日志并返回空结果", async () => {
      const provider = NoopSandboxProvider.create();
      const result = await provider.execute({
        command: "any",
        args: [],
      });

      expect(result.stdout).toBe("");
      expect(result.stderr).toBe("");
      expect(result.exitCode).toBe(0);
      expect(result.duration).toBe(0);
    });
  });

  describe("shutdown", () => {
    it("shutdown 不应该抛出错误", async () => {
      const provider = NoopSandboxProvider.create();
      await expect(provider.shutdown()).resolves.toBeUndefined();
    });
  });
});

describe("SandboxManager.create() 工厂方法", () => {
  it("配置 noop 应该返回 SandboxManager 实例", async () => {
    const manager = await SandboxManager.create("/tmp/test", {
      provider: "noop",
    });

    expect(manager).toBeDefined();
    expect(manager.getProvider()?.name).toBe("noop");
  });

  it("未配置 provider 时应该不返回 null", async () => {
    const manager = await SandboxManager.create("/tmp/test", {});
    expect(manager).toBeDefined();
  });

  it("manager 应该能够执行（使用 Noop Provider）", async () => {
    const manager = await SandboxManager.create("/tmp/test", {
      provider: "noop",
    });

    const result = await manager.execute({ command: "echo" });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("");
  });

  it("manager shutdown 应该正常工作", async () => {
    const manager = await SandboxManager.create("/tmp/test", {
      provider: "noop",
    });

    await expect(manager.shutdown()).resolves.toBeUndefined();
  });
});
