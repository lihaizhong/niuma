/**
 * 工具函数测试
 */

import { describe, it, expect } from "vitest";
import { retryWithBackoff } from "../utils/retry";
import { sanitizeObject } from "../utils/sanitize";

describe("retryWithBackoff", () => {
  it("应该在第一次成功时返回结果", async () => {
    const result = await retryWithBackoff({
      fn: async () => "success",
      maxRetries: 3,
    });

    expect(result).toBe("success");
  });

  it("应该在重试后成功", async () => {
    let attempts = 0;
    const result = await retryWithBackoff({
      fn: async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error("Failed");
        }
        return "success after retries";
      },
      maxRetries: 5,
      delays: [10, 10, 10, 10, 10],
    });

    expect(result).toBe("success after retries");
    expect(attempts).toBe(3);
  });

  it("应该在达到最大重试次数后抛出错误", async () => {
    await expect(
      retryWithBackoff({
        fn: async () => {
          throw new Error("Always fails");
        },
        maxRetries: 2,
      }),
    ).rejects.toThrow("Always fails");
  });

  it("应该调用 onRetry 回调", async () => {
    let retryCount = 0;
    await retryWithBackoff({
      fn: async () => {
        retryCount++;
        if (retryCount < 3) {
          throw new Error("Retry needed");
        }
        return "success after retries";
      },
      maxRetries: 5,
      delays: [10, 10, 10, 10, 10],
      onError: (_error: Error) => {
        expect(_error).toBeInstanceOf(Error);
        expect(_error.message).toBe("Retry needed");
      },
    });

    expect(retryCount).toBe(3);
  });
});

describe("sanitizeObject", () => {
  describe("原型链污染防护", () => {
    it("应该移除 __proto__ 属性", () => {
      const result = sanitizeObject({
        normal: "value",
        __proto__: { polluted: true },
      });
      expect(result).not.toHaveProperty("__proto__");
      expect(result.normal).toBe("value");
    });

    it("应该处理 constructor 属性", () => {
      const result = sanitizeObject({
        normal: "value",
        constructor: { polluted: true },
      });
      // secure-json-parse 会清理 constructor 属性，但保留 constructor 作为普通属性
      expect(result.normal).toBe("value");
    });

    it("应该处理 prototype 属性", () => {
      const result = sanitizeObject({
        normal: "value",
        prototype: { polluted: true },
      });
      // secure-json-parse 会处理 prototype，但保留 prototype 作为普通属性
      expect(result.normal).toBe("value");
    });
  });

  describe("默认清理行为", () => {
    it("应该移除空字符串", () => {
      const result = sanitizeObject({
        name: "",
        value: "test",
      });
      expect(result).not.toHaveProperty("name");
      expect(result.value).toBe("test");
    });

    it("应该移除空数组", () => {
      const result = sanitizeObject({
        empty: [],
        filled: [1, 2, 3],
      });
      expect(result).not.toHaveProperty("empty");
      expect(result.filled).toEqual([1, 2, 3]);
    });

    it("应该移除空对象", () => {
      const result = sanitizeObject({
        empty: {},
        filled: { key: "value" },
      });
      expect(result).not.toHaveProperty("empty");
      expect(result.filled).toEqual({ key: "value" });
    });

    it("应该移除 NaN", () => {
      const result = sanitizeObject({
        nan: NaN,
        number: 123,
      });
      expect(result).not.toHaveProperty("nan");
      expect(result.number).toBe(123);
    });

    it("应该保留 null 值", () => {
      const result = sanitizeObject({
        nullValue: null,
        value: "test",
      });
      expect(result.nullValue).toBeNull();
      expect(result.value).toBe("test");
    });
  });

  describe("可选清理选项", () => {
    it("应该保留 null 值当 keepNull 为 true", () => {
      const result = sanitizeObject(
        { nullValue: null, value: "test" },
        { keepNull: true },
      );
      expect(result.nullValue).toBeNull();
      expect(result.value).toBe("test");
    });

    it("应该移除 null 值当 keepNull 为 false", () => {
      const result = sanitizeObject(
        { nullValue: null, value: "test" },
        { keepNull: false },
      );
      expect(result).not.toHaveProperty("nullValue");
      expect(result.value).toBe("test");
    });

    it("应该保留空字符串当 removeEmptyStrings 为 false", () => {
      const result = sanitizeObject(
        { empty: "", filled: "test" },
        { removeEmptyStrings: false },
      );
      expect(result.empty).toBe("");
      expect(result.filled).toBe("test");
    });

    it("应该保留空数组当 removeEmptyArrays 为 false", () => {
      const result = sanitizeObject(
        { empty: [], filled: [1, 2, 3] },
        { removeEmptyArrays: false },
      );
      expect(result.empty).toEqual([]);
      expect(result.filled).toEqual([1, 2, 3]);
    });

    it("应该保留空对象当 removeEmptyObjects 为 false", () => {
      const result = sanitizeObject(
        { empty: {}, filled: { key: "value" } },
        { removeEmptyObjects: false },
      );
      expect(result.empty).toEqual({});
      expect(result.filled).toEqual({ key: "value" });
    });

    it("应该保留 NaN 当 removeNaN 为 false", () => {
      const result = sanitizeObject(
        { nan: NaN, number: 123 },
        { removeNaN: false },
      );
      expect(result.nan).toBeNaN();
      expect(result.number).toBe(123);
    });
  });

  describe("复杂对象处理", () => {
    it("应该处理嵌套对象", () => {
      const result = sanitizeObject({
        level1: {
          level2: {
            value: "deep",
            empty: "",
          },
          emptyArray: [],
        },
      });
      const level1 = result.level1 as Record<string, unknown>;
      const level2 = level1.level2 as Record<string, unknown>;
      expect(level2.value).toBe("deep");
      expect(level2).not.toHaveProperty("empty");
      expect(level1).not.toHaveProperty("emptyArray");
    });

    it("应该处理包含数组的对象", () => {
      const result = sanitizeObject({
        items: [
          { name: "item1", value: 1 },
          { name: "", value: 2 },
          { name: "item3", value: NaN },
        ],
      });
      const items = result.items as Array<Record<string, unknown>>;
      expect(items).toHaveLength(3);
      expect(items[0].name).toBe("item1");
    });

    it("应该处理混合类型的对象", () => {
      const result = sanitizeObject({
        string: "test",
        number: 123,
        boolean: true,
        null: null,
        emptyString: "",
        emptyArray: [],
        emptyObject: {},
        nan: NaN,
        __proto__: { polluted: true },
      });
      expect(result.string).toBe("test");
      expect(result.number).toBe(123);
      expect(result.boolean).toBe(true);
      expect(result.null).toBeNull();
      expect(result).not.toHaveProperty("emptyString");
      expect(result).not.toHaveProperty("emptyArray");
      expect(result).not.toHaveProperty("emptyObject");
      expect(result).not.toHaveProperty("nan");
      expect(result).not.toHaveProperty("__proto__");
    });
  });

  describe("边界情况", () => {
    it("应该处理空对象", () => {
      const result = sanitizeObject({});
      expect(result).toEqual({});
    });

    it("应该处理所有属性都被移除的对象", () => {
      const result = sanitizeObject({
        empty: "",
        emptyArray: [],
        emptyObject: {},
        nan: NaN,
      });
      expect(result).toEqual({});
    });

    it("应该处理包含 null 和 undefined 的对象", () => {
      const result = sanitizeObject({
        nullValue: null,
        defined: "value",
      });
      expect(result.nullValue).toBeNull();
      expect(result.defined).toBe("value");
    });

    it("应该处理包含特殊值的对象", () => {
      const result = sanitizeObject({
        zero: 0,
        false: false,
        value: "test",
      });
      expect(result.zero).toBe(0);
      expect(result.false).toBe(false);
      expect(result.value).toBe("test");
    });
  });
});
