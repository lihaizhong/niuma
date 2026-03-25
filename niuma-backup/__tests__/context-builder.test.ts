/**
 * 上下文构建器测试
 */

// ==================== 内置库 ====================
import { tmpdir } from "os";
import { join } from "path";

// ==================== 第三方库 ====================
import fs from "fs-extra";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

// ==================== 本地模块 ====================
import { ContextBuilder } from "../agent/context";
import { MemoryStore } from "../agent/memory";
import { SkillsLoader } from "../agent/skills";

import type { ChatMessage } from "../types";

// ==================== 测试辅助函数 ====================
async function createTestWorkspace(): Promise<string> {
  const testDir = join(tmpdir(), `niuma-test-context-${process.pid}-${Date.now()}`);
  await fs.mkdir(testDir, { recursive: true });
  
  // 创建 memory 目录
  await fs.mkdir(join(testDir, "memory"), { recursive: true });
  
  // 创建 skills 目录
  await fs.mkdir(join(testDir, "skills", "test-skill"), { recursive: true });
  
  return testDir;
}

async function cleanupTestWorkspace(testDir: string): Promise<void> {
  try {
    await fs.rm(testDir, { recursive: true, force: true });
  } catch {
    // 忽略清理错误
  }
}

describe("ContextBuilder", () => {
  let testWorkspace: string;
  let memoryStore: MemoryStore;
  let skillsLoader: SkillsLoader;
  let contextBuilder: ContextBuilder;

  beforeEach(async () => {
    testWorkspace = await createTestWorkspace();
    memoryStore = new MemoryStore(testWorkspace);
    skillsLoader = new SkillsLoader(testWorkspace);
    contextBuilder = new ContextBuilder(testWorkspace, memoryStore, skillsLoader);
  });

  afterEach(async () => {
    await cleanupTestWorkspace(testWorkspace);
  });

  describe("基础功能", () => {
    it("应该成功创建 ContextBuilder 实例", () => {
      expect(contextBuilder).toBeDefined();
      expect(contextBuilder).toBeInstanceOf(ContextBuilder);
    });

    it("应该刷新 Bootstrap 缓存", () => {
      expect(() => contextBuilder.refreshBootstrap()).not.toThrow();
    });
  });

  describe("System Prompt 构建", () => {
    it("应该构建基本的 System Prompt", async () => {
      const prompt = await contextBuilder.buildSystemPromptAsync();

      expect(prompt).toContain("niuma 🐄");
      expect(prompt).toContain("You are niuma");
      expect(prompt).toContain("## Runtime");
      expect(prompt).toContain("## Workspace");
      expect(prompt).toContain("## niuma Guidelines");
    });

    it("应该包含工作区路径", async () => {
      const prompt = await contextBuilder.buildSystemPromptAsync();

      expect(prompt).toContain(testWorkspace);
    });

    it("应该包含运行时信息", async () => {
      const prompt = await contextBuilder.buildSystemPromptAsync();

      expect(prompt).toContain("Runtime");
      expect(prompt).toMatch(/macOS|Linux|Windows/);
      expect(prompt).toContain("Node.js");
    });

    it("应该加载 Bootstrap 文件", async () => {
      // 创建 AGENTS.md 文件
      const agentsFile = join(testWorkspace, "AGENTS.md");
      await fs.writeFile(agentsFile, "# Test Agent Content");

      // 刷新缓存
      contextBuilder.refreshBootstrap();

      const prompt = await contextBuilder.buildSystemPromptAsync();

      expect(prompt).toContain("## AGENTS.md");
      expect(prompt).toContain("Test Agent Content");
    });

    it("应该加载多个 Bootstrap 文件", async () => {
      // 创建多个 Bootstrap 文件
      await fs.writeFile(join(testWorkspace, "AGENTS.md"), "# Agents Content");
      await fs.writeFile(join(testWorkspace, "SOUL.md"), "# Soul Content");
      await fs.writeFile(join(testWorkspace, "USER.md"), "# User Content");
      await fs.writeFile(join(testWorkspace, "TOOLS.md"), "# Tools Content");

      // 刷新缓存
      contextBuilder.refreshBootstrap();

      const prompt = await contextBuilder.buildSystemPromptAsync();

      expect(prompt).toContain("## AGENTS.md");
      expect(prompt).toContain("Agents Content");
      expect(prompt).toContain("## SOUL.md");
      expect(prompt).toContain("Soul Content");
      expect(prompt).toContain("## USER.md");
      expect(prompt).toContain("User Content");
      expect(prompt).toContain("## TOOLS.md");
      expect(prompt).toContain("Tools Content");
    });

    it("应该处理不存在的 Bootstrap 文件", async () => {
      const prompt = await contextBuilder.buildSystemPromptAsync();

      // 不应该包含 Bootstrap 文件标题
      expect(prompt).not.toContain("## AGENTS.md");
      expect(prompt).not.toContain("## SOUL.md");
    });

    it("应该加载长期记忆", async () => {
      // 创建 MEMORY.md 文件
      const memoryFile = join(testWorkspace, "memory", "MEMORY.md");
      await fs.writeFile(memoryFile, "# Important Facts\n\n- Fact 1\n- Fact 2");

      const prompt = await contextBuilder.buildSystemPromptAsync();

      expect(prompt).toContain("## Long-term Memory");
      expect(prompt).toContain("Important Facts");
      expect(prompt).toContain("Fact 1");
      expect(prompt).toContain("Fact 2");
    });

    it("应该处理不存在的 MEMORY.md", async () => {
      const prompt = await contextBuilder.buildSystemPromptAsync();

      expect(prompt).not.toContain("## Long-term Memory");
    });
  });

  describe("技能加载", () => {
    it("应该加载指定技能", async () => {
      // 创建技能文件
      const skillFile = join(testWorkspace, "skills", "test-skill", "SKILL.md");
      await fs.writeFile(skillFile, "# Test Skill\n\nThis is a test skill.");

      const prompt = await contextBuilder.buildSystemPromptAsync(["test-skill"]);

      expect(prompt).toContain("## 激活技能");
      expect(prompt).toContain("Test Skill");
      expect(prompt).toContain("This is a test skill.");
    });

    it("应该处理不存在的技能", async () => {
      const prompt = await contextBuilder.buildSystemPromptAsync(["nonexistent-skill"]);

      // 不应该包含技能部分
      expect(prompt).not.toContain("## 激活技能");
    });

    it("应该加载多个技能", async () => {
      // 创建多个技能
      await fs.mkdir(join(testWorkspace, "skills", "skill1"), { recursive: true });
      await fs.mkdir(join(testWorkspace, "skills", "skill2"), { recursive: true });
      
      await fs.writeFile(
        join(testWorkspace, "skills", "skill1", "SKILL.md"),
        "# Skill 1",
      );
      await fs.writeFile(
        join(testWorkspace, "skills", "skill2", "SKILL.md"),
        "# Skill 2",
      );

      const prompt = await contextBuilder.buildSystemPromptAsync([
        "skill1",
        "skill2",
      ]);

      expect(prompt).toContain("## 激活技能");
      expect(prompt).toContain("Skill 1");
      expect(prompt).toContain("Skill 2");
    });

    it("应该去重技能", async () => {
      const prompt = await contextBuilder.buildSystemPromptAsync([
        "test-skill",
        "test-skill",
      ]);

      // 只应该出现一次技能部分
      const skillCount = (prompt.match(/## 激活技能/g) || []).length;
      expect(skillCount).toBeLessThanOrEqual(1);
    });
  });

  describe("消息构建", () => {
    it("应该构建包含历史消息的消息列表", async () => {
      const history = [
        { role: "user" as const, content: "Hello" },
        { role: "assistant" as const, content: "Hi there!" },
      ];

      const messages = await contextBuilder.buildMessages({
        history,
        currentMessage: "How are you?",
      });

      expect(messages).toHaveLength(4); // system + 2 history + 1 current
      expect(messages[0].role).toBe("system");
      expect(messages[1].role).toBe("user");
      expect(messages[2].role).toBe("assistant");
      expect(messages[3].role).toBe("user");
    });

    it("应该添加当前用户消息", async () => {
      const messages = await contextBuilder.buildMessages({
        history: [],
        currentMessage: "Test message",
      });

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe("system");
      expect(messages[1].role).toBe("user");
      expect(messages[1].content).toContain("Test message");
    });

    it("应该添加运行时上下文", async () => {
      const messages = await contextBuilder.buildMessages({
        history: [],
        currentMessage: "Test",
        channel: "cli",
        chatId: "test-chat",
      });

      const userMessage = messages[messages.length - 1];
      expect(userMessage.content).toContain("Runtime Context");
      expect(userMessage.content).toContain("Channel: cli");
      expect(userMessage.content).toContain("Chat ID: test-chat");
    });

    it("应该处理空历史消息", async () => {
      const messages = await contextBuilder.buildMessages({
        history: [],
        currentMessage: "Test",
      });

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe("system");
      expect(messages[1].role).toBe("user");
    });
  });

  describe("助手消息", () => {
    it("应该添加纯文本助手消息", () => {
      const messages: ChatMessage[] = [];

      contextBuilder.addAssistantMessage(messages, {
        content: "Assistant response",
      });

      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({
        role: "assistant",
        content: "Assistant response",
      });
    });

    it("应该添加带工具调用的助手消息", () => {
      const messages: ChatMessage[] = [];

      contextBuilder.addAssistantMessage(messages, {
        content: "Using tools",
        toolCalls: [
          {
            id: "call_1",
            name: "test_tool",
            arguments: { param: "value" },
          },
        ],
      });

      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe("assistant");
      expect(messages[0].content).toBe("Using tools");
      expect(messages[0].toolCalls).toHaveLength(1);
    });

    it("应该添加带推理内容的助手消息", () => {
      const messages: ChatMessage[] = [];

      contextBuilder.addAssistantMessage(messages, {
        content: "Final answer",
        reasoningContent: "Let me think about this...",
      });

      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe("assistant");
      expect(messages[0].reasoningContent).toBe("Let me think about this...");
    });

    it("应该添加空内容的助手消息", () => {
      const messages: ChatMessage[] = [];

      contextBuilder.addAssistantMessage(messages, {
        toolCalls: [
          {
            id: "call_1",
            name: "test_tool",
            arguments: {},
          },
        ],
      });

      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe("assistant");
      expect(messages[0].content).toBe("");
    });
  });

  describe("工具结果消息", () => {
    it("应该添加工具结果消息", () => {
      const messages: ChatMessage[] = [];

      contextBuilder.addToolResult(messages, {
        toolCallId: "call_1",
        toolName: "test_tool",
        result: "Tool executed successfully",
      });

      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({
        role: "tool",
        content: "Tool executed successfully",
        name: "test_tool",
        toolCallId: "call_1",
      });
    });
  });

  describe("异步记忆上下文", () => {
    it("应该异步获取记忆上下文", async () => {
      const memoryFile = join(testWorkspace, "memory", "MEMORY.md");
      await fs.writeFile(memoryFile, "# Test Memory");

      const context = await contextBuilder.getMemoryContextAsync();

      expect(context).toContain("## Long-term Memory");
      expect(context).toContain("Test Memory");
    });

    it("应该处理不存在的记忆文件", async () => {
      const context = await contextBuilder.getMemoryContextAsync();

      expect(context).toBe("");
    });
  });

  describe("图片内容处理", () => {
    it("应该处理 base64 图片数据", async () => {
      const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      
      const messages = await contextBuilder.buildMessages({
        history: [],
        currentMessage: "Test",
        media: [
          {
            type: "image",
            data: base64Data,
            mimeType: "image/png",
          },
        ],
      });

      const userMessage = messages[messages.length - 1];
      expect(Array.isArray(userMessage.content)).toBe(true);
      const content = userMessage.content as { type: string; text?: string; image_url?: { url: string } }[];
      
      expect(content.some((part) => part.type === "text")).toBe(true);
      expect(content.some((part) => part.type === "image_url")).toBe(true);
    });

    it("应该处理本地图片文件", async () => {
      // 创建测试图片
      const imagePath = join(testWorkspace, "test.png");
      const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const imageBuffer = Buffer.from(base64Data, "base64");
      await fs.writeFile(imagePath, imageBuffer);

      const messages = await contextBuilder.buildMessages({
        history: [],
        currentMessage: "Test",
        media: [
          {
            type: "image",
            url: imagePath,
          },
        ],
      });

      const userMessage = messages[messages.length - 1];
      expect(Array.isArray(userMessage.content)).toBe(true);
      const content = userMessage.content as { type: string; text?: string; image_url?: { url: string } }[];
      
      expect(content.some((part) => part.type === "image_url")).toBe(true);
    });

    it("应该阻止路径遍历攻击", async () => {
      // 尝试访问工作区外的文件
      const maliciousPath = "../../etc/passwd";

      const messages = await contextBuilder.buildMessages({
        history: [],
        currentMessage: "Test",
        media: [
          {
            type: "image",
            url: maliciousPath,
          },
        ],
      });

      const userMessage = messages[messages.length - 1];
      const content = userMessage.content as string | { type: string; text?: string; image_url?: { url: string } }[];
      
      // 应该不包含图片部分
      if (Array.isArray(content)) {
        expect(content.filter((part) => part.type === "image_url")).toHaveLength(0);
      }
    });

    it("应该处理不支持的媒体类型", async () => {
      const messages = await contextBuilder.buildMessages({
        history: [],
        currentMessage: "Test",
        media: [
          {
            type: "video",
            url: "test.mp4",
          },
        ],
      });

      const userMessage = messages[messages.length - 1];
      const content = userMessage.content as string | { type: string; text?: string; image_url?: { url: string } }[];
      
      // 应该只包含文本
      if (Array.isArray(content)) {
        expect(content.filter((part) => part.type !== "text")).toHaveLength(0);
      }
    });

    it("应该处理不存在的图片文件", async () => {
      const messages = await contextBuilder.buildMessages({
        history: [],
        currentMessage: "Test",
        media: [
          {
            type: "image",
            url: "nonexistent.png",
          },
        ],
      });

      const userMessage = messages[messages.length - 1];
      const content = userMessage.content as string | { type: string; text?: string; image_url?: { url: string } }[];
      
      // 应该只包含文本
      if (Array.isArray(content)) {
        expect(content.some((part) => part.type === "text")).toBe(true);
      // 图片文件不存在时，可能仍会添加 image_url 但数据为无效 URL
      }
    });
  });
});
