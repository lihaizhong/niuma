/**
 * 数据处理工具测试
 */

// ==================== 第三方库 ====================
import { describe, it, expect } from "vitest";

// ==================== 本地模块 ====================
import {
  jsonParseTool,
  jsonStringifyTool,
  yamlParseTool,
  yamlStringifyTool,
} from "../agent/tools/data";
import { ToolExecutionError } from "../types/error";

describe("JsonParseTool", () => {
  it("应该成功解析有效的 JSON", async () => {
    const result = await jsonParseTool.execute({
      data: '{"name": "test", "value": 123}',
    });

    expect(result).toContain('"name"');
    expect(result).toContain('"test"');
    expect(result).toContain('"value"');
    expect(result).toContain('123');
  });

  it("应该成功解析 JSON 数组", async () => {
    const result = await jsonParseTool.execute({
      data: '[1, 2, 3, "test"]',
    });

    expect(result).toContain('[\n  1,\n  2,\n  3,\n  "test"\n]');
  });

  it("应该成功解析 JSON5 格式", async () => {
    const result = await jsonParseTool.execute({
      data: '{\n  // comment\n  name: "test",\n  value: 123,\n}',
    });

    expect(result).toContain('"name"');
    expect(result).toContain('"test"');
  });

  it("应该失败当 JSON 无效", async () => {
    await expect(
      jsonParseTool.execute({
        data: "{ invalid json }",
      }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该处理嵌套对象", async () => {
    const result = await jsonParseTool.execute({
      data: '{"user": {"name": "John", "age": 30}, "active": true}',
    });

    expect(result).toContain('"user"');
    expect(result).toContain('"John"');
    expect(result).toContain('30');
    expect(result).toContain('true');
  });
});

describe("JsonStringifyTool", () => {
  it("应该成功序列化对象", async () => {
    const result = await jsonStringifyTool.execute({
      data: { name: "test", value: 123 },
      indent: 2,
    });

    expect(result).toContain('name:');
    expect(result).toContain('test');
    expect(result).toContain('value:');
    expect(result).toContain('123');
  });

  it("应该成功序列化数组", async () => {
    const result = await jsonStringifyTool.execute({
      data: [1, 2, 3, "test"],
      indent: 2,
    });

    expect(result).toContain('[\n  1,\n  2,\n  3,\n  \'test\',\n]');
  });

  it("应该支持不同的缩进", async () => {
    const result2 = await jsonStringifyTool.execute({
      data: { a: 1 },
      indent: 2,
    });

    const result4 = await jsonStringifyTool.execute({
      data: { a: 1 },
      indent: 4,
    });

    expect(result2).toContain('  ');
    expect(result4).toContain('    ');
  });

  it("应该失败当对象包含循环引用", async () => {
    const obj: unknown = { a: 1 };
    (obj as { a: number; self?: unknown }).self = obj;

    await expect(
      jsonStringifyTool.execute({
        data: obj as object,
      }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该处理 null 和 undefined", async () => {
    const resultNull = await jsonStringifyTool.execute({
      data: { a: null, b: undefined },
    });

    expect(resultNull).toContain('a:');
    expect(resultNull).toContain('null');
    // undefined 在 JSON5 中会被忽略
  });
});

describe("YamlParseTool", () => {
  it("应该成功解析有效的 YAML", async () => {
    const result = await yamlParseTool.execute({
      data: 'name: test\nvalue: 123\nactive: true',
    });

    expect(result).toContain('"name"');
    expect(result).toContain('"test"');
    expect(result).toContain('"value"');
    expect(result).toContain('123');
  });

  it("应该成功解析 YAML 数组", async () => {
    const result = await yamlParseTool.execute({
      data: '- item1\n- item2\n- item3',
    });

    expect(result).toContain('"item1"');
    expect(result).toContain('"item2"');
    expect(result).toContain('"item3"');
  });

  it("应该成功解析嵌套 YAML", async () => {
    const result = await yamlParseTool.execute({
      data: 'user:\n  name: John\n  age: 30\nactive: true',
    });

    expect(result).toContain('"user"');
    expect(result).toContain('"name"');
    expect(result).toContain('"John"');
    expect(result).toContain('"age"');
    expect(result).toContain('30');
  });

  it("应该失败当 YAML 无效", async () => {
    await expect(
      yamlParseTool.execute({
        data: "invalid: yaml: content:",
      }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该处理 YAML 注释", async () => {
    const result = await yamlParseTool.execute({
      data: '# comment\nname: test\nvalue: 123',
    });

    expect(result).toContain('"name"');
    expect(result).toContain('"test"');
  });
});

describe("YamlStringifyTool", () => {
  it("应该成功序列化对象为 YAML", async () => {
    const result = await yamlStringifyTool.execute({
      data: { name: "test", value: 123 },
      indent: 2,
    });

    expect(result).toContain('name: test');
    expect(result).toContain('value: 123');
  });

  it("应该成功序列化数组为 YAML", async () => {
    const result = await yamlStringifyTool.execute({
      data: [1, 2, 3],
      indent: 2,
    });

    expect(result).toContain('- 1');
    expect(result).toContain('- 2');
    expect(result).toContain('- 3');
  });

  it("应该支持不同的缩进", async () => {
    const result = await yamlStringifyTool.execute({
      data: { a: 1 },
      indent: 2,
    });

    expect(result).toContain('a: 1');
  });

  it("应该失败当对象包含循环引用", async () => {
    const obj: unknown = { a: 1 };
    (obj as { a: number; self?: unknown }).self = obj;

    await expect(
      yamlStringifyTool.execute({
        data: obj as object,
      }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该处理 null 和 undefined", async () => {
    const result = await yamlStringifyTool.execute({
      data: { a: null, b: undefined },
    });

    expect(result).toContain('a: null');
    // undefined 在 YAML 中会被忽略
  });

  it("应该处理布尔值", async () => {
    const result = await yamlStringifyTool.execute({
      data: { active: true, disabled: false },
    });

    expect(result).toContain('active: true');
    expect(result).toContain('disabled: false');
  });
});
