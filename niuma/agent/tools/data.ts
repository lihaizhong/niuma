/**
 * 数据处理工具
 * 提供 JSON 和 YAML 数据的解析与序列化功能
 */

// ==================== 第三方库 ====================
import JSON5 from "json5";
import yaml from "js-yaml";
import { z } from "zod";

// ==================== 本地模块 ====================
import { BaseTool } from "./base";
import { ToolExecutionError } from "../../types/error";

// ==================== 类型定义 ====================

/**
 * 可序列化的数据类型
 */
type Serializable = unknown;

// ==================== 类定义 ====================

/**
 * JsonParse 工具：解析 JSON 字符串
 */
export class JsonParseTool extends BaseTool {
  readonly name = "json_parse";
  readonly description =
    "解析 JSON 字符串。支持标准 JSON 和 JSON5 格式（支持注释和尾随逗号）。";
  readonly parameters = z.object({
    data: z.string().describe("JSON 或 JSON5 字符串"),
  });

  async execute(args: { data: string }): Promise<string> {
    const { data } = args;

    // 检查空字符串
    if (!data || data.trim().length === 0) {
      throw new ToolExecutionError(this.name, "输入不能为空");
    }

    try {
      const parsed = JSON5.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      throw new ToolExecutionError(
        this.name,
        `JSON 解析失败: ${(error as Error).message}`,
      );
    }
  }
}

/**
 * JsonStringify 工具：序列化为 JSON
 */
export class JsonStringifyTool extends BaseTool {
  readonly name = "json_stringify";
  readonly description =
    "将对象序列化为 JSON 字符串。支持 JSON5 格式（保留特殊字符）。";
  readonly parameters = z.object({
    data: z.custom<Serializable>((value) => {
      if (value === undefined) {
        return false;
      }
      return true;
    }).describe("要序列化的 JavaScript 对象"),
    indent: z
      .number()
      .int()
      .nonnegative()
      .default(2)
      .describe("缩进空格数，默认 2"),
  });

  async execute(args: { data: Serializable; indent?: number }): Promise<string> {
    const { data, indent = 2 } = args;

    try {
      // 检查循环引用
      const seen = new WeakSet<object>();
      const checkCircular = (obj: object): void => {
        if (seen.has(obj)) {
          throw new Error("对象包含循环引用");
        }
        seen.add(obj);
        
        // 检查所有属性
        if (Array.isArray(obj)) {
          obj.forEach((item) => {
            if (typeof item === "object" && item !== null) {
              checkCircular(item);
            }
          });
        } else {
          Object.values(obj).forEach((value) => {
            if (typeof value === "object" && value !== null) {
              checkCircular(value);
            }
          });
        }
      };

      if (typeof data === "object" && data !== null) {
        checkCircular(data);
      }

      // 使用 JSON5 序列化，支持特殊值
      const result = JSON5.stringify(data, null, indent);
      return result;
    } catch (error) {
      throw new ToolExecutionError(
        this.name,
        `JSON 序列化失败: ${(error as Error).message}`,
      );
    }
  }
}

/**
 * YamlParse 工具：解析 YAML 字符串
 */
export class YamlParseTool extends BaseTool {
  readonly name = "yaml_parse";
  readonly description = "解析 YAML 字符串。支持标准 YAML 格式。";
  readonly parameters = z.object({
    data: z.string().describe("YAML 字符串"),
  });

  async execute(args: { data: string }): Promise<string> {
    const { data } = args;

    // 检查空字符串
    if (!data || data.trim().length === 0) {
      throw new ToolExecutionError(this.name, "输入不能为空");
    }

    try {
      const parsed = yaml.load(data);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      throw new ToolExecutionError(
        this.name,
        `YAML 解析失败: ${(error as Error).message}`,
      );
    }
  }
}

/**
 * YamlStringify 工具：序列化为 YAML
 */
export class YamlStringifyTool extends BaseTool {
  readonly name = "yaml_stringify";
  readonly description = "将对象序列化为 YAML 字符串。支持特殊值处理。";
  readonly parameters = z.object({
    data: z.custom<Serializable>((value) => {
      if (value === undefined) {
        return false;
      }
      return true;
    }).describe("要序列化的 JavaScript 对象"),
    indent: z
      .number()
      .int()
      .positive()
      .default(2)
      .describe("缩进空格数，默认 2"),
  });

  async execute(args: { data: Serializable; indent?: number }): Promise<string> {
    const { data, indent = 2 } = args;

    try {
      // 检查循环引用
      const seen = new WeakSet<object>();
      const checkCircular = (obj: object): void => {
        if (seen.has(obj)) {
          throw new Error("对象包含循环引用");
        }
        seen.add(obj);
        
        // 检查所有属性
        if (Array.isArray(obj)) {
          obj.forEach((item) => {
            if (typeof item === "object" && item !== null) {
              checkCircular(item);
            }
          });
        } else {
          Object.values(obj).forEach((value) => {
            if (typeof value === "object" && value !== null) {
              checkCircular(value);
            }
          });
        }
      };

      if (typeof data === "object" && data !== null) {
        checkCircular(data);
      }

      // 使用 js-yaml 序列化
      const result = yaml.dump(data, {
        indent,
        lineWidth: -1, // 不限制行宽
        noRefs: true, // 避免引用标记
        sortKeys: false, // 保持键的顺序
      });
      return result;
    } catch (error) {
      throw new ToolExecutionError(
        this.name,
        `YAML 序列化失败: ${(error as Error).message}`,
      );
    }
  }
}

// ==================== 导出工具实例 ====================
export const jsonParseTool = new JsonParseTool();
export const jsonStringifyTool = new JsonStringifyTool();
export const yamlParseTool = new YamlParseTool();
export const yamlStringifyTool = new YamlStringifyTool();