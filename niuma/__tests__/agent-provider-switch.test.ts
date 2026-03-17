/**
 * AgentLoop Provider 切换功能测试
 *
 * 测试 AgentLoop 的 provider 切换方法和斜杠命令处理
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { AgentLoop } from "../agent/loop";
import { ToolRegistry } from "../agent/tools/registry";
import { EventBus } from "../bus/events";
import { ProviderRegistry } from "../providers/registry";
import { SessionManager } from "../session/manager";

import type { ConfigManager } from "../config/manager";
import type { LLMProvider } from "../providers/base";
import type { LLMConfig, LLMResponse, LLMStreamChunk } from "../types";

// Mock 提供商实现
class MockProvider implements LLMProvider {
  readonly name: string;

  constructor(private config: LLMConfig, name?: string) {
    this.name = name ?? "mock";
  }

  async chat(): Promise<LLMResponse> {
    return { content: "mock response", hasToolCalls: false };
  }

  async *chatStream(): AsyncIterable<LLMStreamChunk> {
    yield { content: "mock stream" };
  }

  getDefaultModel(): string {
    return this.config.model;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  getConfig(): LLMConfig {
    return this.config;
  }
}

// Mock ConfigManager
class MockConfigManager {
  private registry: ProviderRegistry;

  constructor(registry: ProviderRegistry) {
    this.registry = registry;
  }

  listAvailableProviders() {
    return this.registry.listProviders().filter((spec) => {
      return Boolean(process.env[spec.envKey]);
    });
  }
}

describe("AgentLoop Provider 切换", () => {
  let registry: ProviderRegistry;
  let configManager: MockConfigManager;
  let agentLoop: AgentLoop;
  let mockProvider: MockProvider;

  beforeEach(() => {
    // 创建新的注册表实例
    registry = new ProviderRegistry();
    registry.clearSpecs();

    // 注册测试提供商
    registry.register({
      name: "openai",
      keywords: ["gpt", "o1"],
      envKey: "OPENAI_API_KEY",
      displayName: "OpenAI",
      factory: (config) => new MockProvider(config, "openai"),
    });

    registry.register({
      name: "anthropic",
      keywords: ["claude"],
      envKey: "ANTHROPIC_API_KEY",
      displayName: "Anthropic",
      factory: (config) => new MockProvider(config, "anthropic"),
    });

    registry.register({
      name: "ollama",
      keywords: ["llama", "qwen"],
      envKey: "OLLAMA_API_KEY",
      displayName: "Ollama",
      factory: (config) => new MockProvider(config, "ollama"),
    });

    // 设置配置
    registry.setProviderConfig("openai", { model: "gpt-4o" });
    registry.setProviderConfig("anthropic", { model: "claude-3-opus" });
    registry.setProviderConfig("ollama", { model: "llama3" });

    // 设置默认提供商
    registry.setDefaultProvider("openai");

    // 设置环境变量
    process.env.OPENAI_API_KEY = "test-key";
    process.env.ANTHROPIC_API_KEY = "test-key";
    // 不设置 OLLAMA_API_KEY，测试不可用状态

    // 创建 configManager
    configManager = new MockConfigManager(registry) as unknown as MockConfigManager & {
      listAvailableProviders: () => ReturnType<MockConfigManager["listAvailableProviders"]>;
    };

    // 创建 mock provider
    mockProvider = new MockProvider({ model: "gpt-4o" }, "openai");

    // 创建 AgentLoop
    const bus = new EventBus();
    const tools = new ToolRegistry();
    const sessions = new SessionManager({ workspace: "/tmp/test-niuma" });

    agentLoop = new AgentLoop({
      bus,
      provider: mockProvider,
      tools,
      sessions,
      workspace: "/tmp/test-niuma",
      providerRegistry: registry,
      configManager: configManager as unknown as ConfigManager,
    });
  });

  afterEach(() => {
    // 清理环境变量
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OLLAMA_API_KEY;
  });

  describe("listProviders", () => {
    it("应该列出所有配置的 provider", () => {
      const providers = agentLoop.listProviders();

      expect(providers.length).toBeGreaterThanOrEqual(2);
      expect(providers.some((p) => p.name === "openai")).toBe(true);
      expect(providers.some((p) => p.name === "anthropic")).toBe(true);
    });

    it("应该正确标记当前 provider", () => {
      const providers = agentLoop.listProviders();
      const currentProvider = providers.find((p) => p.isCurrent);

      expect(currentProvider).toBeDefined();
      expect(currentProvider?.name).toBe("openai");
    });

    it("应该正确标记可用状态", () => {
      const providers = agentLoop.listProviders();
      const openai = providers.find((p) => p.name === "openai");
      const ollama = providers.find((p) => p.name === "ollama");

      expect(openai?.isAvailable).toBe(true);
      expect(ollama?.isAvailable).toBe(false);
    });
  });

  describe("getCurrentProvider", () => {
    it("应该返回当前 provider 信息", () => {
      const current = agentLoop.getCurrentProvider();

      expect(current).toBeDefined();
      expect(current?.name).toBe("openai");
      expect(current?.displayName).toBe("OpenAI");
      expect(current?.isCurrent).toBe(true);
    });
  });

  describe("switchProvider", () => {
    it("应该成功切换到有效的 provider", () => {
      const result = agentLoop.switchProvider("anthropic");

      expect(result.success).toBe(true);
      expect(result.providerName).toBe("anthropic");
      expect(result.modelName).toBe("claude-3-opus");
    });

    it("切换后应该更新当前 provider", () => {
      agentLoop.switchProvider("anthropic");
      const current = agentLoop.getCurrentProvider();

      expect(current?.name).toBe("anthropic");
    });

    it("切换到不存在的 provider 应该失败", () => {
      const result = agentLoop.switchProvider("nonexistent");

      expect(result.success).toBe(false);
      expect(result.error).toContain("不存在");
    });

    it("切换到未配置 API Key 的 provider 应该成功但警告", () => {
      const result = agentLoop.switchProvider("ollama");

      expect(result.success).toBe(true);
      expect(result.error).toContain("警告");
    });
  });

  describe("switchByModel", () => {
    it("应该根据模型名匹配 provider", () => {
      const result = agentLoop.switchByModel("claude-3-opus");

      expect(result.success).toBe(true);
      expect(result.providerName).toBe("anthropic");
    });

    it("应该支持带 provider 前缀的模型名", () => {
      const result = agentLoop.switchByModel("anthropic/claude-sonnet-4-5");

      expect(result.success).toBe(true);
      expect(result.providerName).toBe("anthropic");
      expect(result.modelName).toBe("claude-sonnet-4-5");
    });

    it("无法匹配模型名时应该失败", () => {
      const result = agentLoop.switchByModel("unknown-model-xyz");

      expect(result.success).toBe(false);
      expect(result.error).toContain("无法确定模型");
    });

    it("应该支持 GPT 模型名", () => {
      const result = agentLoop.switchByModel("gpt-4o");

      expect(result.success).toBe(true);
      expect(result.providerName).toBe("openai");
    });
  });

  describe("setProvider", () => {
    it("应该能够设置新的 provider", () => {
      const newProvider = new MockProvider({ model: "claude-3-opus" }, "anthropic");
      agentLoop.setProvider(newProvider, "anthropic");

      const current = agentLoop.getCurrentProvider();
      expect(current?.name).toBe("anthropic");
    });
  });
});
