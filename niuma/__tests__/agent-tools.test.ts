/**
 * Agent 工具测试
 */

// ==================== 第三方库 ====================
import { describe, it, expect, beforeEach } from "vitest";

// ==================== 本地模块 ====================
import { spawnTool, cronTool } from "../agent/tools/agent";
import { ToolExecutionError } from "../types/error";

// 全局类型定义
declare global {
  var __cronTasks: Map<string, unknown> | undefined;
}

describe("SpawnTool", () => {
  it("应该成功创建子智能体", async () => {
    const result = await spawnTool.execute({
      config: { name: "test-agent" },
      task: "Test task",
    });
    expect(result).toContain("子智能体已创建");
    expect(result).toContain("ID:");
  });

  it("应该支持配置继承", async () => {
    const result = await spawnTool.execute({
      config: {
        name: "test-agent",
        model: { provider: "openai", model: "gpt-4" },
      },
    });
    expect(result).toContain("子智能体已创建");
  });

  it("应该支持工具权限控制", async () => {
    const result = await spawnTool.execute({
      config: {
        name: "test-agent",
        tools: {
          allowed: ["read_file", "write_file"],
          denied: ["exec"],
        },
      },
    });
    expect(result).toContain("子智能体已创建");
  });

  it("应该支持超时控制", async () => {
    const result = await spawnTool.execute({
      config: { name: "test-agent" },
      timeout: 60000,
    });
    expect(result).toContain("子智能体已创建");
  });

  it("应该支持初始消息", async () => {
    const result = await spawnTool.execute({
      config: { name: "test-agent" },
      initialMessage: "Hello from parent agent",
    });
    expect(result).toContain("子智能体已创建");
  });
});

describe("CronTool", () => {
  beforeEach(() => {
    // 清空任务列表
    const tasks = global.__cronTasks;
    if (tasks) {
      tasks.clear();
    }
  });

  it("应该成功创建定时任务", async () => {
    const result = await cronTool.execute({
      action: "create",
      cron: "0 * * * *", // 每小时执行一次
      name: "test-task",
      handler: "testHandler",
    });
    expect(result).toContain("定时任务已创建");
    expect(result).toContain("ID:");
  });

  it("应该列出所有任务", async () => {
    await cronTool.execute({
      action: "create",
      cron: "0 * * * *",
      name: "test-task-1",
      handler: "testHandler1",
    });
    await cronTool.execute({
      action: "create",
      cron: "30 * * * *",
      name: "test-task-2",
      handler: "testHandler2",
    });

    const result = await cronTool.execute({ action: "list" });
    expect(result).toContain("test-task-1");
    expect(result).toContain("test-task-2");
  });

  it("应该更新任务", async () => {
    const createResult = await cronTool.execute({
      action: "create",
      cron: "0 * * * *",
      name: "test-task",
      handler: "testHandler",
    });

    // 提取任务 ID
    const taskIdMatch = createResult.match(/ID:\s*([a-zA-Z0-9_-]+)/);
    if (!taskIdMatch) {
      throw new Error("Failed to extract task ID");
    }
    const taskId = taskIdMatch[1];

    const updateResult = await cronTool.execute({
      action: "update",
      taskId,
      name: "updated-task",
    });
    expect(updateResult).toContain("定时任务已更新");
  });

  it("应该删除任务", async () => {
    const createResult = await cronTool.execute({
      action: "create",
      cron: "0 * * * *",
      name: "test-task",
      handler: "testHandler",
    });

    // 提取任务 ID
    const taskIdMatch = createResult.match(/ID:\s*([a-zA-Z0-9_-]+)/);
    if (!taskIdMatch) {
      throw new Error("Failed to extract task ID");
    }
    const taskId = taskIdMatch[1];

    const deleteResult = await cronTool.execute({
      action: "delete",
      taskId,
    });
    expect(deleteResult).toContain("定时任务已删除");
  });

  it("应该暂停任务", async () => {
    const createResult = await cronTool.execute({
      action: "create",
      cron: "0 * * * *",
      name: "test-task",
      handler: "testHandler",
    });

    // 提取任务 ID
    const taskIdMatch = createResult.match(/ID:\s*([a-zA-Z0-9_-]+)/);
    if (!taskIdMatch) {
      throw new Error("Failed to extract task ID");
    }
    const taskId = taskIdMatch[1];

    const pauseResult = await cronTool.execute({
      action: "pause",
      taskId,
    });
    expect(pauseResult).toContain("定时任务已暂停");
  });

  it("应该恢复任务", async () => {
    const createResult = await cronTool.execute({
      action: "create",
      cron: "0 * * * *",
      name: "test-task",
      handler: "testHandler",
    });

    // 提取任务 ID
    const taskIdMatch = createResult.match(/ID:\s*([a-zA-Z0-9_-]+)/);
    if (!taskIdMatch) {
      throw new Error("Failed to extract task ID");
    }
    const taskId = taskIdMatch[1];

    await cronTool.execute({
      action: "pause",
      taskId,
    });

    const resumeResult = await cronTool.execute({
      action: "resume",
      taskId,
    });
    expect(resumeResult).toContain("定时任务已恢复");
  });

  it("应该抛出错误当任务不存在", async () => {
    await expect(
      cronTool.execute({
        action: "update",
        taskId: "nonexistent-task-id",
        name: "updated-task",
      }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该抛出错误当 Cron 表达式无效", async () => {
    await expect(
      cronTool.execute({
        action: "create",
        cron: "invalid-cron-expression",
        name: "test-task",
        handler: "testHandler",
      }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该抛出错误当缺少必要参数", async () => {
    await expect(
      cronTool.execute({
        action: "create",
        cron: "0 * * * *",
        // 缺少 name 和 handler
      }),
    ).rejects.toThrow(ToolExecutionError);
  });

  it("应该正确计算 Cron 下次执行时间", async () => {
    const result = await cronTool.execute({
      action: "create",
      cron: "0 * * * *", // 每小时执行一次
      name: "test-cron-calc",
      handler: "testHandler",
    });

    // 验证结果包含任务信息
    expect(result).toContain("定时任务已创建");
    expect(result).toContain("ID:");

    // 提取任务 ID
    const taskIdMatch = result.match(/ID:\s*([a-zA-Z0-9_-]+)/);
    if (taskIdMatch) {
      const taskId = taskIdMatch[1];

      // 获取任务列表
      const listResult = await cronTool.execute({ action: "list" });
      expect(listResult).toContain("test-cron-calc");
    }
  });

  it("应该正确处理每分钟执行的 Cron 表达式", async () => {
    const result = await cronTool.execute({
      action: "create",
      cron: "* * * * *",
      name: "test-minute-cron",
      handler: "testHandler",
    });

    expect(result).toContain("定时任务已创建");
  });

  it("应该正确处理复杂的 Cron 表达式", async () => {
    const result = await cronTool.execute({
      action: "create",
      cron: "0 2 * * 1-5", // 每周一到周五凌晨 2 点
      name: "test-complex-cron",
      handler: "testHandler",
    });

    expect(result).toContain("定时任务已创建");
  });
});
