/**
 * 加密与解密工具测试
 */

// ==================== 第三方库 ====================
import { describe, it, expect } from "vitest";

// ==================== 本地模块 ====================
import { ValidationError, ToolExecutionError } from "../types/error";
import {
  encryptTool,
  decryptTool,
  hashTool,
} from "../agent/tools/crypto";

describe("EncryptTool", () => {
  // 生成 32 字节的随机密钥
  const key = Buffer.alloc(32, "test-key-1234567890123456").toString("base64");

  it("应该成功加密数据", async () => {
    const result = await encryptTool.execute({
      data: "Hello, World!",
      key,
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty("encrypted");
    expect(parsed).toHaveProperty("iv");
    expect(parsed).toHaveProperty("tag");
    expect(typeof parsed.encrypted).toBe("string");
    expect(typeof parsed.iv).toBe("string");
    expect(typeof parsed.tag).toBe("string");
  });

  it("应该自动生成随机 IV", async () => {
    const result1 = await encryptTool.execute({
      data: "test data",
      key,
    });
    const result2 = await encryptTool.execute({
      data: "test data",
      key,
    });

    const parsed1 = JSON.parse(result1);
    const parsed2 = JSON.parse(result2);

    // IV 应该不同
    expect(parsed1.iv).not.toBe(parsed2.iv);
    // 加密结果应该不同（因为 IV 不同）
    expect(parsed1.encrypted).not.toBe(parsed2.encrypted);
  });

  it("应该支持自定义 IV", async () => {
    const iv = Buffer.alloc(16, "test-iv-12345678").toString("base64");

    const result = await encryptTool.execute({
      data: "Hello, World!",
      key,
      iv,
    });

    const parsed = JSON.parse(result);
    expect(parsed.iv).toBe(iv);
  });

  it("应该拒绝错误长度的密钥", async () => {
    const shortKey = Buffer.alloc(16, "short-key").toString("base64");

    await expect(
      encryptTool.execute({
        data: "test",
        key: shortKey,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("应该拒绝错误长度的 IV", async () => {
    const wrongIv = Buffer.alloc(8, "wrong-iv").toString("base64");

    await expect(
      encryptTool.execute({
        data: "test",
        key,
        iv: wrongIv,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("应该拒绝无效的 Base64 密钥", async () => {
    await expect(
      encryptTool.execute({
        data: "test",
        key: "invalid-base64!!!",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("应该加密空字符串", async () => {
    const result = await encryptTool.execute({
      data: "",
      key,
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty("encrypted");
  });

  it("应该加密大文件内容", async () => {
    const largeData = "x".repeat(10_000_000); // 10MB

    const result = await encryptTool.execute({
      data: largeData,
      key,
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty("encrypted");
  });
});

describe("DecryptTool", () => {
  const key = Buffer.alloc(32, "test-key-1234567890123456").toString("base64");

  it("应该成功解密数据", async () => {
    // 先加密
    const encryptResult = await encryptTool.execute({
      data: "Hello, World!",
      key,
    });
    const { encrypted, iv, tag } = JSON.parse(encryptResult);

    // 再解密
    const result = await decryptTool.execute({
      encrypted,
      key,
      iv,
      tag,
    });

    expect(result).toBe("Hello, World!");
  });

  it("应该拒绝错误的密钥", async () => {
    const encryptResult = await encryptTool.execute({
      data: "Hello, World!",
      key,
    });
    const { encrypted, iv, tag } = JSON.parse(encryptResult);

    const wrongKey = Buffer.alloc(32, "wrong-key-1234567890123456").toString("base64");

    await expect(
      decryptTool.execute({
        encrypted,
        key: wrongKey,
        iv,
        tag,
      }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该拒绝被篡改的数据", async () => {
    const encryptResult = await encryptTool.execute({
      data: "Hello, World!",
      key,
    });
    const { encrypted, iv, tag } = JSON.parse(encryptResult);

    // 篡改加密数据
    const tamperedEncrypted = Buffer.from(encrypted, "base64");
    tamperedEncrypted[0] ^= 0xff; // 修改第一个字节
    const tampered = tamperedEncrypted.toString("base64");

    await expect(
      decryptTool.execute({
        encrypted: tampered,
        key,
        iv,
        tag,
      }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该拒绝错误长度的 IV", async () => {
    const encryptResult = await encryptTool.execute({
      data: "Hello, World!",
      key,
    });
    const { encrypted, tag } = JSON.parse(encryptResult);

    const wrongIv = Buffer.alloc(8, "wrong-iv").toString("base64");

    await expect(
      decryptTool.execute({
        encrypted,
        key,
        iv: wrongIv,
        tag,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("应该拒绝错误长度的 tag", async () => {
    const encryptResult = await encryptTool.execute({
      data: "Hello, World!",
      key,
    });
    const { encrypted, iv } = JSON.parse(encryptResult);

    const wrongTag = Buffer.alloc(8, "wrong-tag").toString("base64");

    await expect(
      decryptTool.execute({
        encrypted,
        key,
        iv,
        tag: wrongTag,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("应该拒绝无效的 Base64", async () => {
    await expect(
      decryptTool.execute({
        encrypted: "invalid-base64!!!",
        key,
        iv: "invalid-base64!!!",
        tag: "invalid-base64!!!",
      }),
    ).rejects.toThrow(ValidationError);
  });
});

describe("HashTool", () => {
  it("应该成功计算 SHA-256 哈希", async () => {
    const result = await hashTool.execute({
      data: "Hello, World!",
      algorithm: "sha256",
    });

    expect(result).toBe("dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f");
    expect(result.length).toBe(64); // SHA-256 产生 64 位十六进制字符串
  });

  it("应该成功计算 SHA-512 哈希", async () => {
    const result = await hashTool.execute({
      data: "Hello, World!",
      algorithm: "sha512",
    });

    expect(result.length).toBe(128); // SHA-512 产生 128 位十六进制字符串
  });

  it("应该成功计算 MD5 哈希", async () => {
    const result = await hashTool.execute({
      data: "Hello, World!",
      algorithm: "md5",
    });

    expect(result).toBe("65a8e27d8879283831b664bd8b7f0ad4");
    expect(result.length).toBe(32); // MD5 产生 32 位十六进制字符串
  });

  it("应该拒绝不支持的算法", () => {
    const result = hashTool.parameters.safeParse({
      data: "test",
      algorithm: "sha1",
    });

    expect(result.success).toBe(false);
  });

  it("应该计算空字符串的哈希", async () => {
    const result = await hashTool.execute({
      data: "",
      algorithm: "sha256",
    });

    expect(result).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("应该计算大文件内容的哈希", async () => {
    const largeData = "x".repeat(10_000_000); // 10MB

    const result = await hashTool.execute({
      data: largeData,
      algorithm: "sha256",
    });

    expect(result.length).toBe(64);
  });

  it("相同数据应该产生相同哈希", async () => {
    const result1 = await hashTool.execute({
      data: "test data",
      algorithm: "sha256",
    });
    const result2 = await hashTool.execute({
      data: "test data",
      algorithm: "sha256",
    });

    expect(result1).toBe(result2);
  });

  it("不同数据应该产生不同哈希", async () => {
    const result1 = await hashTool.execute({
      data: "test data 1",
      algorithm: "sha256",
    });
    const result2 = await hashTool.execute({
      data: "test data 2",
      algorithm: "sha256",
    });

    expect(result1).not.toBe(result2);
  });
});

describe("加密解密往返测试", () => {
  const key = Buffer.alloc(32, "test-key-1234567890123456").toString("base64");

  it("应该能够加密然后解密", async () => {
    const originalData = "这是一段测试数据，包含中文和特殊字符！@#$%^&*()";

    // 加密
    const encryptResult = await encryptTool.execute({
      data: originalData,
      key,
    });
    const { encrypted, iv, tag } = JSON.parse(encryptResult);

    // 解密
    const decryptResult = await decryptTool.execute({
      encrypted,
      key,
      iv,
      tag,
    });

    expect(decryptResult).toBe(originalData);
  });

  it("应该能够处理多行文本", async () => {
    const originalData = "第一行\n第二行\n第三行";

    const encryptResult = await encryptTool.execute({
      data: originalData,
      key,
    });
    const { encrypted, iv, tag } = JSON.parse(encryptResult);

    const decryptResult = await decryptTool.execute({
      encrypted,
      key,
      iv,
      tag,
    });

    expect(decryptResult).toBe(originalData);
  });

  it("应该能够处理 JSON 数据", async () => {
    const originalData = JSON.stringify({
      name: "test",
      value: 123,
      nested: { key: "value" },
    });

    const encryptResult = await encryptTool.execute({
      data: originalData,
      key,
    });
    const { encrypted, iv, tag } = JSON.parse(encryptResult);

    const decryptResult = await decryptTool.execute({
      encrypted,
      key,
      iv,
      tag,
    });

    expect(decryptResult).toBe(originalData);
    const parsed = JSON.parse(decryptResult);
    expect(parsed).toEqual({
      name: "test",
      value: 123,
      nested: { key: "value" },
    });
  });
});