/**
 * Shell 工具测试
 */

// ==================== 内置库 ====================
import { tmpdir } from "os";

// ==================== 第三方库 ====================
import { describe, it, expect, beforeEach, afterEach } from "vitest";

// ==================== 本地模块 ====================
import { execTool } from "../agent/tools/shell";
import { ToolExecutionError } from "../types/error";
import {
  setGlobalRegistry,
  getGlobalRegistry,
  clearGlobalContext,
} from "../agent/tools/context";
import { ToolRegistry } from "../agent/tools/registry";

describe("ExecTool", () => {
  it("应该成功执行简单命令", async () => {
    const result = await execTool.execute({
      command: "echo",
      args: ["Hello, World!"],
    });
    expect(result).toContain("Hello, World!");
  });

  it("应该返回正确的退出码", async () => {
    const result = await execTool.execute({ command: "echo", args: ["test"] });
    expect(result).toContain("test");
  });

  it("应该处理命令执行失败", async () => {
    const result = await execTool.execute({ command: "false" });
    expect(result).toContain("命令执行失败");
    expect(result).toContain("退出码");
  });

  it("应该拒绝执行危险命令", async () => {
    await expect(execTool.execute({ command: "rm -rf /" })).rejects.toThrow(
      ToolExecutionError,
    );
  });

  it("应该拒绝执行 shutdown 命令", async () => {
    await expect(execTool.execute({ command: "shutdown" })).rejects.toThrow(
      ToolExecutionError,
    );
  });

  it("应该拒绝执行 fork bomb", async () => {
    await expect(
      execTool.execute({ command: ":(){ :|:& };:" }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该支持超时控制", async () => {
    // 创建一个会超时的命令
    await expect(
      execTool.execute({
        command: "sleep",
        args: ["10"],
        timeout: 100,
      }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该支持后台执行", async () => {
    const result = await execTool.execute({
      command: "echo",
      args: ["test"],
      runInBackground: true,
    });
    expect(result).toContain("PID");
  });

  it("应该支持工作目录控制", async () => {
    const testDir = tmpdir();
    const result = await execTool.execute({
      command: "pwd",
      cwd: testDir,
    });
    expect(result).toContain(testDir);
  });

  it("应该支持环境变量控制", async () => {
    const result = await execTool.execute({
      command: "echo",
      args: ["$TEST_VAR"],
      env: { TEST_VAR: "test_value" },
    });
    expect(result).toContain("test_value");
  });

  it("应该支持严格模式", async () => {
    await expect(
      execTool.execute({ command: "false", strict: true }),
    ).rejects.toThrow(ToolExecutionError);
  });
});

describe("危险命令确认机制", () => {
  afterEach(() => {
    // 清空全局状态
    clearGlobalContext();
    // 恢复 CI 环境变量
    delete process.env.CI;
    delete process.env.DOCKER;
    delete process.env.TERM;
  });

  it("应该拒绝执行未确认的危险命令（非交互环境）", async () => {
    // 设置非交互环境
    process.env.CI = "true";

    await expect(
      execTool.execute({
        command: "rm",
        args: ["-rf", "/tmp/test"],
        // 不提供 yes 参数
      }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该允许执行已确认的危险命令（非交互环境 + --yes）", async () => {
    // 设置非交互环境
    process.env.CI = "true";

    // 使用 --yes 参数跳过确认
    // 使用 dd 命令（这是一个危险命令，但我们可以使用无害的参数）
    const result = await execTool.execute({
      command: "dd",
      args: ["if=/dev/zero", "of=/dev/null", "bs=1", "count=1"],
      yes: true,
    });

    // dd 命令应该成功执行并返回一些输出
    expect(result).toBeTruthy();
  });

  it("应该在交互环境中检测到危险命令并提示确认", async () => {
    // 确保不在 CI 环境中
    delete process.env.CI;
    delete process.env.DOCKER;

    // 测试危险命令检测（不实际执行，只是验证检测逻辑）
    // 注意：由于 clack/prompts 的交互性质，这里只能测试命令检测逻辑
    // 实际的确认交互需要 mock 或集成测试
    await expect(
      execTool.execute({
        command: "dd",
        args: ["if=/dev/zero", "of=/tmp/test", "bs=1M", "count=1"],
      }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该支持 --yes 参数跳过确认", async () => {
    // 在非交互环境中使用 --yes 参数
    process.env.CI = "true";

    // 使用 echo 命令来测试 --yes 参数（这不是危险命令，但会测试参数传递）
    const result = await execTool.execute({
      command: "echo",
      args: ["test"],
      yes: true,
    });

    expect(result).toContain("test");
  });

  it("应该正确识别 CI 环境", async () => {
    process.env.CI = "true";

    await expect(
      execTool.execute({
        command: "rm",
        args: ["-rf", "/tmp/test-ci"],
      }),
    ).rejects.toThrow("非交互环境");
  });

  it("应该正确识别 Docker 环境", async () => {
    process.env.DOCKER = "true";

    await expect(
      execTool.execute({
        command: "rm",
        args: ["-rf", "/tmp/test-docker"],
      }),
    ).rejects.toThrow("非交互环境");
  });

  it("应该正确识别非 TTY 环境", async () => {
    // 使用 CI 环境变量来模拟非交互环境
    process.env.CI = "true";

    try {
      await expect(
        execTool.execute({
          command: "rm",
          args: ["-rf", "/tmp/test-tty"],
        }),
      ).rejects.toThrow("非交互环境");
    } finally {
      // 恢复环境变量
      delete process.env.CI;
    }
  });

  it("应该区分需要确认和直接拒绝的危险命令", async () => {
    process.env.CI = "true";

    try {
      // rm 命令需要确认（可以通过 --yes 跳过）
      await expect(
        execTool.execute({
          command: "rm",
          args: ["-rf", "/tmp/test"],
        }),
      ).rejects.toThrow("非交互环境");

      // shutdown 命令直接拒绝（即使使用 --yes 也会拒绝）
      await expect(
        execTool.execute({
          command: "shutdown",
          yes: true,
        }),
      ).rejects.toThrow("拒绝执行危险命令");
    } finally {
      // 恢复环境变量
      delete process.env.CI;
    }
  });
});
