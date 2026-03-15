/**
 * 压缩与解压工具
 * 提供文件压缩和解压功能，支持 zip、tar、tar.gz 等格式
 */

// ==================== 内置库 ====================
import { resolve, basename, dirname, extname } from "path";

// ==================== 第三方库 ====================
import fs from "fs-extra";
import archiver from "archiver";
import AdmZip from "adm-zip";
import * as tar from "tar";
import { z } from "zod";

// ==================== 本地模块 ====================
import { BaseTool } from "./base";
import { ToolExecutionError } from "../../types/error";

// ==================== 常量定义 ====================
const MAX_ARCHIVE_SIZE = 100 * 1024 * 1024; // 100MB - 压缩/解压文件大小限制

// ==================== 工具函数 ====================

/**
 * 解析路径：支持绝对路径和相对路径
 */
function resolvePath(path: string, cwd: string = process.cwd()): string {
  return resolve(cwd, path);
}

/**
 * 检查文件大小是否超过限制
 */
function checkFileSize(path: string, maxSize: number): void {
  try {
    const stats = fs.statSync(path);
    if (stats.size > maxSize) {
      throw new Error(
        `文件大小超过限制 (${(maxSize / 1024 / 1024).toFixed(0)}MB): ${path}`,
      );
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`文件不存在: ${path}`, { cause: error });
    }
    throw error;
  }
}

/**
 * 检查目录总大小是否超过限制
 */
async function checkDirSize(path: string, maxSize: number): Promise<void> {
  let totalSize = 0;

  async function calculateSize(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        await calculateSize(fullPath);
          } else {
            const stats = await fs.stat(fullPath);
            totalSize += stats.size;      }
      if (totalSize > maxSize) {
        throw new Error(
          `目录总大小超过限制 (${(maxSize / 1024 / 1024).toFixed(0)}MB): ${path}`,
        );
      }
    }
  }

  try {
    await calculateSize(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`目录不存在: ${path}`, { cause: error });
    }
    throw error;
  }
}

// ==================== 类定义 ====================

/**
 * Archive 工具：压缩文件或目录
 */
export class ArchiveTool extends BaseTool {
  readonly name = "archive";
  readonly description =
    "压缩文件或目录。支持格式：zip、tar、tar.gz。最大文件大小：100MB。";
  readonly parameters = z.object({
    source: z.string().describe("源文件或目录路径"),
    destination: z.string().describe("目标压缩文件路径"),
    format: z
      .enum(["zip", "tar", "tar.gz"])
      .describe("压缩格式：zip、tar、tar.gz"),
  });

  async execute(args: {
    source: string;
    destination: string;
    format: string;
  }): Promise<string> {
    const { source, destination, format } = args;
    const resolvedSource = resolvePath(source);
    const resolvedDest = resolvePath(destination);

    // 检查源路径是否存在
    if (!fs.existsSync(resolvedSource)) {
      throw new ToolExecutionError(
        this.name,
        `源文件或目录不存在: ${resolvedSource}`,
      );
    }

    // 检查文件/目录大小
    try {
      const stats = fs.statSync(resolvedSource);
      if (stats.isDirectory()) {
        await checkDirSize(resolvedSource, MAX_ARCHIVE_SIZE);
      } else {
        checkFileSize(resolvedSource, MAX_ARCHIVE_SIZE);
      }
    } catch (error) {
      throw new ToolExecutionError(this.name, (error as Error).message);
    }

    // 确保目标目录存在
    const destDir = dirname(resolvedDest);
    await fs.mkdir(destDir, { recursive: true });

    try {
      if (format === "zip") {
        await createZipArchive(resolvedSource, resolvedDest);
      } else if (format === "tar" || format === "tar.gz") {
        await createTarArchive(
          resolvedSource,
          resolvedDest,
          format === "tar.gz",
        );
      }

      // 获取压缩后的文件大小
      const destStats = await fs.stat(resolvedDest);
      const sizeInMB = (destStats.size / 1024 / 1024).toFixed(2);

      return `成功压缩 ${format} 文件: ${resolvedDest}\n文件大小: ${sizeInMB} MB`;
    } catch (error) {
      throw new ToolExecutionError(
        this.name,
        `压缩失败: ${(error as Error).message}`,
      );
    }
  }
}

/**
 * 创建 ZIP 压缩文件
 */
async function createZipArchive(source: string, destination: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(destination);
    const archive = archiver("zip", {
      zlib: { level: 9 }, // 最高压缩级别
    });

    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);
    archive.file(source, { name: basename(source) });
    void archive.finalize();
  });
}

/**
 * 创建 TAR 压缩文件
 */
async function createTarArchive(
  source: string,
  destination: string,
  gzip: boolean,
): Promise<void> {
  const options = {
    file: destination,
    cwd: dirname(source),
    gzip,
  };

  const sourceBase = basename(source);
  await tar.create(options, [sourceBase]);
}

/**
 * Extract 工具：解压文件
 */
export class ExtractTool extends BaseTool {
  readonly name = "extract";
  readonly description =
    "解压压缩文件。支持格式：zip、tar、tar.gz、tar.bz2。最大文件大小：100MB。";
  readonly parameters = z.object({
    source: z.string().describe("源压缩文件路径"),
    destination: z.string().describe("目标目录路径"),
  });

  async execute(args: {
    source: string;
    destination: string;
  }): Promise<string> {
    const { source, destination } = args;
    const resolvedSource = resolvePath(source);
    const resolvedDest = resolvePath(destination);

    // 检查源文件是否存在
    if (!fs.existsSync(resolvedSource)) {
      throw new ToolExecutionError(
        this.name,
        `压缩文件不存在: ${resolvedSource}`,
      );
    }

    // 检查文件大小
    try {
      checkFileSize(resolvedSource, MAX_ARCHIVE_SIZE);
    } catch (error) {
      throw new ToolExecutionError(this.name, (error as Error).message);
    }

    // 确保目标目录存在
    await fs.mkdir(resolvedDest, { recursive: true });

    const ext = extname(resolvedSource).toLowerCase();
    const filename = basename(resolvedSource).toLowerCase();

    try {
      let fileCount = 0;

      if (filename.endsWith(".tar.gz") || filename.endsWith(".tgz")) {
        // 解压 tar.gz
        await tar.extract({
          file: resolvedSource,
          cwd: resolvedDest,
          gzip: true,
        });
        fileCount = await countExtractedFiles(resolvedDest);
      } else if (
        ext === ".tar" ||
        filename.endsWith(".tar.bz2") ||
        filename.endsWith(".tbz2")
      ) {
        // 解压 tar 或 tar.bz2
        await tar.extract({
          file: resolvedSource,
          cwd: resolvedDest,
        });
        fileCount = await countExtractedFiles(resolvedDest);
      } else if (ext === ".zip") {
        // 解压 zip
        const zip = new AdmZip(resolvedSource);
        zip.extractAllTo(resolvedDest, true);
        fileCount = zip.getEntries().length;
      } else {
        throw new ToolExecutionError(
          this.name,
          `不支持的压缩格式: ${ext}，仅支持 zip、tar、tar.gz、tar.bz2`,
        );
      }

      return `成功解压文件到: ${resolvedDest}\n解压文件数: ${fileCount}`;
    } catch (error) {
      if ((error as Error).message.includes("corrupted")) {
        throw new ToolExecutionError(
          this.name,
          `压缩文件损坏或格式不正确: ${(error as Error).message}`,
        );
      }
      throw new ToolExecutionError(
        this.name,
        `解压失败: ${(error as Error).message}`,
      );
    }
  }
}

/**
 * 统计解压后的文件数量
 */
async function countExtractedFiles(dir: string): Promise<number> {
  let count = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.name.startsWith(".")) {
      count++;
    }
  }
  return count;
}

// ==================== 导出工具实例 ====================
export const archiveTool = new ArchiveTool();
export const extractTool = new ExtractTool();
