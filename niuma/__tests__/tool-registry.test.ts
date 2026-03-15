/**
 * 工具注册表测试
 */

// ==================== 第三方库 ====================
import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";

// ==================== 本地模块 ====================
import { ToolRegistry, registerBuiltinTools } from "../agent/tools/registry";
import { BaseTool } from "../agent/tools/base";

// ==================== 测试工具 ====================
class TestTool extends BaseTool {
  readonly name = "test_tool";
  readonly description = "测试工具";
  readonly parameters = z.object({
    input: z.string(),
  });

  async execute(args: { input: string }): Promise<string> {
    return `processed: ${args.input}`;
  }
}

class ErrorTool extends BaseTool {
  readonly name = "error_tool";
  readonly description = "错误工具";
  readonly parameters = z.object({});

  async execute(): Promise<string> {
    throw new Error("工具执行失败");
  }
}

describe("ToolRegistry", () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  describe("基础功能", () => {
    it("应该成功注册工具", () => {
      const tool = new TestTool();
      registry.register(tool);

      expect(registry.has("test_tool")).toBe(true);
      expect(registry.get("test_tool")).toBe(tool);
    });

    it("应该支持链式注册", () => {
      const tool1 = new TestTool();
      const tool2 = new ErrorTool();

      const result = registry.register(tool1).register(tool2);

      expect(result).toBe(registry);
      expect(registry.has("test_tool")).toBe(true);
      expect(registry.has("error_tool")).toBe(true);
    });

    it("应该注销工具", () => {
      const tool = new TestTool();
      registry.register(tool);
      registry.unregister("test_tool");

      expect(registry.has("test_tool")).toBe(false);
      expect(registry.get("test_tool")).toBeUndefined();
    });

    it("应该获取所有工具名称", () => {
      const tool1 = new TestTool();
      const tool2 = new ErrorTool();
      registry.register(tool1).register(tool2);

      const names = registry.toolNames;
      expect(names).toHaveLength(2);
      expect(names).toContain("test_tool");
      expect(names).toContain("error_tool");
    });

    it("应该获取所有工具定义", () => {
      const tool = new TestTool();
      registry.register(tool);

      const definitions = registry.getDefinitions();
      expect(definitions).toHaveLength(1);
      expect(definitions[0].name).toBe("test_tool");
      expect(definitions[0].description).toBe("测试工具");
    });

    it("应该返回注册工具数量", () => {
      const tool1 = new TestTool();
      const tool2 = new ErrorTool();
      registry.register(tool1).register(tool2);

      expect(registry.size).toBe(2);
    });
  });

  describe("工具执行", () => {
    it("应该成功执行工具", async () => {
      const tool = new TestTool();
      registry.register(tool);

      const result = await registry.execute("test_tool", {
        input: "test",
      });

      expect(result).toBe("processed: test");
    });

    it("应该处理不存在的工具", async () => {
      const result = await registry.execute("nonexistent", {});

      expect(result).toContain("错误: 工具 \"nonexistent\" 未找到");
      expect(result).toContain("可用工具:");
    });

    it("应该处理工具执行错误", async () => {
      const tool = new ErrorTool();
      registry.register(tool);

      const result = await registry.execute("error_tool", {});

      expect(result).toContain("执行 error_tool 时出错");
      expect(result).toContain("工具执行失败");
    });

    it("应该处理参数验证错误", async () => {
      const tool = new TestTool();
      registry.register(tool);

      const result = await registry.execute("test_tool", {
        invalid: "param",
      });

      expect(result).toContain("执行 test_tool 时出错");
      expect(result).toContain("参数无效");
    });

    it("应该为错误消息添加提示", async () => {
      const tool = new ErrorTool();
      registry.register(tool);

      const result = await registry.execute("error_tool", {});

      expect(result).toContain("[分析上述错误并尝试其他方式。]");
    });
  });

  describe("registerBuiltinTools", () => {
    it("应该注册所有内置工具", () => {
      const newRegistry = new ToolRegistry();
      registerBuiltinTools(newRegistry);

      expect(newRegistry.size).toBeGreaterThan(0);

      // 检查一些已知工具
      expect(newRegistry.has("read_file")).toBe(true);
      expect(newRegistry.has("write_file")).toBe(true);
      expect(newRegistry.has("exec")).toBe(true);
      expect(newRegistry.has("web_search")).toBe(true);
      expect(newRegistry.has("web_fetch")).toBe(true);
      expect(newRegistry.has("message")).toBe(true);
      expect(newRegistry.has("spawn")).toBe(true);
      expect(newRegistry.has("cron")).toBe(true);
    });

    it("应该能执行内置工具", async () => {
      const newRegistry = new ToolRegistry();
      registerBuiltinTools(newRegistry);

      // 测试 message 工具
      const result = await newRegistry.execute("message", {
        content: "test",
        immediate: true,
      });

      expect(result).toContain("消息已发送");
    });
  });

  describe("工具定义格式", () => {
    it("应该生成正确的 OpenAI 格式 Schema", () => {
      const tool = new TestTool();
      const schema = tool.toSchema();

      expect(schema.type).toBe("function");
      expect(schema.function).toBeDefined();
      expect(schema.function.name).toBe("test_tool");
      expect(schema.function.description).toBe("测试工具");
      expect(schema.function.parameters).toBeDefined();
      expect(schema.function.parameters.type).toBe("object");
    });

    it("应该生成正确的工具定义", () => {
      const tool = new TestTool();
      const definition = tool.getDefinition();

      expect(definition.name).toBe("test_tool");
      expect(definition.description).toBe("测试工具");
      expect(definition.parameters).toBeDefined();
    });
  });
});
