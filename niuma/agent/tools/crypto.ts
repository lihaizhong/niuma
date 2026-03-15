/**
 * 加密与解密工具
 * 提供数据加密、解密和哈希计算功能
 */

// ==================== Node.js 内置模块 ====================
import crypto from "node:crypto";

// ==================== 第三方库 ====================
import { z } from "zod";

// ==================== 本地模块 ====================
import { BaseTool } from "./base";
import { ToolExecutionError, ValidationError } from "../../types/error";

// ==================== 常量定义 ====================

const KEY_LENGTH = 32; // AES-256 需要 32 字节密钥
const IV_LENGTH = 16; // AES-GCM 需要 16 字节 IV
const TAG_LENGTH = 16; // AES-GCM 认证标签长度

// ==================== 类型定义 ====================

/**
 * 支持的哈希算法
 */
type HashAlgorithm = "sha256" | "sha512" | "md5";

// ==================== 工具类定义 ====================

/**
 * Encrypt 工具：使用 AES-256-GCM 加密数据
 */
export class EncryptTool extends BaseTool {
  readonly name = "encrypt";
  readonly description =
    "使用 AES-256-GCM 算法加密数据。密钥必须是 32 字节的 Base64 编码字符串。";
  readonly parameters = z.object({
    data: z.string().describe("要加密的明文数据"),
    key: z
      .string()
      .describe("密钥（Base64 编码，解码后必须为 32 字节）"),
    iv: z
      .string()
      .optional()
      .describe("初始化向量 IV（Base64 编码，16 字节，如未提供则自动生成）"),
  });

  async execute(args: {
    data: string;
    key: string;
    iv?: string;
  }): Promise<string> {
    const { data, key, iv } = args;

    // 验证密钥
    const keyBuffer = this.decodeBase64(key, "密钥");
    if (keyBuffer.length !== KEY_LENGTH) {
      throw new ValidationError(
        this.name,
        `密钥长度错误：期望 ${KEY_LENGTH} 字节，实际 ${keyBuffer.length} 字节`,
      );
    }

    // 验证或生成 IV
    let ivBuffer: Buffer;
    if (iv) {
      ivBuffer = this.decodeBase64(iv, "IV");
      if (ivBuffer.length !== IV_LENGTH) {
        throw new ValidationError(
          this.name,
          `IV 长度错误：期望 ${IV_LENGTH} 字节，实际 ${ivBuffer.length} 字节`,
        );
      }
    } else {
      ivBuffer = crypto.randomBytes(IV_LENGTH);
    }

    try {
      // 创建加密器
      const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, ivBuffer);

      // 加密数据
      const encrypted = Buffer.concat([
        cipher.update(data, "utf8"),
        cipher.final(),
      ]);

      // 获取认证标签
      const tag = cipher.getAuthTag();

      // 返回结果（Base64 编码）
      return JSON.stringify({
        encrypted: encrypted.toString("base64"),
        iv: ivBuffer.toString("base64"),
        tag: tag.toString("base64"),
      });
    } catch (error) {
      throw new ToolExecutionError(
        this.name,
        `加密失败: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 解码 Base64 字符串
   */
  private decodeBase64(data: string, fieldName: string): Buffer {
    try {
      return Buffer.from(data, "base64");
    } catch (error) {
      throw new ValidationError(
        this.name,
        `${fieldName} 格式错误：无效的 Base64 编码`,
      );
    }
  }
}

/**
 * Decrypt 工具：使用 AES-256-GCM 解密数据
 */
export class DecryptTool extends BaseTool {
  readonly name = "decrypt";
  readonly description =
    "使用 AES-256-GCM 算法解密数据。需要密钥、IV 和认证标签。";
  readonly parameters = z.object({
    encrypted: z.string().describe("加密后的数据（Base64 编码）"),
    key: z
      .string()
      .describe("密钥（Base64 编码，解码后必须为 32 字节）"),
    iv: z
      .string()
      .describe("初始化向量 IV（Base64 编码，16 字节）"),
    tag: z
      .string()
      .describe("认证标签（Base64 编码，16 字节）"),
  });

  async execute(args: {
    encrypted: string;
    key: string;
    iv: string;
    tag: string;
  }): Promise<string> {
    const { encrypted, key, iv, tag } = args;

    // 验证密钥
    const keyBuffer = this.decodeBase64(key, "密钥");
    if (keyBuffer.length !== KEY_LENGTH) {
      throw new ValidationError(
        this.name,
        `密钥长度错误：期望 ${KEY_LENGTH} 字节，实际 ${keyBuffer.length} 字节`,
      );
    }

    // 验证 IV
    const ivBuffer = this.decodeBase64(iv, "IV");
    if (ivBuffer.length !== IV_LENGTH) {
      throw new ValidationError(
        this.name,
        `IV 长度错误：期望 ${IV_LENGTH} 字节，实际 ${ivBuffer.length} 字节`,
      );
    }

    // 验证 tag
    const tagBuffer = this.decodeBase64(tag, "认证标签");
    if (tagBuffer.length !== TAG_LENGTH) {
      throw new ValidationError(
        this.name,
        `认证标签长度错误：期望 ${TAG_LENGTH} 字节，实际 ${tagBuffer.length} 字节`,
      );
    }

    // 解密数据
    const encryptedBuffer = this.decodeBase64(encrypted, "加密数据");

    try {
      // 创建解密器
      const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, ivBuffer);
      decipher.setAuthTag(tagBuffer);

      // 解密数据
      const decrypted = Buffer.concat([
        decipher.update(encryptedBuffer),
        decipher.final(),
      ]);

      return decrypted.toString("utf8");
    } catch (error) {
      throw new ToolExecutionError(
        this.name,
        `解密失败：认证失败或数据损坏 (${(error as Error).message})`,
      );
    }
  }

  /**
   * 解码 Base64 字符串
   */
  private decodeBase64(data: string, fieldName: string): Buffer {
    try {
      return Buffer.from(data, "base64");
    } catch (error) {
      throw new ValidationError(
        this.name,
        `${fieldName} 格式错误：无效的 Base64 编码`,
      );
    }
  }
}

/**
 * Hash 工具：计算数据的哈希值
 */
export class HashTool extends BaseTool {
  readonly name = "hash";
  readonly description =
    "计算数据的哈希值。支持 SHA-256、SHA-512 和 MD5 算法。";
  readonly parameters = z.object({
    data: z.string().describe("要计算哈希的数据"),
    algorithm: z
      .enum(["sha256", "sha512", "md5"])
      .describe("哈希算法：sha256、sha512 或 md5"),
  });

  async execute(args: {
    data: string;
    algorithm: HashAlgorithm;
  }): Promise<string> {
    const { data, algorithm } = args;

    try {
      const hash = crypto.createHash(algorithm);
      hash.update(data, "utf8");
      return hash.digest("hex");
    } catch (error) {
      throw new ToolExecutionError(
        this.name,
        `哈希计算失败: ${(error as Error).message}`,
      );
    }
  }
}

// ==================== 导出实例 ====================

export const encryptTool = new EncryptTool();
export const decryptTool = new DecryptTool();
export const hashTool = new HashTool();