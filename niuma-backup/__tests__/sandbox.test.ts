/**
 * 沙箱环境模块测试
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";

import { SandboxManager } from "../agent/sandbox/manager";
import {
  DEFAULT_SANDBOX_CONFIG,
  DEFAULT_RESOURCE_LIMITS,
} from "../agent/sandbox/types";

describe("SandboxManager", () => {
  let manager: SandboxManager;
  const workspace = "/tmp/sandbox-test";

  beforeAll(async () => {
    manager = new SandboxManager(workspace, {
      poolSize: 1,
    });
  });

  afterEach(async () => {
    if (manager.isInitialized()) {
      await manager.shutdown();
    }
  });

  describe("健康检查", () => {
    it("应该能够检查 Docker 连接状态", async () => {
      const health = await manager.healthCheck();

      expect(health).toHaveProperty("healthy");
      expect(health).toHaveProperty("message");
    });
  });

  describe("沙箱执行", () => {
    it("应该能够执行简单命令", async () => {
      await manager.initialize();

      const result = await manager.execute({
        command: "echo",
        args: ["Hello from sandbox"],
      });

      expect(result.stdout).toContain("Hello from sandbox");
      expect(result.exitCode).toBe(0);
    });

    it("应该正确返回退出码", async () => {
      await manager.initialize();

      const result = await manager.execute({
        command: "true",
      });

      expect(result.exitCode).toBe(0);
    });

    it("应该处理命令执行失败", async () => {
      await manager.initialize();

      const result = await manager.execute({
        command: "false",
      });

      expect(result.exitCode).toBe(1);
    });

    it("应该支持超时控制", async () => {
      await manager.initialize();

      const result = await manager.execute({
        command: "sleep",
        args: ["2"],
        timeout: 100,
      });

      expect(result.exitCode).toBe(124);
      expect(result.stderr).toContain("超时");
    });

    it("应该支持环境变量", async () => {
      await manager.initialize();

      const result = await manager.execute({
        command: "echo",
        args: ["$TEST_VAR"],
        env: { TEST_VAR: "test_value" },
      });

      expect(result.stdout).toContain("test_value");
    });
  });

  describe("拦截器", () => {
    it("应该能够获取拦截器", () => {
      const interceptor = manager.getInterceptor();
      expect(interceptor).toBeDefined();
    });

    it("拦截器应该默认启用", () => {
      const interceptor = manager.getInterceptor();
      expect(interceptor.isEnabled()).toBe(true);
    });

    it("应该能够添加拦截工具", () => {
      const interceptor = manager.getInterceptor();
      interceptor.addInterceptedTool("custom_exec");
      expect(interceptor.getInterceptedTools()).toContain("custom_exec");
    });
  });
});

describe("沙箱配置", () => {
  it("应该有默认配置", () => {
    expect(DEFAULT_SANDBOX_CONFIG).toBeDefined();
    expect(DEFAULT_SANDBOX_CONFIG.image).toBe("ubuntu:22.04");
    expect(DEFAULT_SANDBOX_CONFIG.networkIsolation).toBe(true);
  });

  it("应该有默认资源限制", () => {
    expect(DEFAULT_RESOURCE_LIMITS).toBeDefined();
    expect(DEFAULT_RESOURCE_LIMITS.cpuLimit).toBe(1);
    expect(DEFAULT_RESOURCE_LIMITS.memoryLimit).toBe("512m");
    expect(DEFAULT_RESOURCE_LIMITS.timeout).toBe(60000);
  });
});
