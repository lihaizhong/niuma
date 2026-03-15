/**
 * 压缩与解压工具测试
 */

// ==================== 内置库 ====================
import { join } from "path";
import { tmpdir } from "os";

// ==================== 第三方库 ====================
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";

// ==================== 本地模块 ====================
import { archiveTool, extractTool } from "../agent/tools/archive";
import { ToolExecutionError } from "../types/error";

describe("ArchiveTool", () => {
  let testDir: string;
  let testFile: string;
  let testSubDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `niuma-test-archive-${process.pid}-${Date.now()}`);
    testFile = join(testDir, "test.txt");
    testSubDir = join(testDir, "subdir");
    await fs.mkdir(testSubDir, { recursive: true });
    await fs.writeFile(testFile, "Hello, World!", "utf-8");
    await fs.writeFile(join(testSubDir, "nested.txt"), "Nested content", "utf-8");
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[ArchiveTool] 清理临时目录失败: ${testDir}`, error);
    }
  });

  describe("ZIP 压缩", () => {
    it("应该成功压缩单个文件为 ZIP", async () => {
      const zipFile = join(testDir, "test.zip");
      const result = await archiveTool.execute({
        source: testFile,
        destination: zipFile,
        format: "zip",
      });

      expect(result).toContain("成功压缩");
      expect(result).toContain("zip");
      expect(fs.existsSync(zipFile)).toBe(true);
    });

    it("应该成功压缩目录为 ZIP", async () => {
      const zipFile = join(testDir, "test-dir.zip");
      const result = await archiveTool.execute({
        source: testSubDir,
        destination: zipFile,
        format: "zip",
      });

      expect(result).toContain("成功压缩");
      expect(fs.existsSync(zipFile)).toBe(true);
    });

    it("应该失败当源文件不存在", async () => {
      const nonExistentFile = join(testDir, "nonexistent.txt");
      const zipFile = join(testDir, "test.zip");

      await expect(
        archiveTool.execute({
          source: nonExistentFile,
          destination: zipFile,
          format: "zip",
        }),
      ).rejects.toThrow(ToolExecutionError);
    });
  });

  describe("TAR 压缩", () => {
    it("应该成功压缩为 TAR", async () => {
      const tarFile = join(testDir, "test.tar");
      const result = await archiveTool.execute({
        source: testFile,
        destination: tarFile,
        format: "tar",
      });

      expect(result).toContain("成功压缩");
      expect(result).toContain("tar");
      expect(fs.existsSync(tarFile)).toBe(true);
    });

    it("应该成功压缩为 TAR.GZ", async () => {
      const tarGzFile = join(testDir, "test.tar.gz");
      const result = await archiveTool.execute({
        source: testFile,
        destination: tarGzFile,
        format: "tar.gz",
      });

      expect(result).toContain("成功压缩");
      expect(result).toContain("tar.gz");
      expect(fs.existsSync(tarGzFile)).toBe(true);
    });
  });
});

describe("ExtractTool", () => {
  let testDir: string;
  let testFile: string;
  let extractDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `niuma-test-extract-${process.pid}-${Date.now()}`);
    extractDir = join(testDir, "extracted");
    testFile = join(testDir, "test.txt");
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(testFile, "Hello, World!", "utf-8");
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[ExtractTool] 清理临时目录失败: ${testDir}`, error);
    }
  });

  describe("ZIP 解压", () => {
    it("应该成功解压 ZIP 文件", async () => {
      // 先创建 ZIP 文件
      const zipFile = join(testDir, "test.zip");
      await archiveTool.execute({
        source: testFile,
        destination: zipFile,
        format: "zip",
      });

      // 解压
      const result = await extractTool.execute({
        source: zipFile,
        destination: extractDir,
      });

      expect(result).toContain("成功解压");
      expect(fs.existsSync(extractDir)).toBe(true);
      expect(fs.existsSync(join(extractDir, "test.txt"))).toBe(true);
    });

    it("应该失败当 ZIP 文件不存在", async () => {
      const nonExistentZip = join(testDir, "nonexistent.zip");

      await expect(
        extractTool.execute({
          source: nonExistentZip,
          destination: extractDir,
        }),
      ).rejects.toThrow(ToolExecutionError);
    });
  });

  describe("TAR 解压", () => {
    it("应该成功解压 TAR 文件", async () => {
      // 先创建 TAR 文件
      const tarFile = join(testDir, "test.tar");
      await archiveTool.execute({
        source: testFile,
        destination: tarFile,
        format: "tar",
      });

      // 解压
      const result = await extractTool.execute({
        source: tarFile,
        destination: extractDir,
      });

      expect(result).toContain("成功解压");
      expect(fs.existsSync(extractDir)).toBe(true);
    });

    it("应该成功解压 TAR.GZ 文件", async () => {
      // 先创建 TAR.GZ 文件
      const tarGzFile = join(testDir, "test.tar.gz");
      await archiveTool.execute({
        source: testFile,
        destination: tarGzFile,
        format: "tar.gz",
      });

      // 解压
      const result = await extractTool.execute({
        source: tarGzFile,
        destination: extractDir,
      });

      expect(result).toContain("成功解压");
      expect(fs.existsSync(extractDir)).toBe(true);
    });
  });

  describe("不支持的格式", () => {
    it("应该失败当格式不支持", async () => {
      const unsupportedFile = join(testDir, "test.rar");
      await fs.writeFile(unsupportedFile, "fake rar content", "utf-8");

      await expect(
        extractTool.execute({
          source: unsupportedFile,
          destination: extractDir,
        }),
      ).rejects.toThrow(ToolExecutionError);
    });
  });
});