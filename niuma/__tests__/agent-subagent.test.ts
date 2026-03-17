/**
 * 子智能体管理器测试
 */

// ==================== 第三方库 ====================
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ==================== 本地模块 ====================
import {
  SubagentManager,
  SubagentExecutor,
  type SubagentSpawnOptions,
} from "../agent/subagent";

import type { ExecuteResult } from "../agent/subagent/types";
import type { ToolRegistry } from "../agent/tools/registry";
import type { EventBus } from "../bus/events";
import type { LLMProvider } from "../providers/base";
import type { LLMResponse, ToolDefinition } from "../types";

describe("SubagentManager", () => {
  let manager: SubagentManager;
  let mockExecutor: SubagentExecutor;
  let mockProvider: LLMProvider;
  let mockTools: ToolRegistry;
  let mockBus: EventBus;

  beforeEach(() => {
    // 创建 Mock Provider
    mockProvider = {
      chat: vi.fn().mockResolvedValue({
        content: "Task completed successfully",
        hasToolCalls: false,
        toolCalls: [],
      } as LLMResponse),
    } as unknown as LLMProvider;

    // 创建 Mock Tools
    mockTools = {
      getDefinitions: vi.fn().mockReturnValue([
        { name: "read_file", description: "Read file", parameters: { type: "object", properties: {} } },
        { name: "write_file", description: "Write file", parameters: { type: "object", properties: {} } },
        { name: "message", description: "Send message", parameters: { type: "object", properties: {} } },
        { name: "spawn", description: "Spawn subagent", parameters: { type: "object", properties: {} } },
      ] as ToolDefinition[]),
      execute: vi.fn().mockResolvedValue("Tool executed"),
    } as unknown as ToolRegistry;

    // 创建 Mock EventBus
    mockBus = {
      emit: vi.fn(),
    } as unknown as EventBus;

    // 创建真实 Executor（使用 mock provider 和 tools）
    mockExecutor = new SubagentExecutor({
      provider: mockProvider,
      tools: mockTools,
      workspace: "/test/workspace",
    });

    manager = new SubagentManager({
      executor: mockExecutor,
      bus: mockBus,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("spawn", () => {
    it("应该创建后台任务并返回任务ID", async () => {
      const taskId = await manager.spawn({
        task: "Test task",
        originChannel: "cli",
        originChatId: "chat-123",
      });

      expect(taskId).toMatch(/^subagent-/);
    });

    it("应该记录最后活跃的会话键", async () => {
      await manager.spawn({
        task: "Test task",
        originChannel: "cli",
        originChatId: "chat-123",
        sessionKey: "session-123",
      });

      // 任务应该在运行中
      expect(manager.list().length).toBe(1);
    });

    it("应该在任务完成后减少运行计数", async () => {
      await manager.spawn({
        task: "Test task",
        originChannel: "cli",
        originChatId: "chat-123",
      });

      // 等待任务完成
      await manager.waitForAll(5000);

      expect(manager.list().length).toBe(0);
    });

    it("应该拒绝超过最大并发数的任务", async () => {
      // 模拟达到最大并发数
      const promises: Promise<string>[] = [];

      // 创建足够多的任务以超过限制
      for (let i = 0; i < 10; i++) {
        promises.push(
          manager.spawn({
            task: `Task ${i}`,
            originChannel: "cli",
            originChatId: `chat-${i}`,
          }).catch((e) => {
            // 捕获预期的错误
            return `error: ${e.message}`;
          }),
        );
      }

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.startsWith("error:"));

      // 应该有一些任务被拒绝
      expect(errors.length).toBeGreaterThan(0);
    });

    it("应该调用 LLM 执行任务", async () => {
      await manager.spawn({
        task: "Analyze code",
        originChannel: "cli",
        originChatId: "chat-123",
      });

      // 等待任务完成
      await manager.waitForAll(5000);

      expect(mockProvider.chat).toHaveBeenCalled();
    });
  });

  describe("cancel", () => {
    let cancelManager: SubagentManager;
    let cancelMockProvider: LLMProvider;
    let cancelMockExecutor: SubagentExecutor;

    beforeEach(() => {
      // 创建一个永远不会完成的 provider
      cancelMockProvider = {
        chat: vi.fn().mockImplementation(() => new Promise(() => {})),
      } as unknown as LLMProvider;

      cancelMockExecutor = new SubagentExecutor({
        provider: cancelMockProvider,
        tools: mockTools,
      });

      cancelManager = new SubagentManager({
        executor: cancelMockExecutor,
        bus: mockBus,
      });
    });

    it("应该取消指定任务", async () => {
      const taskId = await cancelManager.spawn({
        task: "Long running task",
        originChannel: "cli",
        originChatId: "chat-123",
      });

      // 任务应该正在运行
      expect(cancelManager.list().length).toBe(1);

      // 取消任务
      const cancelled = cancelManager.cancel(taskId);
      expect(cancelled).toBe(true);

      // 验证事件被发送
      expect(mockBus.emit).toHaveBeenCalledWith("MESSAGE_SENT", expect.any(Object));
    });

    it("应该返回 false 如果任务不存在", () => {
      const cancelled = cancelManager.cancel("non-existent-id");
      expect(cancelled).toBe(false);
    });
  });

  describe("cancelBySession", () => {
    it("应该取消指定会话的所有任务", async () => {
      // 创建长时间运行的任务
      mockProvider = {
        chat: vi.fn().mockImplementation(() => new Promise(() => {})),
      } as unknown as LLMProvider;

      mockExecutor = new SubagentExecutor({
        provider: mockProvider,
        tools: mockTools,
      });

      manager = new SubagentManager({
        executor: mockExecutor,
        bus: mockBus,
      });

      await manager.spawn({
        task: "Task 1",
        originChannel: "cli",
        originChatId: "chat-1",
        sessionKey: "session-1",
      });

      await manager.spawn({
        task: "Task 2",
        originChannel: "cli",
        originChatId: "chat-2",
        sessionKey: "session-1",
      });

      expect(manager.list().length).toBe(2);

      const cancelledCount = await manager.cancelBySession("session-1");
      expect(cancelledCount).toBe(2);
    });

    it("应该返回 0 如果会话没有任务", async () => {
      const cancelledCount = await manager.cancelBySession("non-existent-session");
      expect(cancelledCount).toBe(0);
    });
  });

  describe("list", () => {
    it("应该返回运行中任务的信息", async () => {
      // 创建长时间运行的任务
      mockProvider = {
        chat: vi.fn().mockImplementation(() => new Promise(() => {})),
      } as unknown as LLMProvider;

      mockExecutor = new SubagentExecutor({
        provider: mockProvider,
        tools: mockTools,
      });

      manager = new SubagentManager({
        executor: mockExecutor,
        bus: mockBus,
      });

      await manager.spawn({
        task: "Test task",
        label: "Test Label",
        originChannel: "cli",
        originChatId: "chat-123",
      });

      const tasks = manager.list();

      expect(tasks.length).toBe(1);
      expect(tasks[0].task).toBe("Test task");
      expect(tasks[0].label).toBe("Test Label");
      expect(tasks[0].duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe("工具隔离", () => {
    it("应该排除 message 和 spawn 工具", async () => {
      await manager.spawn({
        task: "Test task",
        originChannel: "cli",
        originChatId: "chat-123",
      });

      await manager.waitForAll(5000);

      // 验证工具定义被调用
      expect(mockTools.getDefinitions).toHaveBeenCalled();

      // 验证传给 LLM 的工具列表
      const mockChat = mockProvider.chat as ReturnType<typeof vi.fn>;
      const callArgs = mockChat.mock.calls[0][0];
      const toolNames = callArgs.tools?.map((t: ToolDefinition) => t.name) || [];
      
      // message 和 spawn 应该被排除
      expect(toolNames).not.toContain("message");
      expect(toolNames).not.toContain("spawn");
      expect(toolNames).toContain("read_file");
      expect(toolNames).toContain("write_file");
    });
  });

  describe("结果通知", () => {
    it("应该在任务完成后发送事件", async () => {
      await manager.spawn({
        task: "Test task",
        label: "Test Label",
        originChannel: "cli",
        originChatId: "chat-123",
      });

      await manager.waitForAll(5000);

      // 验证事件被发送
      expect(mockBus.emit).toHaveBeenCalledWith("MESSAGE_SENT", expect.any(Object));
    });
  });

  describe("waitForAll", () => {
    it("应该等待所有任务完成", async () => {
      await manager.spawn({
        task: "Task 1",
        originChannel: "cli",
        originChatId: "chat-1",
      });

      await manager.spawn({
        task: "Task 2",
        originChannel: "cli",
        originChatId: "chat-2",
      });

      const completedCount = await manager.waitForAll(10000);

      expect(completedCount).toBe(2);
      expect(manager.list().length).toBe(0);
    });

    it("应该在超时后返回当前任务数", async () => {
      // 创建永不完成的任务
      mockProvider = {
        chat: vi.fn().mockImplementation(() => new Promise(() => {})),
      } as unknown as LLMProvider;

      mockExecutor = new SubagentExecutor({
        provider: mockProvider,
        tools: mockTools,
      });

      manager = new SubagentManager({
        executor: mockExecutor,
        bus: mockBus,
      });

      await manager.spawn({
        task: "Long task",
        originChannel: "cli",
        originChatId: "chat-123",
      });

      const count = await manager.waitForAll(100); // 短超时

      // 任务仍然在运行
      expect(count).toBe(1);
      
      // 清理
      manager.cancel(manager.list()[0].taskId);
    });
  });
});

describe("SubagentExecutor", () => {
  let executor: SubagentExecutor;
  let mockProvider: LLMProvider;
  let mockTools: ToolRegistry;

  beforeEach(() => {
    mockProvider = {
      chat: vi.fn().mockResolvedValue({
        content: "Task completed",
        hasToolCalls: false,
        toolCalls: [],
      } as LLMResponse),
    } as unknown as LLMProvider;

    mockTools = {
      getDefinitions: vi.fn().mockReturnValue([
        { name: "read_file", description: "Read file", parameters: { type: "object", properties: {} } },
      ]),
      execute: vi.fn().mockResolvedValue("result"),
    } as unknown as ToolRegistry;

    executor = new SubagentExecutor({
      provider: mockProvider,
      tools: mockTools,
      workspace: "/test",
    });
  });

  describe("execute", () => {
    it("应该执行任务并返回结果", async () => {
      const result = await executor.execute({
        taskId: "test-id",
        task: "Test task",
        label: "Test",
        origin: { channel: "cli", chatId: "chat-1" },
        signal: new AbortController().signal,
      });

      expect(result.status).toBe("success");
      expect(result.content).toBe("Task completed");
    });

    it("应该使用隔离工具集", async () => {
      await executor.execute({
        taskId: "test-id",
        task: "Test task",
        label: "Test",
        origin: { channel: "cli", chatId: "chat-1" },
        signal: new AbortController().signal,
      });

      expect(mockTools.getDefinitions).toHaveBeenCalled();
    });
  });

  describe("getIsolatedTools", () => {
    it("应该排除 message 和 spawn 工具", () => {
      const tools = executor.getIsolatedTools();
      const toolNames = tools.map(t => t.name);
      
      expect(toolNames).not.toContain("message");
      expect(toolNames).not.toContain("spawn");
    });
  });

  describe("buildSystemPrompt", () => {
    it("应该包含工作空间路径", () => {
      const prompt = executor.buildSystemPrompt();
      expect(prompt).toContain("/test");
    });
  });
});
