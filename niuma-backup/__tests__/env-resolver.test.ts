/**
 * 环境变量解析器单元测试
 */

// ==================== 第三方库 ====================
import { describe, it, expect, beforeEach, afterEach } from "vitest";

// ==================== 本地模块 ====================
import { resolveEnvVars } from "../config/env-resolver";

describe("环境变量解析器", () => {
  beforeEach(() => {
    process.env.TEST_VAR = "test-value";
  });

  afterEach(() => {
    delete process.env.TEST_VAR;
  });

  describe("resolveEnvVars()", () => {
    it("应该替换环境变量引用 ${VAR}", () => {
      const config = {
        apiKey: "${TEST_VAR}",
        url: "https://api.example.com",
      };
      const result = resolveEnvVars(config, { strict: false, env: {} });
      expect(result.apiKey).toBe("test-value");
      expect(result.url).toBe("https://api.example.com");
    });

    it("应该替换环境变量引用 ${VAR:default}", () => {
      const config = {
        apiKey: "${NONEXISTENT_VAR:default-value}",
        url: "https://api.example.com",
      };
      const result = resolveEnvVars(config, { strict: false, env: {} });
      expect(result.apiKey).toBe("default-value");
      expect(result.url).toBe("https://api.example.com");
    });

    it("应该使用自定义环境变量优先于系统环境变量", () => {
      const config = {
        apiKey: "${TEST_VAR}",
      };
      const result = resolveEnvVars(config, {
        strict: false,
        env: { TEST_VAR: "custom-value" },
      });
      expect(result.apiKey).toBe("custom-value");
    });

    it("应该递归处理嵌套对象", () => {
      const config = {
        providers: {
          openai: {
            apiKey: "${TEST_VAR}",
            apiBase: "https://api.openai.com/v1",
          },
        },
      };
      const result = resolveEnvVars(config, { strict: false, env: {} });
      expect(result.providers.openai.apiKey).toBe("test-value");
      expect(result.providers.openai.apiBase).toBe("https://api.openai.com/v1");
    });

    it("应该递归处理数组", () => {
      const config = {
        list: [
          "${TEST_VAR}",
          "static-value",
          {
            nested: "${TEST_VAR}",
          } as { nested: string },
        ],
      };
      const result = resolveEnvVars(config, { strict: false, env: {} });
      expect(result.list[0]).toBe("test-value");
      expect(result.list[1]).toBe("static-value");
      expect((result.list[2] as { nested: string }).nested).toBe("test-value");
    });

    it("应该在严格模式下抛出错误当环境变量不存在", () => {
      const config = {
        apiKey: "${NONEXISTENT_VAR}",
      };
      expect(() => resolveEnvVars(config, { strict: true, env: {} })).toThrow(
        "环境变量 NONEXISTENT_VAR 未定义",
      );
    });

    it("应该在非严格模式下保持原样当环境变量不存在", () => {
      const config = {
        apiKey: "${NONEXISTENT_VAR}",
      };
      const result = resolveEnvVars(config, { strict: false, env: {} });
      expect(result.apiKey).toBe("${NONEXISTENT_VAR}");
    });

    it("应该处理多个环境变量引用", () => {
      const config = {
        url: "https://${TEST_VAR}.example.com/${TEST_VAR}/api",
      };
      const result = resolveEnvVars(config, { strict: false, env: {} });
      expect(result.url).toBe("https://test-value.example.com/test-value/api");
    });
  });
});
