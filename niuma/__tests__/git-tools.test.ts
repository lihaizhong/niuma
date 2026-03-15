/**
 * Git 工具测试
 */

// ==================== 内置库 ====================
import { tmpdir } from "os";
import { join } from "path";
import { execSync } from "child_process";

// ==================== 第三方库 ====================
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";

// ==================== 本地模块 ====================
import {
  gitStatusTool,
  gitCommitTool,
  gitPushTool,
  gitPullTool,
  gitBranchTool,
  gitLogTool,
} from "../agent/tools/git";
import { ToolExecutionError } from "../types/error";

describe("Git Tools", () => {
  let testRepoPath: string;
  let testRepoCounter = 0;

  beforeEach(() => {
    // 创建临时测试仓库（使用测试计数器避免命名冲突）
    testRepoCounter++;
    testRepoPath = join(
      tmpdir(),
      `niuma-git-test-${process.pid}-${testRepoCounter}`,
    );
    fs.mkdirSync(testRepoPath, { recursive: true });

    // 初始化 Git 仓库
    execSync("git init", { cwd: testRepoPath });
    execSync('git config user.name "Test User"', { cwd: testRepoPath });
    execSync('git config user.email "test@example.com"', { cwd: testRepoPath });

    // 创建初始提交
    fs.writeFileSync(join(testRepoPath, "README.md"), "# Test Repository");
    execSync("git add README.md", { cwd: testRepoPath });
    execSync('git commit -m "Initial commit"', { cwd: testRepoPath });
  });

  afterEach(() => {
    // 清理测试仓库
    try {
      if (testRepoPath && fs.existsSync(testRepoPath)) {
        fs.rmSync(testRepoPath, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn(`[Git Tools] 清理临时目录失败: ${testRepoPath}`, error);
    }
  });

  describe("gitStatusTool", () => {
    it("应该在非 Git 目录中返回错误", async () => {
      // 创建临时目录
      const nonGitPath = join(
        tmpdir(),
        `niuma-non-git-${process.pid}-${Date.now()}`,
      );
      fs.mkdirSync(nonGitPath, { recursive: true });

      // 修改工作目录
      const originalCwd = process.cwd();
      process.chdir(nonGitPath);

      try {
        await expect(gitStatusTool.execute({})).rejects.toThrow(
          ToolExecutionError,
        );
        await expect(gitStatusTool.execute({})).rejects.toThrow(
          "不是 Git 仓库",
        );
      } finally {
        process.chdir(originalCwd);
        // 清理临时目录
        try {
          fs.rmSync(nonGitPath, { recursive: true, force: true });
        } catch (error) {
          console.warn(
            `[gitStatusTool] 清理临时目录失败: ${nonGitPath}`,
            error,
          );
        }
      }
    });

    it("应该在干净的 Git 仓库中返回正确状态", async () => {
      const originalCwd = process.cwd();
      process.chdir(testRepoPath);

      try {
        const result = await gitStatusTool.execute({});
        expect(result).toContain("工作区干净");
      } finally {
        process.chdir(originalCwd);
      }
    });

    it("应该显示修改的文件", async () => {
      const originalCwd = process.cwd();
      process.chdir(testRepoPath);

      try {
        // 创建一个测试文件
        fs.writeFileSync(join(testRepoPath, "test.txt"), "test content");

        const result = await gitStatusTool.execute({});
        expect(result).toContain("test.txt");
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe("gitCommitTool", () => {
    it("应该在提交消息为空时返回错误", async () => {
      const originalCwd = process.cwd();
      process.chdir(testRepoPath);

      try {
        await expect(gitCommitTool.execute({ message: "" })).rejects.toThrow(
          ToolExecutionError,
        );
        await expect(gitCommitTool.execute({ message: "" })).rejects.toThrow(
          "提交消息不能为空",
        );
      } finally {
        process.chdir(originalCwd);
      }
    });

    it("应该在无暂存更改时返回错误", async () => {
      const originalCwd = process.cwd();
      process.chdir(testRepoPath);

      try {
        await expect(
          gitCommitTool.execute({ message: "test commit" }),
        ).rejects.toThrow(ToolExecutionError);
        await expect(
          gitCommitTool.execute({ message: "test commit" }),
        ).rejects.toThrow("没有暂存的更改");
      } finally {
        process.chdir(originalCwd);
      }
    });

    it("应该成功创建提交", async () => {
      const originalCwd = process.cwd();
      process.chdir(testRepoPath);

      try {
        // 创建并暂存文件
        fs.writeFileSync(join(testRepoPath, "test.txt"), "test content");
        execSync("git add test.txt", { cwd: testRepoPath });

        // 提交
        const result = await gitCommitTool.execute({ message: "test commit" });
        expect(result).toContain("提交成功");
        expect(result).toContain("提交哈希");
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe("gitBranchTool", () => {
    it("应该列出所有分支", async () => {
      const originalCwd = process.cwd();
      process.chdir(testRepoPath);

      try {
        // 创建测试分支
        execSync("git branch test-branch", { cwd: testRepoPath });

        const result = await gitBranchTool.execute({ operation: "list" });
        expect(result).toContain("所有分支");
        expect(result).toContain("test-branch");
        expect(result).toContain("(当前)");
      } finally {
        process.chdir(originalCwd);
      }
    });

    it("应该创建新分支", async () => {
      const originalCwd = process.cwd();
      process.chdir(testRepoPath);

      try {
        const result = await gitBranchTool.execute({
          operation: "create",
          name: "new-branch",
        });
        expect(result).toContain("成功创建分支");
        expect(result).toContain("new-branch");
      } finally {
        process.chdir(originalCwd);
      }
    });

    it("应该在分支已存在时返回错误", async () => {
      const originalCwd = process.cwd();
      process.chdir(testRepoPath);

      try {
        // 创建分支
        execSync("git branch existing-branch", { cwd: testRepoPath });

        // 尝试创建同名分支
        await expect(
          gitBranchTool.execute({
            operation: "create",
            name: "existing-branch",
          }),
        ).rejects.toThrow(ToolExecutionError);
        await expect(
          gitBranchTool.execute({
            operation: "create",
            name: "existing-branch",
          }),
        ).rejects.toThrow("已存在");
      } finally {
        process.chdir(originalCwd);
      }
    });

    it("应该删除分支", async () => {
      const originalCwd = process.cwd();
      process.chdir(testRepoPath);

      try {
        // 创建分支
        execSync("git branch to-delete", { cwd: testRepoPath });

        // 删除分支
        const result = await gitBranchTool.execute({
          operation: "delete",
          name: "to-delete",
        });
        expect(result).toContain("成功删除分支");
        expect(result).toContain("to-delete");
      } finally {
        process.chdir(originalCwd);
      }
    });

    it("应该在删除当前分支时返回错误", async () => {
      const originalCwd = process.cwd();
      process.chdir(testRepoPath);

      try {
        // 获取当前分支名
        const currentBranch = execSync("git branch --show-current", {
          cwd: testRepoPath,
        })
          .toString()
          .trim();

        // 尝试删除当前分支
        await expect(
          gitBranchTool.execute({ operation: "delete", name: currentBranch }),
        ).rejects.toThrow(ToolExecutionError);
        await expect(
          gitBranchTool.execute({ operation: "delete", name: currentBranch }),
        ).rejects.toThrow("无法删除当前分支");
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe("gitLogTool", () => {
    it("应该在非 Git 目录中返回错误", async () => {
      // 创建临时目录
      const nonGitPath = join(
        tmpdir(),
        `niuma-non-git-${process.pid}-${Date.now()}`,
      );
      fs.mkdirSync(nonGitPath, { recursive: true });

      const originalCwd = process.cwd();
      process.chdir(nonGitPath);

      try {
        await expect(gitLogTool.execute({ count: 10 })).rejects.toThrow(
          ToolExecutionError,
        );
        await expect(gitLogTool.execute({ count: 10 })).rejects.toThrow(
          "不是 Git 仓库",
        );
      } finally {
        process.chdir(originalCwd);
        // 清理临时目录
        try {
          fs.rmSync(nonGitPath, { recursive: true, force: true });
        } catch (error) {
          console.warn(`[gitLogTool] 清理临时目录失败: ${nonGitPath}`, error);
        }
      }
    });

    it("应该显示提交历史", async () => {
      const originalCwd = process.cwd();
      process.chdir(testRepoPath);

      try {
        // 创建并提交文件
        fs.writeFileSync(join(testRepoPath, "test.txt"), "test content");
        execSync("git add test.txt", { cwd: testRepoPath });
        execSync('git commit -m "test commit"', { cwd: testRepoPath });

        // 获取日志
        const result = await gitLogTool.execute({ count: 10 });
        expect(result).toContain("提交历史");
        expect(result).toContain("test commit");
      } finally {
        process.chdir(originalCwd);
      }
    });

    it("应该限制显示的提交数量", async () => {
      const originalCwd = process.cwd();
      process.chdir(testRepoPath);

      try {
        // 创建多个提交
        for (let i = 0; i < 5; i++) {
          fs.writeFileSync(join(testRepoPath, `test${i}.txt`), `content${i}`);
          execSync("git add .", { cwd: testRepoPath });
          execSync(`git commit -m "commit ${i}"`, { cwd: testRepoPath });
        }

        // 只显示 2 条提交
        const result = await gitLogTool.execute({ count: 2 });
        expect(result).toContain("提交历史");
        expect(result).toContain("还有"); // 应该显示还有更多提交
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe("gitPushTool", () => {
    it("应该在远程不存在时返回错误（模拟）", async () => {
      const originalCwd = process.cwd();
      process.chdir(testRepoPath);

      try {
        // 由于没有实际的远程仓库，这个测试会失败
        // 但我们可以验证错误处理
        await expect(
          gitPushTool.execute({ remote: "nonexistent-remote" }),
        ).rejects.toThrow(ToolExecutionError);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe("gitPullTool", () => {
    it("应该在远程不存在时返回错误（模拟）", async () => {
      const originalCwd = process.cwd();
      process.chdir(testRepoPath);

      try {
        // 由于没有实际的远程仓库，这个测试会失败
        // 但我们可以验证错误处理
        await expect(
          gitPullTool.execute({ remote: "nonexistent-remote" }),
        ).rejects.toThrow(ToolExecutionError);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});
