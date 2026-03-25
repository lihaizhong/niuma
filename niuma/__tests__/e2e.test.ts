import { describe, it, expect, vi } from "vitest";

import { createAgent } from "../core/agent";
import { ProviderRegistry } from "../providers/registry";
import { ToolRegistry } from "../tools/registry";

describe("E2E: Agent 完整功能测试", () => {
  describe("多 Provider 支持", () => {
    it("应创建 Agent 并执行对话", async () => {
      const mockProvider = {
        name: "mock",
        getConfig: () => ({ model: "test" }),
        getDefaultModel: () => "test-model",
        chat: vi.fn().mockResolvedValue({
          content: "Mock response",
          hasToolCalls: false,
        }),
      };

      const agent = createAgent({ provider: mockProvider as any });
      const response = await agent.chat([{ role: "user", content: "Hello" }]);

      expect(response.content).toBe("Mock response");
    });
  });

  describe("工具调用链", () => {
    it("应支持多工具连续调用", async () => {
      const registry = new ToolRegistry();
      
      registry.register({
        name: "tool_a",
        description: "Tool A",
        parameters: {} as any,
        execute: vi.fn().mockResolvedValue("Result A"),
      });
      
      registry.register({
        name: "tool_b",
        description: "Tool B",
        parameters: {} as any,
        execute: vi.fn().mockResolvedValue("Result B"),
      });

      const mockProvider = {
        name: "mock",
        getConfig: () => ({ model: "test" }),
        getDefaultModel: () => "test-model",
        chat: vi.fn()
          .mockResolvedValueOnce({
            content: "",
            hasToolCalls: true,
            toolCalls: [{ id: "1", name: "tool_a", arguments: {} }],
          })
          .mockResolvedValueOnce({
            content: "",
            hasToolCalls: true,
            toolCalls: [{ id: "2", name: "tool_b", arguments: {} }],
          })
          .mockResolvedValueOnce({
            content: "All done!",
            hasToolCalls: false,
          }),
      };

      const agent = createAgent({
        provider: mockProvider as any,
        tools: registry,
        maxIterations: 10,
      });

      const response = await agent.chat([{ role: "user", content: "Test" }]);

      expect(response.content).toBe("All done!");
      expect(mockProvider.chat).toHaveBeenCalledTimes(3);
    });
  });

  describe("状态管理", () => {
    it("应正确跟踪对话状态", async () => {
      const mockProvider = {
        name: "mock",
        getConfig: () => ({ model: "test" }),
        getDefaultModel: () => "test-model",
        chat: vi.fn().mockResolvedValue({
          content: "Response",
          hasToolCalls: false,
        }),
      };

      const agent = createAgent({
        provider: mockProvider as any,
        maxIterations: 10,
      });

      expect(agent.getState().iteration).toBe(0);
      expect(agent.getState().halted).toBe(false);

      await agent.chat([{ role: "user", content: "Test" }]);

      expect(agent.getState().iteration).toBe(1);
      expect(agent.getState().halted).toBe(true);
    });
  });

  describe("Provider Registry", () => {
    it("应管理多个 Provider", () => {
      const registry = new ProviderRegistry();
      
      const provider1 = {
        name: "provider1",
        getConfig: () => ({ model: "model1" }),
        getDefaultModel: () => "model1",
      };
      
      const provider2 = {
        name: "provider2",
        getConfig: () => ({ model: "model2" }),
        getDefaultModel: () => "model2",
      };

      registry.register("provider1", provider1 as any);
      registry.register("provider2", provider2 as any);

      expect(registry.listProviders()).toContain("provider1");
      expect(registry.listProviders()).toContain("provider2");
    });
  });
});
