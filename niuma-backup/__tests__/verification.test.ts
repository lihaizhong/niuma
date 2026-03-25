/**
 * 自验证循环测试
 */

import { describe, it, expect } from "vitest";

import {
  SelfVerification,
  ErrorInjector,
} from "../agent/verification";

describe("SelfVerification", () => {
  describe("配置", () => {
    it("应该默认禁用", () => {
      const verification = new SelfVerification();
      expect(verification.isEnabled()).toBe(false);
    });

    it("应该能够启用和禁用", () => {
      const verification = new SelfVerification();
      verification.enable();
      expect(verification.isEnabled()).toBe(true);
      verification.disable();
      expect(verification.isEnabled()).toBe(false);
    });

    it("应该支持自定义配置", () => {
      const verification = new SelfVerification({
        config: {
          enabled: true,
          maxRetries: 5,
          testCommand: "make test",
        },
      });

      expect(verification.isEnabled()).toBe(true);
    });
  });

  describe("验证", () => {
    it("禁用时应该返回通过", async () => {
      const verification = new SelfVerification();

      const result = await verification.verify({
        taskId: "test-1",
        taskName: "Test Task",
      });

      expect(result.passed).toBe(true);
    });

    it("应该支持自定义测试命令", async () => {
      const verification = new SelfVerification({
        config: {
          enabled: true,
          testCommand: "echo 'test'",
          successExitCodes: [0],
        },
      });

      const result = await verification.verify({
        taskId: "test-1",
        taskName: "Test Task",
      });

      expect(result.passed).toBe(true);
    });
  });

  describe("重试机制", () => {
    it("应该追踪重试次数", async () => {
      const verification = new SelfVerification({
        config: {
          enabled: true,
          maxRetries: 3,
          testCommand: "false",
        },
      });

      const { shouldRetry, errorInjection } = await verification.verifyWithRetry({
        taskId: "test-1",
        taskName: "Test Task",
      });

      expect(shouldRetry).toBe(true);
      expect(errorInjection).toBeDefined();
      expect(errorInjection?.retryCount).toBe(1);
    });

    it("应该达到最大重试次数后停止", async () => {
      const verification = new SelfVerification({
        config: {
          enabled: true,
          maxRetries: 2,
          testCommand: "false",
        },
      });

      await verification.verifyWithRetry({
        taskId: "test-1",
        taskName: "Test Task",
      });

      const { shouldRetry, errorInjection } = await verification.verifyWithRetry({
        taskId: "test-1",
        taskName: "Test Task",
      });

      expect(shouldRetry).toBe(false);
      expect(errorInjection?.retryCount).toBe(2);
    });
  });
});

describe("ErrorInjector", () => {
  const injector = new ErrorInjector();

  it("应该生成错误注入", () => {
    const injection = injector.inject({
      taskId: "test-1",
      taskName: "Test Task",
      result: {
        passed: false,
        errors: ["SyntaxError: unexpected token"],
        output: "FAIL: SyntaxError",
        duration: 100,
      },
      retryCount: 1,
      maxRetries: 3,
    });

    expect(injection.originalError).toContain("Test Task");
    expect(injection.retryCount).toBe(1);
    expect(injection.maxRetries).toBe(3);
  });

  it("应该为缺少模块错误生成建议", () => {
    const injection = injector.inject({
      taskId: "test-1",
      taskName: "Test Task",
      result: {
        passed: false,
        errors: ["Cannot find module 'lodash'"],
        output: "FAIL: Cannot find module",
        duration: 100,
      },
      retryCount: 1,
      maxRetries: 3,
    });

    expect(injection.suggestion).toContain("dependency");
  });

  it("应该格式化上下文", () => {
    const injection = injector.inject({
      taskId: "test-1",
      taskName: "Test Task",
      result: {
        passed: false,
        errors: ["Test failed"],
        output: "FAIL: Test failed",
        duration: 100,
      },
      retryCount: 1,
      maxRetries: 3,
    });

    const context = injector.formatForContext(injection);
    expect(context).toContain("Verification Failed");
    expect(context).toContain("**Attempt:**");
    expect(context).toContain("1/3");
  });
});
