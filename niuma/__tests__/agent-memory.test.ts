/**
 * 记忆系统测试
 */

// ==================== 内置库 ====================
import { join } from "path";
import { tmpdir } from "os";
import fs from "fs-extra";

// ==================== 第三方库 ====================
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ==================== 本地模块 ====================
import { MemoryStore, SAVE_MEMORY_TOOL } from "../agent/memory";
import type { Session, SessionMessage } from "../session/manager";
import type { LLMProvider, LLMResponse } from "../providers/base";

describe("MemoryStore", () => {
  let store: MemoryStore;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `niuma-memory-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    store = new MemoryStore(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe("appendHistory", () => {
    it("应该追加历史条目", async () => {
      await store.appendHistory("[2024-01-01 10:00] Test event happened.");

      const historyPath = join(tempDir, "memory", "HISTORY.md");
      const content = await fs.readFile(historyPath, "utf-8");

      expect(content).toContain("Test event happened.");
    });

    it("应该追加多个条目", async () => {
      await store.appendHistory("First entry");
      await store.appendHistory("Second entry");

      const historyPath = join(tempDir, "memory", "HISTORY.md");
      const content = await fs.readFile(historyPath, "utf-8");

      expect(content).toContain("First entry");
      expect(content).toContain("Second entry");
    });

    it("应该修剪尾部空白", async () => {
      await store.appendHistory("  Entry with spaces   ");

      const historyPath = join(tempDir, "memory", "HISTORY.md");
      const content = await fs.readFile(historyPath, "utf-8");

      expect(content).toContain("Entry with spaces\n\n");
    });
  });

  describe("getMemoryContext", () => {
    it("应该返回空字符串当没有记忆时", async () => {
      const context = await store.getMemoryContext();
      expect(context).toBe("");
    });

    it("应该返回格式化的记忆上下文", async () => {
      // 创建记忆文件
      const memoryPath = join(tempDir, "memory", "MEMORY.md");
      await fs.ensureDir(join(tempDir, "memory"));
      await fs.writeFile(memoryPath, "# User Preferences\n- Likes dark mode", "utf-8");

      const context = await store.getMemoryContext();

      expect(context).toContain("## Long-term Memory");
      expect(context).toContain("User Preferences");
    });
  });

  describe("consolidate", () => {
    const createMockProvider = (response: Partial<LLMResponse> = {}): LLMProvider => {
      return {
        chat: vi.fn().mockResolvedValue({
          content: "Consolidated memory",
          hasToolCalls: true,
          toolCalls: [
            {
              id: "call-1",
              name: "save_memory",
              arguments: {
                history_entry: "[2024-01-01] User prefers dark mode.",
                memory_update: "# User Preferences\n- Dark mode enabled",
              },
            },
          ],
          ...response,
        } as LLMResponse),
      } as unknown as LLMProvider;
    };

    const createMockSession = (messages: Partial<SessionMessage>[] = []): Session => {
      return {
        key: "test-session",
        messages: messages.map((m, i) => ({
          role: m.role ?? "user",
          content: m.content ?? `Message ${i}`,
          timestamp: m.timestamp ?? new Date().toISOString(),
          toolsUsed: m.toolsUsed,
        })),
        lastConsolidated: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    };

    it("应该在消息不足时跳过整合", async () => {
      const provider = createMockProvider();
      const session = createMockSession([{ role: "user", content: "Hello" }]);

      const result = await store.consolidate({
        session,
        provider,
        model: "gpt-4",
        memoryWindow: 10,
      });

      expect(result).toBe(true);
      expect(provider.chat).not.toHaveBeenCalled();
    });

    it("应该调用 LLM 进行记忆整合", async () => {
      const provider = createMockProvider();
      const messages: Partial<SessionMessage>[] = [];
      for (let i = 0; i < 10; i++) {
        messages.push({ role: i % 2 === 0 ? "user" : "assistant", content: `Message ${i}` });
      }
      const session = createMockSession(messages);

      const result = await store.consolidate({
        session,
        provider,
        model: "gpt-4",
        memoryWindow: 4, // 只保留 2 条消息
      });

      expect(result).toBe(true);
      expect(provider.chat).toHaveBeenCalledTimes(1);
    });

    it("应该保存历史条目和记忆更新", async () => {
      const provider = createMockProvider();
      const messages: Partial<SessionMessage>[] = [];
      for (let i = 0; i < 10; i++) {
        messages.push({ role: i % 2 === 0 ? "user" : "assistant", content: `Message ${i}` });
      }
      const session = createMockSession(messages);

      await store.consolidate({
        session,
        provider,
        model: "gpt-4",
        memoryWindow: 4,
      });

      // 检查历史文件
      const historyPath = join(tempDir, "memory", "HISTORY.md");
      const historyContent = await fs.readFile(historyPath, "utf-8");
      expect(historyContent).toContain("User prefers dark mode");

      // 检查记忆文件
      const memoryPath = join(tempDir, "memory", "MEMORY.md");
      const memoryContent = await fs.readFile(memoryPath, "utf-8");
      expect(memoryContent).toContain("Dark mode enabled");
    });

    it("应该处理 LLM 未调用工具的情况", async () => {
      const provider = createMockProvider({
        hasToolCalls: false,
        toolCalls: undefined,
      });
      const messages: Partial<SessionMessage>[] = [];
      for (let i = 0; i < 10; i++) {
        messages.push({ role: i % 2 === 0 ? "user" : "assistant", content: `Message ${i}` });
      }
      const session = createMockSession(messages);

      const result = await store.consolidate({
        session,
        provider,
        model: "gpt-4",
        memoryWindow: 4,
      });

      expect(result).toBe(false);
    });

    it("应该处理全量归档模式", async () => {
      const provider = createMockProvider();
      const session = createMockSession([
        { role: "user", content: "Message 1" },
        { role: "assistant", content: "Response 1" },
      ]);

      const result = await store.consolidate({
        session,
        provider,
        model: "gpt-4",
        memoryWindow: 4,
        archiveAll: true,
      });

      expect(result).toBe(true);
      expect(provider.chat).toHaveBeenCalled();
    });

    it("应该处理工具调用参数为字符串格式", async () => {
      const provider: LLMProvider = {
        chat: vi.fn().mockResolvedValue({
          content: "Consolidated",
          hasToolCalls: true,
          toolCalls: [
            {
              id: "call-1",
              name: "save_memory",
              arguments: JSON.stringify({
                history_entry: "Test entry",
                memory_update: "Test memory",
              }),
            },
          ],
        } as LLMResponse),
      } as unknown as LLMProvider;

      const messages: Partial<SessionMessage>[] = [];
      for (let i = 0; i < 10; i++) {
        messages.push({ role: "user", content: `Message ${i}` });
      }
      const session = createMockSession(messages);

      const result = await store.consolidate({
        session,
        provider,
        model: "gpt-4",
        memoryWindow: 4,
      });

      expect(result).toBe(true);
    });

    it("应该更新会话的 lastConsolidated", async () => {
      const provider = createMockProvider();
      const messages: Partial<SessionMessage>[] = [];
      for (let i = 0; i < 10; i++) {
        messages.push({ role: "user", content: `Message ${i}` });
      }
      const session = createMockSession(messages);
      expect(session.lastConsolidated).toBe(0);

      await store.consolidate({
        session,
        provider,
        model: "gpt-4",
        memoryWindow: 4,
      });

      expect(session.lastConsolidated).toBeGreaterThan(0);
    });
  });

  describe("SAVE_MEMORY_TOOL 定义", () => {
    it("应该有正确的工具名称", () => {
      expect(SAVE_MEMORY_TOOL.name).toBe("save_memory");
    });

    it("应该定义必需的参数", () => {
      const props = SAVE_MEMORY_TOOL.parameters.properties;
      expect(props).toHaveProperty("history_entry");
      expect(props).toHaveProperty("memory_update");
      expect(SAVE_MEMORY_TOOL.parameters.required).toContain("history_entry");
      expect(SAVE_MEMORY_TOOL.parameters.required).toContain("memory_update");
    });
  });
});
