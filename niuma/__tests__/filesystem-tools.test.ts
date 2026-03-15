/**
 * 文件系统工具测试
 */

// ==================== 内置库 ====================
import { join } from "path";
import { tmpdir } from "os";

// ==================== 第三方库 ====================
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";

// ==================== 本地模块 ====================
import {
  readFileTool,
  writeFileTool,
  editFileTool,
  listDirTool,
  fileSearchTool,
  fileMoveTool,
  fileCopyTool,
  fileDeleteTool,
  fileInfoTool,
  dirCreateTool,
  dirDeleteTool,
} from "../agent/tools/filesystem";
import { ToolExecutionError } from "../types/error";

describe("ReadFileTool", () => {
  let testDir: string;
  let testFile: string;
  const testContent = "Hello, World!\nLine 2\nLine 3";

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `niuma-test-readfile-${process.pid}-${Date.now()}`,
    );
    testFile = join(testDir, "test.txt");
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(testFile, testContent, "utf-8");
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[ReadFileTool] 清理临时目录失败: ${testDir}`, error);
    }
  });

  it("应该成功读取完整文件", async () => {
    const result = await readFileTool.execute({ path: testFile });
    expect(result).toBe(testContent);
  });

  it("应该成功读取指定行号范围", async () => {
    const result = await readFileTool.execute({
      path: testFile,
      offset: 1,
      limit: 2,
    });
    const lines = result.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("Line 2");
    expect(lines[1]).toBe("Line 3");
  });

  it("应该抛出错误当文件不存在", async () => {
    await expect(
      readFileTool.execute({ path: "/nonexistent/file.txt" }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该处理空文件", async () => {
    const emptyFile = join(testDir, "empty.txt");
    await fs.writeFile(emptyFile, "", "utf-8");
    const result = await readFileTool.execute({ path: emptyFile });
    expect(result).toBe("");
  });
});

describe("WriteFileTool", () => {
  let testDir: string;
  let testFile: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `niuma-test-writefile-${process.pid}-${Date.now()}`,
    );
    testFile = join(testDir, "test.txt");
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[WriteFileTool] 清理临时目录失败: ${testDir}`, error);
    }
  });

  it("应该成功写入新文件", async () => {
    const content = "Test content";
    const result = await writeFileTool.execute({ path: testFile, content });
    expect(result).toContain("成功写入文件");
  });

  it("应该成功覆盖现有文件", async () => {
    await fs.writeFile(testFile, "Old content", "utf-8");
    const newContent = "New content";
    await writeFileTool.execute({ path: testFile, content: newContent });
    const result = await readFileTool.execute({ path: testFile });
    expect(result).toBe(newContent);
  });

  it("应该自动创建目录", async () => {
    const nestedFile = join(testDir, "nested", "dir", "test.txt");
    const result = await writeFileTool.execute({
      path: nestedFile,
      content: "test",
    });
    expect(result).toContain("成功写入文件");
  });
});

describe("EditFileTool", () => {
  let testDir: string;
  let testFile: string;
  const testContent = "Hello, World!\nThis is a test.\nGoodbye!";

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `niuma-test-editfile-${process.pid}-${Date.now()}`,
    );
    testFile = join(testDir, "test.txt");
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(testFile, testContent, "utf-8");
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[EditFileTool] 清理临时目录失败: ${testDir}`, error);
    }
  });

  it("应该成功替换指定内容", async () => {
    await editFileTool.execute({
      path: testFile,
      old_string: "Hello, World!",
      new_string: "Hi, World!",
    });
    const result = await readFileTool.execute({ path: testFile });
    expect(result).toContain("Hi, World!");
    expect(result).not.toContain("Hello, World!");
  });

  it("应该抛出错误当内容未找到", async () => {
    await expect(
      editFileTool.execute({
        path: testFile,
        old_string: "Nonexistent content",
        new_string: "Replacement",
      }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该支持多行替换", async () => {
    await editFileTool.execute({
      path: testFile,
      old_string: "This is a test.",
      new_string: "This is an updated test.",
    });
    const result = await readFileTool.execute({ path: testFile });
    expect(result).toContain("This is an updated test.");
  });
});

describe("ListDirTool", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `niuma-test-listdir-${process.pid}-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(join(testDir, "file1.txt"), "content1", "utf-8");
    await fs.writeFile(join(testDir, "file2.txt"), "content2", "utf-8");
    await fs.mkdir(join(testDir, "subdir"), { recursive: true });
    await fs.writeFile(join(testDir, "subdir", "file3.txt"), "content3", "utf-8");
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[ListDirTool] 清理临时目录失败: ${testDir}`, error);
    }
  });

  it("应该成功列出目录内容", async () => {
    const result = await listDirTool.execute({ path: testDir });
    expect(result).toContain("file1.txt");
    expect(result).toContain("file2.txt");
    expect(result).toContain("subdir");
  });

  it("应该支持递归列出", async () => {
    const result = await listDirTool.execute({
      path: testDir,
      recursive: true,
    });
    expect(result).toContain("file1.txt");
    expect(result).toContain("file2.txt");
    expect(result).toContain("subdir");
    expect(result).toContain("file3.txt");
  });

  it("应该支持模式过滤", async () => {
    const result = await listDirTool.execute({
      path: testDir,
      pattern: "*.txt",
    });
    expect(result).toContain("file1.txt");
    expect(result).toContain("file2.txt");
  });

  it("应该抛出错误当目录不存在", async () => {
    await expect(
      listDirTool.execute({ path: "/nonexistent/dir" }),
    ).rejects.toThrow(ToolExecutionError);
  });
});

describe("FileSearchTool", () => {
  let testDir: string;
  let testFile: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `niuma-test-filesearch-${process.pid}-${Date.now()}`,
    );
    testFile = join(testDir, "test.txt");
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[FileSearchTool] 清理临时目录失败: ${testDir}`, error);
    }
  });

  it("应该成功搜索匹配内容", async () => {
    const content = "Hello World\nHello Universe\nGoodbye World";
    await fs.writeFile(testFile, content, "utf-8");
    const result = await fileSearchTool.execute({
      path: testFile,
      pattern: "Hello",
    });
    expect(result).toContain("找到 2 行匹配");
    expect(result).toContain("共 2 个匹配项");
  });

  it("应该支持大小写不敏感搜索", async () => {
    const content = "Hello World\nhello universe";
    await fs.writeFile(testFile, content, "utf-8");
    const result = await fileSearchTool.execute({
      path: testFile,
      pattern: "hello",
    });
    expect(result).toContain("找到 2 行匹配");
  });

  it("应该支持大小写敏感搜索", async () => {
    const content = "Hello World\nhello universe";
    await fs.writeFile(testFile, content, "utf-8");
    const result = await fileSearchTool.execute({
      path: testFile,
      pattern: "hello",
      caseSensitive: true,
    });
    expect(result).toContain("找到 1 行匹配");
  });

  it("应该返回空结果当无匹配项", async () => {
    const content = "Hello World";
    await fs.writeFile(testFile, content, "utf-8");
    const result = await fileSearchTool.execute({
      path: testFile,
      pattern: "nonexistent",
    });
    expect(result).toBe("未找到匹配项");
  });

  it("应该抛出错误当文件不存在", async () => {
    await expect(
      fileSearchTool.execute({
        path: "/nonexistent/file.txt",
        pattern: "test",
      }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该限制匹配数量", async () => {
    const content = "line1\ntest\nline2\ntest\nline3\ntest";
    await fs.writeFile(testFile, content, "utf-8");
    const result = await fileSearchTool.execute({
      path: testFile,
      pattern: "test",
      maxMatches: 2,
    });
    expect(result).toContain("共 2 个匹配项");
  });
});

describe("FileMoveTool", () => {
  let testDir: string;
  let sourceFile: string;
  let destFile: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `niuma-test-filemove-${process.pid}-${Date.now()}`,
    );
    sourceFile = join(testDir, "source.txt");
    destFile = join(testDir, "dest.txt");
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[FileMoveTool] 清理临时目录失败: ${testDir}`, error);
    }
  });

  it("应该成功移动文件", async () => {
    await fs.writeFile(sourceFile, "test content", "utf-8");
    const result = await fileMoveTool.execute({
      source: sourceFile,
      dest: destFile,
    });
    expect(result).toContain("成功移动文件");

    // 验证源文件已被删除
    await expect(readFileTool.execute({ path: sourceFile })).rejects.toThrow(
      ToolExecutionError,
    );
    // 验证目标文件存在
    const destContent = await readFileTool.execute({ path: destFile });
    expect(destContent).toBe("test content");
  });

  it("应该支持移动并重命名", async () => {
    await fs.writeFile(sourceFile, "test content", "utf-8");
    const newFile = join(testDir, "renamed.txt");
    await fileMoveTool.execute({ source: sourceFile, dest: newFile });
    const content = await readFileTool.execute({ path: newFile });
    expect(content).toBe("test content");
  });

  it("应该自动创建目标目录", async () => {
    await fs.writeFile(sourceFile, "test content", "utf-8");
    const nestedFile = join(testDir, "nested", "dir", "dest.txt");
    await fileMoveTool.execute({ source: sourceFile, dest: nestedFile });
    const content = await readFileTool.execute({ path: nestedFile });
    expect(content).toBe("test content");
  });

  it("应该抛出错误当源文件不存在", async () => {
    await expect(
      fileMoveTool.execute({ source: "/nonexistent/file.txt", dest: destFile }),
    ).rejects.toThrow(ToolExecutionError);
  });
});

describe("FileCopyTool", () => {
  let testDir: string;
  let sourceFile: string;
  let destFile: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `niuma-test-filecopy-${process.pid}-${Date.now()}`,
    );
    sourceFile = join(testDir, "source.txt");
    destFile = join(testDir, "dest.txt");
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[FileCopyTool] 清理临时目录失败: ${testDir}`, error);
    }
  });

  it("应该成功复制文件", async () => {
    await fs.writeFile(sourceFile, "test content", "utf-8");
    const result = await fileCopyTool.execute({
      source: sourceFile,
      dest: destFile,
    });
    expect(result).toContain("成功复制文件");

    // 验证源文件仍然存在
    const sourceContent = await readFileTool.execute({ path: sourceFile });
    expect(sourceContent).toBe("test content");
    // 验证目标文件存在
    const destContent = await readFileTool.execute({ path: destFile });
    expect(destContent).toBe("test content");
  });

  it("应该支持复制并重命名", async () => {
    await fs.writeFile(sourceFile, "test content", "utf-8");
    const newFile = join(testDir, "copied.txt");
    await fileCopyTool.execute({ source: sourceFile, dest: newFile });
    const content = await readFileTool.execute({ path: newFile });
    expect(content).toBe("test content");
  });

  it("应该自动创建目标目录", async () => {
    await fs.writeFile(sourceFile, "test content", "utf-8");
    const nestedFile = join(testDir, "nested", "dir", "dest.txt");
    await fileCopyTool.execute({ source: sourceFile, dest: nestedFile });
    const content = await readFileTool.execute({ path: nestedFile });
    expect(content).toBe("test content");
  });

  it("应该抛出错误当源文件不存在", async () => {
    await expect(
      fileCopyTool.execute({ source: "/nonexistent/file.txt", dest: destFile }),
    ).rejects.toThrow(ToolExecutionError);
  });
});

describe("FileDeleteTool", () => {
  let testDir: string;
  let testFile: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `niuma-test-filedelete-${process.pid}-${Date.now()}`,
    );
    testFile = join(testDir, "test.txt");
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[FileDeleteTool] 清理临时目录失败: ${testDir}`, error);
    }
  });

  it("应该成功删除文件（已确认）", async () => {
    await fs.writeFile(testFile, "test content", "utf-8");
    const result = await fileDeleteTool.execute({
      path: testFile,
      confirm: true,
    });
    expect(result).toContain("成功删除文件");

    // 验证文件已被删除
    await expect(readFileTool.execute({ path: testFile })).rejects.toThrow(
      ToolExecutionError,
    );
  });

  it("应该拒绝删除（未确认）", async () => {
    await fs.writeFile(testFile, "test content", "utf-8");
    await expect(
      fileDeleteTool.execute({ path: testFile, confirm: false }),
    ).rejects.toThrow(ToolExecutionError);
    await expect(
      fileDeleteTool.execute({ path: testFile, confirm: false }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该抛出错误当文件不存在", async () => {
    await expect(
      fileDeleteTool.execute({ path: "/nonexistent/file.txt", confirm: true }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该抛出错误当路径是目录", async () => {
    const testDir2 = join(testDir, "subdir");
    await fs.mkdir(testDir2, { recursive: true });
    await expect(
      fileDeleteTool.execute({ path: testDir2, confirm: true }),
    ).rejects.toThrow(ToolExecutionError);
  });
});

describe("FileInfoTool", () => {
  let testDir: string;
  let testFile: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `niuma-test-fileinfo-${process.pid}-${Date.now()}`,
    );
    testFile = join(testDir, "test.txt");
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[FileInfoTool] 清理临时目录失败: ${testDir}`, error);
    }
  });

  it("应该成功获取文件信息", async () => {
    const content = "test content";
    await fs.writeFile(testFile, content, "utf-8");
    const result = await fileInfoTool.execute({ path: testFile });
    const info = JSON.parse(result);

    expect(info.type).toBe("file");
    expect(info.isFile).toBe(true);
    expect(info.isDirectory).toBe(false);
    expect(info.size).toBe(content.length);
    expect(info.name).toBe("test.txt");
    expect(info.path).toBe(testFile);
  });

  it("应该成功获取目录信息", async () => {
    const result = await fileInfoTool.execute({ path: testDir });
    const info = JSON.parse(result);

    expect(info.type).toBe("directory");
    expect(info.isFile).toBe(false);
    expect(info.isDirectory).toBe(true);
  });

  it("应该抛出错误当路径不存在", async () => {
    await expect(
      fileInfoTool.execute({ path: "/nonexistent/path" }),
    ).rejects.toThrow(ToolExecutionError);
  });
});

describe("DirCreateTool", () => {
  let testDir: string;
  let testSubDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `niuma-test-dircreate-${process.pid}-${Date.now()}`,
    );
    testSubDir = join(testDir, "subdir");
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[DirCreateTool] 清理临时目录失败: ${testDir}`, error);
    }
  });

  it("应该成功创建单层目录", async () => {
    const result = await dirCreateTool.execute({
      path: testSubDir,
      recursive: false,
    });
    expect(result).toContain("成功创建目录");

    // 验证目录存在
    const info = await fileInfoTool.execute({ path: testSubDir });
    const parsed = JSON.parse(info);
    expect(parsed.isDirectory).toBe(true);
  });

  it("应该递归创建目录", async () => {
    const nestedDir = join(testDir, "nested", "deep", "dir");
    const result = await dirCreateTool.execute({
      path: nestedDir,
      recursive: true,
    });
    expect(result).toContain("成功创建目录");

    // 验证目录存在
    const info = await fileInfoTool.execute({ path: nestedDir });
    const parsed = JSON.parse(info);
    expect(parsed.isDirectory).toBe(true);
  });

  it("应该处理目录已存在的情况", async () => {
    await fs.mkdir(testSubDir, { recursive: true });
    const result = await dirCreateTool.execute({ path: testSubDir });
    expect(result).toContain("成功创建目录");
  });
});

describe("DirDeleteTool", () => {
  let testDir: string;
  let testSubDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `niuma-test-dirdelete-${process.pid}-${Date.now()}`,
    );
    testSubDir = join(testDir, "subdir");
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[DirDeleteTool] 清理临时目录失败: ${testDir}`, error);
    }
  });

  it("应该成功删除空目录（已确认）", async () => {
    await fs.mkdir(testSubDir, { recursive: true });
    const result = await dirDeleteTool.execute({
      path: testSubDir,
      confirm: true,
      recursive: false,
    });
    expect(result).toContain("成功删除目录");

    // 验证目录已被删除
    await expect(fileInfoTool.execute({ path: testSubDir })).rejects.toThrow(
      ToolExecutionError,
    );
  });

  it("应该递归删除目录（已确认）", async () => {
    const nestedFile = join(testSubDir, "file.txt");
    await fs.mkdir(testSubDir, { recursive: true });
    await fs.writeFile(nestedFile, "content", "utf-8");

    const result = await dirDeleteTool.execute({
      path: testSubDir,
      confirm: true,
      recursive: true,
    });
    expect(result).toContain("成功删除目录");

    // 验证目录已被删除
    await expect(fileInfoTool.execute({ path: testSubDir })).rejects.toThrow(
      ToolExecutionError,
    );
  });

  it("应该拒绝删除（未确认）", async () => {
    await fs.mkdir(testSubDir, { recursive: true });
    await expect(
      dirDeleteTool.execute({ path: testSubDir, confirm: false }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该抛出错误当目录不为空且不递归", async () => {
    const nestedFile = join(testSubDir, "file.txt");
    await fs.mkdir(testSubDir, { recursive: true });
    await fs.writeFile(nestedFile, "content", "utf-8");

    await expect(
      dirDeleteTool.execute({
        path: testSubDir,
        confirm: true,
        recursive: false,
      }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该抛出错误当目录不存在", async () => {
    await expect(
      dirDeleteTool.execute({ path: "/nonexistent/dir", confirm: true }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该抛出错误当路径是文件", async () => {
    const testFile = join(testDir, "file.txt");
    await fs.writeFile(testFile, "content", "utf-8");
    await expect(
      dirDeleteTool.execute({ path: testFile, confirm: true }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该拒绝删除受保护路径", async () => {
    // 尝试删除用户主目录（应该被拒绝）
    const homeDir = process.env.HOME || "/";
    await expect(
      dirDeleteTool.execute({ path: homeDir, confirm: true }),
    ).rejects.toThrow(ToolExecutionError);
  });
});
