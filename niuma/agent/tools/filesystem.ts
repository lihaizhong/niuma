/**
 * 文件系统工具
 * 提供文件读写、编辑、目录列出等功能
 */

// ==================== 内置库 ====================
import { resolve, isAbsolute, dirname, basename } from "path";

// ==================== 第三方库 ====================
import fs from "fs-extra";
import { z } from "zod";
import fg from "fast-glob";
import RE2 from "re2";

// ==================== 本地模块 ====================
import { BaseTool } from "./base";
import { ToolExecutionError } from "../../types/error";

// ==================== 常量定义 ====================
const MAX_FILE_SIZE_FOR_SEARCH = 10 * 1024 * 1024; // 10MB - 搜索文件大小限制
const MAX_FILE_SIZE_FOR_COPY = 100 * 1024 * 1024; // 100MB - 复制/移动文件大小限制
const MAX_MATCHES = 100; // 最大匹配数

// ==================== 工具函数 ====================

/**
 * 解析路径：支持绝对路径和相对路径
 */
function resolvePath(path: string, cwd: string = process.cwd()): string {
  if (isAbsolute(path)) {
    return path;
  }
  return resolve(cwd, path);
}

// ==================== 类定义 ====================

/**
 * ReadFile 工具：读取文件内容
 */
export class ReadFileTool extends BaseTool {
  readonly name = "read_file";
  readonly description =
    "读取文件内容。支持行号范围读取（offset/limit）和大文件截断（30,000 字符限制）。";
  readonly parameters = z.object({
    path: z.string().describe("文件路径（绝对或相对）"),
    offset: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe("起始行号（0-based）"),
    limit: z.number().int().positive().optional().describe("读取行数限制"),
  });

  async execute(args: {
    path: string;
    offset?: number;
    limit?: number;
  }): Promise<string> {
    const { path, offset, limit } = args;
    const resolvedPath = resolvePath(path);

    try {
      const content = await fs.readFile(resolvedPath, "utf-8");
      const lines = content.split("\n");

      // 处理行号范围
      let resultLines = lines;
      if (offset !== undefined || limit !== undefined) {
        const start = offset ?? 0;
        const end = limit !== undefined ? start + limit : undefined;
        resultLines = lines.slice(start, end);
      }

      let result = resultLines.join("\n");

      // 处理大文件截断
      const MAX_CHARS = 30000;
      if (result.length > MAX_CHARS) {
        result =
          result.slice(0, MAX_CHARS) +
          "\n\n... (内容已截断，使用 offset/limit 分页读取更多内容)";
      }

      return result;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new ToolExecutionError(this.name, `文件不存在: ${resolvedPath}`);
      }
      if ((error as NodeJS.ErrnoException).code === "EACCES") {
        throw new ToolExecutionError(
          this.name,
          `无权限访问文件: ${resolvedPath}`,
        );
      }
      throw new ToolExecutionError(
        this.name,
        `读取文件失败: ${(error as Error).message}`,
      );
    }
  }
}

/**
 * WriteFile 工具：写入文件
 */
export class WriteFileTool extends BaseTool {
  readonly name = "write_file";
  readonly description = "创建或覆盖文件。自动创建目录。";
  readonly parameters = z.object({
    path: z.string().describe("文件路径"),
    content: z.string().describe("文件内容"),
  });

  async execute(args: { path: string; content: string }): Promise<string> {
    const { path, content } = args;
    const resolvedPath = resolvePath(path);

    try {
      // 写入文件（自动创建目录）
      await fs.outputFile(resolvedPath, content);
      return `成功写入文件: ${resolvedPath}`;
    } catch (error) {
      throw new ToolExecutionError(
        this.name,
        `写入文件失败: ${(error as Error).message}`,
      );
    }
  }
}

/**
 * EditFile 工具：精确编辑文件
 */
export class EditFileTool extends BaseTool {
  readonly name = "edit_file";
  readonly description = "精确修改文件的特定部分。支持字符串替换。";
  readonly parameters = z.object({
    path: z.string().describe("文件路径"),
    old_string: z.string().describe("要替换的旧内容（精确匹配）"),
    new_string: z.string().describe("新内容"),
  });

  async execute(args: {
    path: string;
    old_string: string;
    new_string: string;
  }): Promise<string> {
    const { path, old_string, new_string } = args;
    const resolvedPath = resolvePath(path);

    try {
      // 读取文件
      const content = await fs.readFile(resolvedPath, "utf-8");

      // 检查是否包含旧内容
      if (!content.includes(old_string)) {
        throw new ToolExecutionError(
          this.name,
          `文件中未找到指定的内容: ${old_string.slice(0, 50)}...`,
        );
      }

      // 替换内容
      const newContent = content.replace(old_string, new_string);

      // 写入文件
      await fs.writeFile(resolvedPath, newContent, "utf-8");
      return `成功编辑文件: ${resolvedPath}`;
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }
      throw new ToolExecutionError(
        this.name,
        `编辑文件失败: ${(error as Error).message}`,
      );
    }
  }
}

/**
 * ListDir 工具：列出目录内容（使用 fast-glob）
 */
export class ListDirTool extends BaseTool {
  readonly name = "list_dir";
  readonly description =
    "列出目录中的文件和子目录。支持递归列出和 glob 模式过滤（使用 fast-glob）。";
  readonly parameters = z.object({
    path: z.string().describe("目录路径"),
    recursive: z.boolean().optional().describe("是否递归列出子目录"),
    pattern: z
      .string()
      .optional()
      .describe("文件过滤模式（glob 模式，支持完整语法）"),
    ignore: z.array(z.string()).optional().describe("忽略的模式（glob 模式）"),
  });

  async execute(args: {
    path: string;
    recursive?: boolean;
    pattern?: string;
    ignore?: string[];
  }): Promise<string> {
    const { path, recursive = false, pattern, ignore = [] } = args;
    const resolvedPath = resolvePath(path);

    try {
      // 检查路径是否存在且是目录
      const stats = await fs.stat(resolvedPath);
      if (!stats.isDirectory()) {
        throw new ToolExecutionError(
          this.name,
          `路径不是目录: ${resolvedPath}`,
        );
      }

      // 构建模式列表
      const patterns: string[] = [];

      if (pattern) {
        // 使用用户提供的 glob 模式
        patterns.push(pattern);
      } else {
        // 默认列出所有文件和目录
        patterns.push(recursive ? "**/*" : "*");
      }

      // 使用 fast-glob 进行文件匹配
      const entries = await fg(patterns, {
        cwd: resolvedPath,
        ignore,
        absolute: false,
        onlyFiles: false,
        objectMode: true,
        stats: true,
        deep: recursive ? Infinity : 0,
        dot: true,
        caseSensitiveMatch: false,
        unique: true,
      });

      // 格式化输出
      const output = entries
        .map((entry) => {
          const typeStr = entry.dirent.isDirectory() ? "[DIR]" : "[FILE]";
          const sizeStr = entry.stats ? ` (${entry.stats.size} bytes)` : "";
          return `${typeStr} ${entry.path}${sizeStr}`;
        })
        .join("\n");

      return output || "目录为空";
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new ToolExecutionError(this.name, `目录不存在: ${resolvedPath}`);
      }
      throw new ToolExecutionError(
        this.name,
        `列出目录失败: ${(error as Error).message}`,
      );
    }
  }
}

/**
 * FileSearch 工具：在文件中搜索内容
 */
export class FileSearchTool extends BaseTool {
  readonly name = "file_search";
  readonly description =
    "在文件中使用正则表达式搜索内容。支持大小写敏感/不敏感选项和匹配数量限制。";
  readonly parameters = z.object({
    path: z.string().describe("文件路径"),
    pattern: z.string().describe("搜索模式（正则表达式）"),
    caseSensitive: z
      .boolean()
      .optional()
      .default(false)
      .describe("大小写敏感（默认 false）"),
    maxMatches: z
      .number()
      .int()
      .positive()
      .optional()
      .default(100)
      .describe("最大匹配数（默认 100）"),
  });

  async execute(args: {
    path: string;
    pattern: string;
    caseSensitive?: boolean;
    maxMatches?: number;
  }): Promise<string> {
    const {
      path,
      pattern,
      caseSensitive = false,
      maxMatches = MAX_MATCHES,
    } = args;
    const resolvedPath = resolvePath(path);

    try {
      // 检查文件大小
      const stats = await fs.stat(resolvedPath);
      if (stats.size > MAX_FILE_SIZE_FOR_SEARCH) {
        throw new ToolExecutionError(
          this.name,
          `文件过大（${Math.round(stats.size / 1024 / 1024)}MB），超过 ${MAX_FILE_SIZE_FOR_SEARCH / 1024 / 1024}MB 限制`,
        );
      }

      if (!stats.isFile()) {
        throw new ToolExecutionError(
          this.name,
          `路径不是文件: ${resolvedPath}`,
        );
      }

      // 读取文件内容
      const content = await fs.readFile(resolvedPath, "utf-8");
      const lines = content.split("\n");

      // 创建正则表达式（使用 RE2 以防止 ReDoS 攻击）
      const flags = caseSensitive ? "g" : "gi";
      let regex: RE2;

      try {
        regex = new RE2(pattern, flags);
      } catch (error) {
        throw new ToolExecutionError(
          this.name,
          `无效的正则表达式: ${(error as Error).message}`,
        );
      }

      // 搜索匹配的行
      const matches: Array<{
        lineNumber: number;
        line: string;
        matches: string[];
      }> = [];
      let totalMatches = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        regex.lastIndex = 0; // 重置正则表达式状态
        const lineMatches: string[] = [];
        let match;

        while ((match = regex.exec(line)) !== null) {
          lineMatches.push(match[0]);
          totalMatches++;

          // 防止正则表达式回溯攻击（限制单行匹配数）
          if (lineMatches.length > 100) {
            break;
          }
        }

        if (lineMatches.length > 0) {
          matches.push({
            lineNumber: i + 1, // 1-based line number
            line: line.trim(),
            matches: lineMatches,
          });

          if (totalMatches >= maxMatches) {
            break;
          }
        }
      }

      // 格式化输出
      if (matches.length === 0) {
        return "未找到匹配项";
      }

      const output = matches
        .map((m) => {
          const matchPreview =
            m.matches.length > 3
              ? `${m.matches.slice(0, 3).join(", ")}... (+${m.matches.length - 3} more)`
              : m.matches.join(", ");
          return `行 ${m.lineNumber}: ${m.line}\n  匹配: ${matchPreview}`;
        })
        .join("\n\n");

      return `找到 ${matches.length} 行匹配，共 ${totalMatches} 个匹配项\n\n${output}`;
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new ToolExecutionError(this.name, `文件不存在: ${resolvedPath}`);
      }
      throw new ToolExecutionError(
        this.name,
        `搜索文件失败: ${(error as Error).message}`,
      );
    }
  }
}

/**
 * FileMove 工具：移动文件到新位置
 */
export class FileMoveTool extends BaseTool {
  readonly name = "file_move";
  readonly description = "将文件移动到新位置。支持重命名和跨目录移动。";
  readonly parameters = z.object({
    source: z.string().describe("源文件路径"),
    dest: z.string().describe("目标路径"),
  });

  async execute(args: { source: string; dest: string }): Promise<string> {
    const { source, dest } = args;
    const resolvedSource = resolvePath(source);
    const resolvedDest = resolvePath(dest);

    try {
      // 检查源文件是否存在
      const sourceStats = await fs.stat(resolvedSource);
      if (!sourceStats.isFile()) {
        throw new ToolExecutionError(
          this.name,
          `源路径不是文件: ${resolvedSource}`,
        );
      }

      // 检查文件大小
      if (sourceStats.size > MAX_FILE_SIZE_FOR_COPY) {
        throw new ToolExecutionError(
          this.name,
          `文件过大（${Math.round(sourceStats.size / 1024 / 1024)}MB），超过 ${MAX_FILE_SIZE_FOR_COPY / 1024 / 1024}MB 限制`,
        );
      }

      // 确保目标目录存在
      const destDir = dirname(resolvedDest);
      await fs.mkdir(destDir, { recursive: true });

      // 使用 fs.rename 进行原子性移动（同一文件系统）
      try {
        await fs.rename(resolvedSource, resolvedDest);
      } catch (renameError) {
        // 如果跨设备移动失败，回退到复制+删除
        if ((renameError as NodeJS.ErrnoException).code === "EXDEV") {
          const content = await fs.readFile(resolvedSource, "utf-8");
          await fs.writeFile(resolvedDest, content, "utf-8");
          await fs.unlink(resolvedSource);
        } else {
          throw renameError;
        }
      }

      return `成功移动文件: ${resolvedSource} -> ${resolvedDest}`;
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new ToolExecutionError(
          this.name,
          `源文件不存在: ${resolvedSource}`,
        );
      }
      throw new ToolExecutionError(
        this.name,
        `移动文件失败: ${(error as Error).message}`,
      );
    }
  }
}

/**
 * FileCopy 工具：复制文件到新位置
 */
export class FileCopyTool extends BaseTool {
  readonly name = "file_copy";
  readonly description = "复制文件到新位置。支持重命名和跨目录复制。";
  readonly parameters = z.object({
    source: z.string().describe("源文件路径"),
    dest: z.string().describe("目标路径"),
  });

  async execute(args: { source: string; dest: string }): Promise<string> {
    const { source, dest } = args;
    const resolvedSource = resolvePath(source);
    const resolvedDest = resolvePath(dest);

    try {
      // 检查源文件是否存在
      const sourceStats = await fs.stat(resolvedSource);
      if (!sourceStats.isFile()) {
        throw new ToolExecutionError(
          this.name,
          `源路径不是文件: ${resolvedSource}`,
        );
      }

      // 检查文件大小
      if (sourceStats.size > MAX_FILE_SIZE_FOR_COPY) {
        throw new ToolExecutionError(
          this.name,
          `文件过大（${Math.round(sourceStats.size / 1024 / 1024)}MB），超过 ${MAX_FILE_SIZE_FOR_COPY / 1024 / 1024}MB 限制`,
        );
      }

      // 确保目标目录存在
      const destDir = dirname(resolvedDest);
      await fs.mkdir(destDir, { recursive: true });

      // 复制文件
      await fs.copyFile(resolvedSource, resolvedDest);

      return `成功复制文件: ${resolvedSource} -> ${resolvedDest}`;
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new ToolExecutionError(
          this.name,
          `源文件不存在: ${resolvedSource}`,
        );
      }
      throw new ToolExecutionError(
        this.name,
        `复制文件失败: ${(error as Error).message}`,
      );
    }
  }
}

/**
 * FileDelete 工具：安全删除文件
 */
export class FileDeleteTool extends BaseTool {
  readonly name = "file_delete";
  readonly description = "安全地删除文件。需要确认参数。";
  readonly parameters = z.object({
    path: z.string().describe("文件路径"),
    confirm: z.boolean().describe("必须设置为 true 才能执行删除操作"),
  });

  async execute(args: { path: string; confirm: boolean }): Promise<string> {
    const { path, confirm } = args;
    const resolvedPath = resolvePath(path);

    // 安全检查
    if (!confirm) {
      throw new ToolExecutionError(
        this.name,
        "删除操作需要确认，请设置 confirm 参数为 true",
      );
    }

    try {
      // 检查文件是否存在
      const stats = await fs.stat(resolvedPath);
      if (!stats.isFile()) {
        throw new ToolExecutionError(
          this.name,
          `路径不是文件: ${resolvedPath}`,
        );
      }

      // 删除文件
      await fs.unlink(resolvedPath);

      return `成功删除文件: ${resolvedPath}`;
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new ToolExecutionError(this.name, `文件不存在: ${resolvedPath}`);
      }
      if ((error as NodeJS.ErrnoException).code === "EACCES") {
        throw new ToolExecutionError(
          this.name,
          `无权限删除文件: ${resolvedPath}`,
        );
      }
      throw new ToolExecutionError(
        this.name,
        `删除文件失败: ${(error as Error).message}`,
      );
    }
  }
}

/**
 * FileInfo 工具：获取文件详细信息
 */
export class FileInfoTool extends BaseTool {
  readonly name = "file_info";
  readonly description = "获取文件或目录的详细信息（大小、权限、修改时间等）。";
  readonly parameters = z.object({
    path: z.string().describe("文件或目录路径"),
  });

  async execute(args: { path: string }): Promise<string> {
    const { path } = args;
    const resolvedPath = resolvePath(path);

    try {
      // 获取文件信息
      const stats = await fs.stat(resolvedPath);

      // 格式化时间
      const formatTime = (date: Date) => date.toISOString();

      // 构建结果
      const info = {
        path: resolvedPath,
        name: basename(resolvedPath),
        type: stats.isDirectory() ? "directory" : "file",
        size: stats.size,
        modified: formatTime(stats.mtime),
        accessed: formatTime(stats.atime),
        created: formatTime(stats.birthtime),
        mode: stats.mode.toString(8),
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
      };

      return JSON.stringify(info, null, 2);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new ToolExecutionError(this.name, `路径不存在: ${resolvedPath}`);
      }
      throw new ToolExecutionError(
        this.name,
        `获取文件信息失败: ${(error as Error).message}`,
      );
    }
  }
}

/**
 * DirCreate 工具：创建目录
 */
export class DirCreateTool extends BaseTool {
  readonly name = "dir_create";
  readonly description = "创建目录。支持递归创建。";
  readonly parameters = z.object({
    path: z.string().describe("目录路径"),
    recursive: z
      .boolean()
      .optional()
      .default(true)
      .describe("递归创建（默认 true）"),
  });

  async execute(args: { path: string; recursive?: boolean }): Promise<string> {
    const { path, recursive = true } = args;
    const resolvedPath = resolvePath(path);

    try {
      // 创建目录
      await fs.mkdir(resolvedPath, { recursive });

      return `成功创建目录: ${resolvedPath}`;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EACCES") {
        throw new ToolExecutionError(
          this.name,
          `无权限创建目录: ${resolvedPath}`,
        );
      }
      throw new ToolExecutionError(
        this.name,
        `创建目录失败: ${(error as Error).message}`,
      );
    }
  }
}

/**
 * DirDelete 工具：安全删除目录
 */
export class DirDeleteTool extends BaseTool {
  readonly name = "dir_delete";
  readonly description = "安全地删除目录。需要确认参数，支持递归删除。";
  readonly parameters = z.object({
    path: z.string().describe("目录路径"),
    recursive: z
      .boolean()
      .optional()
      .default(false)
      .describe("递归删除（默认 false）"),
    confirm: z.boolean().describe("必须设置为 true 才能执行删除操作"),
  });

  async execute(args: {
    path: string;
    recursive?: boolean;
    confirm: boolean;
  }): Promise<string> {
    const { path, recursive = false, confirm } = args;
    const resolvedPath = resolvePath(path);

    // 安全检查
    if (!confirm) {
      throw new ToolExecutionError(
        this.name,
        "删除操作需要确认，请设置 confirm 参数为 true",
      );
    }

    // 受保护路径列表（不允许删除的路径）
    const protectedPaths = [
      process.cwd(), // 项目根目录
      process.env.HOME, // 用户主目录
      "/System", // 系统目录（macOS）
      "/usr", // 系统目录（Unix）
      "/etc", // 配置目录（Unix）
    ].filter(Boolean) as string[];

    // 检查是否尝试删除受保护路径
    for (const protectedPath of protectedPaths) {
      if (
        resolvedPath === protectedPath ||
        resolvedPath.startsWith(protectedPath + "/")
      ) {
        throw new ToolExecutionError(
          this.name,
          `不允许删除受保护路径: ${resolvedPath}`,
        );
      }
    }

    try {
      // 检查目录是否存在
      const stats = await fs.stat(resolvedPath);
      if (!stats.isDirectory()) {
        throw new ToolExecutionError(
          this.name,
          `路径不是目录: ${resolvedPath}`,
        );
      }

      // 检查是否为空目录（非递归模式）
      if (!recursive) {
        const entries = await fs.readdir(resolvedPath);
        if (entries.length > 0) {
          throw new ToolExecutionError(
            this.name,
            `目录不为空（${entries.length} 项），请设置 recursive 参数为 true: ${resolvedPath}`,
          );
        }
      }

      // 删除目录（始终使用 recursive: true，因为 rm() 需要这个选项才能删除目录）
      // 对于空目录，recursive: true 不会产生副作用
      await fs.rm(resolvedPath, { recursive: true, force: true });

      return `成功删除目录: ${resolvedPath}`;
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new ToolExecutionError(this.name, `目录不存在: ${resolvedPath}`);
      }
      if ((error as NodeJS.ErrnoException).code === "EACCES") {
        throw new ToolExecutionError(
          this.name,
          `无权限删除目录: ${resolvedPath}`,
        );
      }
      throw new ToolExecutionError(
        this.name,
        `删除目录失败: ${(error as Error).message}`,
      );
    }
  }
}

// 导出工具实例
export const readFileTool = new ReadFileTool();
export const writeFileTool = new WriteFileTool();
export const editFileTool = new EditFileTool();
export const listDirTool = new ListDirTool();
export const fileSearchTool = new FileSearchTool();
export const fileMoveTool = new FileMoveTool();
export const fileCopyTool = new FileCopyTool();
export const fileDeleteTool = new FileDeleteTool();
export const fileInfoTool = new FileInfoTool();
export const dirCreateTool = new DirCreateTool();
export const dirDeleteTool = new DirDeleteTool();
