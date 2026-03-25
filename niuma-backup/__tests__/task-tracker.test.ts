/**
 * 任务追踪器测试
 */

import { existsSync } from "fs";
import { rm } from "fs/promises";
import { join } from "path";

import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { TaskTracker } from "../agent/task-tracker";

describe("TaskTracker", () => {
  const testWorkspace = "/tmp/task-tracker-test";
  let tracker: TaskTracker;

  beforeEach(async () => {
    tracker = new TaskTracker({
      workspace: testWorkspace,
      projectName: "test-project",
    });
    await tracker.initialize();
  });

  afterEach(async () => {
    try {
      await rm(join(testWorkspace, "PROGRESS.json"), { force: true });
      await rm(join(testWorkspace, "PROGRESS.json.backup"), { force: true });
    } catch {
      // 忽略清理错误
    }
  });

  describe("初始化", () => {
    it("应该成功初始化", async () => {
      expect(tracker).toBeDefined();
      const tasks = await tracker.getAllTasks();
      expect(tasks).toEqual([]);
    });

    it("应该创建 PROGRESS.json 文件", async () => {
      await tracker.createTask({ name: "测试任务" });
      const progressFile = join(testWorkspace, "PROGRESS.json");
      expect(existsSync(progressFile)).toBe(true);
    });
  });

  describe("任务创建", () => {
    it("应该创建单个任务", async () => {
      const task = await tracker.createTask({
        name: "测试任务",
        description: "测试描述",
      });

      expect(task.id).toBeDefined();
      expect(task.name).toBe("测试任务");
      expect(task.description).toBe("测试描述");
      expect(task.status).toBe("pending");
    });

    it("应该批量创建任务", async () => {
      const tasks = await tracker.createTasks([
        { name: "任务1" },
        { name: "任务2" },
        { name: "任务3" },
      ]);

      expect(tasks).toHaveLength(3);
      expect(tasks[0].name).toBe("任务1");
    });
  });

  describe("任务状态更新", () => {
    it("应该开始任务", async () => {
      const task = await tracker.createTask({ name: "测试" });
      const updated = await tracker.startTask(task.id);

      expect(updated?.status).toBe("in_progress");
    });

    it("应该完成任务", async () => {
      const task = await tracker.createTask({ name: "测试" });
      await tracker.startTask(task.id);
      const updated = await tracker.completeTask(task.id);

      expect(updated?.status).toBe("completed");
    });

    it("应该失败任务", async () => {
      const task = await tracker.createTask({ name: "测试" });
      const updated = await tracker.failTask(task.id);

      expect(updated?.status).toBe("failed");
    });
  });

  describe("任务查询", () => {
    beforeEach(async () => {
      await tracker.createTasks([
        { name: "任务1" },
        { name: "任务2" },
        { name: "任务3" },
      ]);

      const tasks = await tracker.getAllTasks();
      await tracker.startTask(tasks[0].id);
      await tracker.completeTask(tasks[0].id);
      await tracker.startTask(tasks[1].id);
    });

    it("应该获取所有任务", async () => {
      const tasks = await tracker.getAllTasks();
      expect(tasks).toHaveLength(3);
    });

    it("应该获取待处理任务", async () => {
      const tasks = await tracker.getPendingTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toBe("任务3");
    });

    it("应该获取已完成任务", async () => {
      const tasks = await tracker.getCompletedTasks();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toBe("任务1");
    });

    it("应该获取下一个待处理任务", async () => {
      const task = await tracker.getNextPendingTask();
      expect(task).toBeDefined();
      expect(task?.name).toBe("任务2");
    });
  });

  describe("进度追踪", () => {
    it("应该正确计算进度", async () => {
      await tracker.createTasks([
        { name: "任务1" },
        { name: "任务2" },
        { name: "任务3" },
      ]);

      let progress = await tracker.getProgress();
      expect(progress).toEqual({ completed: 0, total: 3, percentage: 0 });

      const tasks = await tracker.getAllTasks();
      await tracker.completeTask(tasks[0].id);

      progress = await tracker.getProgress();
      expect(progress).toEqual({ completed: 1, total: 3, percentage: 33 });

      await tracker.completeTask(tasks[1].id);

      progress = await tracker.getProgress();
      expect(progress).toEqual({ completed: 2, total: 3, percentage: 67 });
    });

    it("应该正确判断完成状态", async () => {
      await tracker.createTasks([
        { name: "任务1" },
        { name: "任务2" },
      ]);

      let isComplete = await tracker.isComplete();
      expect(isComplete).toBe(false);

      const tasks = await tracker.getAllTasks();
      await tracker.completeTask(tasks[0].id);
      await tracker.completeTask(tasks[1].id);

      isComplete = await tracker.isComplete();
      expect(isComplete).toBe(true);
    });
  });
});
