/**
 * JSON5 配置加载器单元测试
 */

// ==================== 内置库 ====================
import { join } from "path";
import { tmpdir } from "os";

// ==================== 第三方库 ====================
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";

// ==================== 本地模块 ====================
import { JSON5ConfigLoaderImpl } from "../config/json5-loader";

describe("JSON5ConfigLoader", () => {
  let loader: JSON5ConfigLoaderImpl;
  let testDir: string;
  let configPath: string;

  beforeEach(() => {
    loader = new JSON5ConfigLoaderImpl();
    testDir = join(tmpdir(), "niuma-test-" + Date.now());
    fs.mkdirSync(testDir, { recursive: true });
    configPath = join(testDir, "config.json5");
  });

  afterEach(() => {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("exists()", () => {
    it("应该返回 true 当文件存在时", () => {
      fs.writeFileSync(configPath, "{}", "utf-8");
      expect(loader.exists(configPath)).toBe(true);
    });

    it("应该返回 false 当文件不存在时", () => {
      expect(loader.exists(configPath)).toBe(false);
    });
  });

  describe("load()", () => {
    it("应该成功加载有效的 JSON5 配置文件", () => {
      const content = `
{
  // 单行注释
  "name": "niuma",
  "version": "1.0.0", // 尾随注释
}
`;
      fs.writeFileSync(configPath, content, "utf-8");
      const result = loader.load(configPath);
      expect(result).toEqual({ name: "niuma", version: "1.0.0" });
    });

    it("应该成功加载包含多行注释的 JSON5 配置文件", () => {
      const content = `
{
  /*
   * 多行注释
   * 这里是第二行
   */
  "name": "niuma",
  "version": "1.0.0"
}
`;
      fs.writeFileSync(configPath, content, "utf-8");
      const result = loader.load(configPath);
      expect(result).toEqual({ name: "niuma", version: "1.0.0" });
    });

    it("应该成功加载包含尾随逗号的 JSON5 配置文件", () => {
      const content = `
{
  "name": "niuma",
  "version": "1.0.0",
  "features": [
    "feature1",
    "feature2",
  ],
}
`;
      fs.writeFileSync(configPath, content, "utf-8");
      const result = loader.load(configPath);
      expect(result).toEqual({
        name: "niuma",
        version: "1.0.0",
        features: ["feature1", "feature2"],
      });
    });

    it("应该成功加载标准的 JSON 配置文件", () => {
      const content = JSON.stringify({ name: "niuma", version: "1.0.0" });
      fs.writeFileSync(configPath, content, "utf-8");
      const result = loader.load(configPath);
      expect(result).toEqual({ name: "niuma", version: "1.0.0" });
    });

    it("应该返回空对象当配置文件不存在时", () => {
      const result = loader.load(configPath);
      expect(result).toEqual({});
    });

    it("应该抛出错误当 JSON5 配置文件包含语法错误", () => {
      const content = `
{
  "name": "niuma",
  "version": 1.0.0  // 缺少引号
}
`;
      fs.writeFileSync(configPath, content, "utf-8");
      expect(() => loader.load(configPath)).toThrow("配置文件解析失败");
    });

    it("应该处理嵌套对象", () => {
      const content = `
{
  "agent": {
    "progressMode": "verbose",
    "showReasoning": true,
  },
  "providers": {
    "openai": {
      "apiKey": "\${OPENAI_API_KEY}",
    },
  },
}
`;
      fs.writeFileSync(configPath, content, "utf-8");
      const result = loader.load(configPath);
      expect(result).toEqual({
        agent: {
          progressMode: "verbose",
          showReasoning: true,
        },
        providers: {
          openai: {
            apiKey: "${OPENAI_API_KEY}",
          },
        },
      });
    });
  });

  describe("getDefaultConfigPath()", () => {
    it("应该返回默认配置文件路径", () => {
      const defaultPath = loader.getDefaultConfigPath();
      expect(defaultPath).toContain(".niuma");
      expect(defaultPath).toContain("niuma.config.json");
    });
  });
});
