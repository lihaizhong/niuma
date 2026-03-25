import { describe, it, expect, vi } from "vitest";

import { createAgent } from "../core/agent";
import { OpenAIProvider } from "../providers/openai";
import { ToolRegistry } from "../tools/registry";

import type { ChatMessage, LLMResponse } from "../types/llm";

describe("Agent Integration", () => {
  describe("createAgent", () => {
    it("should create agent with provider", () => {
      const mockProvider = {
        name: "mock",
        getConfig: () => ({ model: "test" }),
        chat: vi.fn(),
        getDefaultModel: () => "test-model",
      };

      const agent = createAgent({
        provider: mockProvider as any,
        maxIterations: 10,
        temperature: 0.5,
      });

      expect(agent).toBeDefined();
      expect(agent.chat).toBeInstanceOf(Function);
      expect(agent.getState).toBeInstanceOf(Function);
    });

    it("should use default options", () => {
      const mockProvider = {
        name: "mock",
        getConfig: () => ({ model: "test" }),
        chat: vi.fn(),
        getDefaultModel: () => "test-model",
      };

      const agent = createAgent({
        provider: mockProvider as any,
      });

      const state = agent.getState();
      expect(state.iteration).toBe(0);
      expect(state.halted).toBe(false);
    });
  });

  describe("agent.chat", () => {
    it("should return response without tool calls", async () => {
      const mockResponse: LLMResponse = {
        content: "Hello!",
        hasToolCalls: false,
      };

      const mockProvider = {
        name: "mock",
        getConfig: () => ({ model: "test" }),
        chat: vi.fn().mockResolvedValue(mockResponse),
        getDefaultModel: () => "test-model",
      };

      const agent = createAgent({
        provider: mockProvider as any,
        maxIterations: 10,
      });

      const messages: ChatMessage[] = [
        { role: "user", content: "Hi" },
      ];

      const response = await agent.chat(messages);

      expect(response.content).toBe("Hello!");
      expect(response.hasToolCalls).toBe(false);
      expect(mockProvider.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: "user", content: "Hi" }),
          ]),
          temperature: 0.7,
        })
      );
    });

    it("should handle tool calls", async () => {
      const registry = new ToolRegistry();
      registry.register({
        name: "test_tool",
        description: "Test tool",
        parameters: {} as any,
        execute: vi.fn().mockResolvedValue("Tool result"),
      });

      const mockResponse1: LLMResponse = {
        content: "",
        hasToolCalls: true,
        toolCalls: [
          {
            id: "1",
            name: "test_tool",
            arguments: {},
          },
        ],
      };

      const mockResponse2: LLMResponse = {
        content: "Done!",
        hasToolCalls: false,
      };

      const mockProvider = {
        name: "mock",
        getConfig: () => ({ model: "test" }),
        chat: vi.fn()
          .mockResolvedValueOnce(mockResponse1)
          .mockResolvedValueOnce(mockResponse2),
        getDefaultModel: () => "test-model",
      };

      const agent = createAgent({
        provider: mockProvider as any,
        tools: registry,
        maxIterations: 10,
      });

      const messages: ChatMessage[] = [
        { role: "user", content: "Call tool" },
      ];

      const response = await agent.chat(messages);

      expect(response.content).toBe("Done!");
      expect(mockProvider.chat).toHaveBeenCalledTimes(2);
    });

    it("should respect maxIterations", async () => {
      const mockResponse: LLMResponse = {
        content: "",
        hasToolCalls: true,
        toolCalls: [
          {
            id: "1",
            name: "test_tool",
            arguments: {},
          },
        ],
      };

      const mockProvider = {
        name: "mock",
        getConfig: () => ({ model: "test" }),
        chat: vi.fn().mockResolvedValue(mockResponse),
        getDefaultModel: () => "test-model",
      };

      const agent = createAgent({
        provider: mockProvider as any,
        maxIterations: 3,
      });

      const messages: ChatMessage[] = [
        { role: "user", content: "Test" },
      ];

      await agent.chat(messages);

      expect(mockProvider.chat).toHaveBeenCalledTimes(3);
    });
  });

  describe("progress callback", () => {
    it("should call progress callback", async () => {
      const mockResponse: LLMResponse = {
        content: "Hello!",
        hasToolCalls: false,
      };

      const mockProvider = {
        name: "mock",
        getConfig: () => ({ model: "test" }),
        chat: vi.fn().mockResolvedValue(mockResponse),
        getDefaultModel: () => "test-model",
      };

      const onProgress = vi.fn();

      const agent = createAgent({
        provider: mockProvider as any,
        onProgress,
      });

      await agent.chat([{ role: "user", content: "Hi" }]);

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.any(String),
          iteration: expect.any(Number),
        })
      );
    });
  });
});

describe("Provider Integration", () => {
  it("should work with OpenAIProvider", () => {
    const provider = new OpenAIProvider({
      model: "gpt-4o",
      apiKey: "test-key",
    });

    expect(provider.name).toBe("openai");
    expect(provider.getDefaultModel()).toBe("gpt-4o");
    expect(provider.getConfig()).toEqual({
      model: "gpt-4o",
      apiKey: "test-key",
    });
  });

  it("should switch providers", async () => {
    const provider1 = {
      name: "provider1",
      getConfig: () => ({ model: "model1" }),
      chat: vi.fn().mockResolvedValue({ content: "P1", hasToolCalls: false }),
      getDefaultModel: () => "model1",
    };

    const provider2 = {
      name: "provider2",
      getConfig: () => ({ model: "model2" }),
      chat: vi.fn().mockResolvedValue({ content: "P2", hasToolCalls: false }),
      getDefaultModel: () => "model2",
    };

    const agent1 = createAgent({ provider: provider1 as any });
    const agent2 = createAgent({ provider: provider2 as any });

    const res1 = await agent1.chat([{ role: "user", content: "Test" }]);
    const res2 = await agent2.chat([{ role: "user", content: "Test" }]);

    expect(res1.content).toBe("P1");
    expect(res2.content).toBe("P2");
  });
});
