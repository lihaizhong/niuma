/**
 * 提供商注册表测试
 *
 * @description 测试 ProviderRegistry 的注册、查询和自动选择功能
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

import { ProviderRegistry, type ProviderSpec } from "../providers/registry";

import type { LLMProvider } from "../providers/base";
import type { LLMConfig, LLMResponse, LLMStreamChunk } from "../types";

// Mock 提供商实现
class MockProvider implements LLMProvider {
  readonly name: string;
  private instanceId: string;

  constructor(private config: LLMConfig, name?: string) {
    // 如果传入 name 参数，使用它；否则从 model 中提取
    if (name) {
      this.name = name;
    } else {
      // 从 model 中提取 provider name（如果有 "/"），否则使用 "mock"
      const parts = config.model.split("/");
      this.name = parts.length > 1 ? parts[0] : "mock";
    }
    // 生成唯一实例 ID
    this.instanceId = Math.random().toString(36).substring(7);
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

  // 用于测试实例是否相同
  getInstanceId(): string {
    return this.instanceId;
  }
}

describe("ProviderRegistry", () => {
  let registry: ProviderRegistry;

  beforeEach(() => {
    // 创建新的注册表实例，不使用全局实例
    registry = new ProviderRegistry();
    // 清除内置提供商规格
    registry.clearSpecs();
  });

  describe("注册功能", () => {
    it("应该能够注册单个提供商", () => {
      const spec: ProviderSpec = {
        name: "test",
        keywords: ["test"],
        envKey: "TEST_API_KEY",
        displayName: "Test Provider",
        factory: (config) => new MockProvider(config),
      };

      registry.register(spec);
      const providers = registry.listProviders();

      expect(providers).toHaveLength(1);
      expect(providers[0].name).toBe("test");
    });

    it("应该能够批量注册提供商", () => {
      const specs: ProviderSpec[] = [
        {
          name: "test1",
          keywords: ["test1"],
          envKey: "TEST1_API_KEY",
          displayName: "Test Provider 1",
          factory: (config) => new MockProvider(config),
        },
        {
          name: "test2",
          keywords: ["test2"],
          envKey: "TEST2_API_KEY",
          displayName: "Test Provider 2",
          factory: (config) => new MockProvider(config),
        },
      ];

      registry.registerMultiple(specs);
      const providers = registry.listProviders();

      expect(providers).toHaveLength(2);
      expect(providers.map((p) => p.name)).toEqual(["test1", "test2"]);
    });

    it("应该能够覆盖已存在的提供商", () => {
      const spec1: ProviderSpec = {
        name: "test",
        keywords: ["old"],
        envKey: "TEST_API_KEY",
        displayName: "Old Provider",
        factory: (config) => new MockProvider(config),
      };

      const spec2: ProviderSpec = {
        name: "test",
        keywords: ["new"],
        envKey: "TEST_API_KEY",
        displayName: "New Provider",
        factory: (config) => new MockProvider(config),
      };

      registry.register(spec1);
      registry.register(spec2);

      const providers = registry.listProviders();
      expect(providers).toHaveLength(1);
      expect(providers[0].keywords).toEqual(["new"]);
    });
  });

  describe("模型名匹配", () => {
    beforeEach(() => {
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
        name: "openrouter",
        keywords: [],
        envKey: "OPENROUTER_API_KEY",
        displayName: "OpenRouter",
        isGateway: true,
        factory: (config) => new MockProvider(config, "openrouter"),
      });

      // 设置配置
      registry.setProviderConfig("openai", { model: "gpt-4o" });
      registry.setProviderConfig("anthropic", { model: "claude-3-opus" });
      registry.setProviderConfig("openrouter", { model: "anthropic/claude-3.5-sonnet" });
    });

    it("应该能够匹配显式指定的提供商", () => {
      const provider = registry.getProvider("openai/gpt-4o");
      expect(provider).toBeDefined();
      expect(provider?.name).toBe("openai");
    });

    it("应该能够通过关键词匹配提供商", () => {
      const provider = registry.getProvider("gpt-4o");
      expect(provider).toBeDefined();
      expect(provider?.name).toBe("openai");
    });

    it("应该能够匹配 Claude 关键词", () => {
      const provider = registry.getProvider("claude-3-opus");
      expect(provider).toBeDefined();
      expect(provider?.name).toBe("anthropic");
    });

    it("应该能够回退到网关提供商", () => {
      const provider = registry.getProvider("unknown-model");
      expect(provider).toBeDefined();
      expect(provider?.name).toBe("openrouter");
    });

    it("应该能够回退到默认提供商", () => {
      registry.setDefaultProvider("anthropic");
      // 移除网关和所有规格
      registry.clearSpecs();
      registry.register({
        name: "anthropic",
        keywords: ["claude"],
        envKey: "ANTHROPIC_API_KEY",
        displayName: "Anthropic",
        factory: (config) => new MockProvider(config, "anthropic"),
      });
      registry.setProviderConfig("anthropic", { model: "claude-3-opus" });
      registry.setDefaultProvider("anthropic");

      const provider = registry.getProvider("unknown-model");
      expect(provider).toBeDefined();
      expect(provider?.name).toBe("anthropic");
    });

    it("应该按关键词长度优先匹配", () => {
      registry.register({
        name: "test",
        keywords: ["gpt-4"],
        envKey: "TEST_API_KEY",
        displayName: "Test",
        factory: (config) => new MockProvider(config, "test"),
      });
      registry.setProviderConfig("test", { model: "test-model" });

      const provider = registry.getProvider("gpt-4o");
      expect(provider?.name).toBe("test");
    });
  });

  describe("默认提供商", () => {
    it("应该能够设置默认提供商", () => {
      registry.register({
        name: "test",
        keywords: ["test"],
        envKey: "TEST_API_KEY",
        displayName: "Test",
        factory: (config) => new MockProvider(config, "test"),
      });

      registry.setProviderConfig("test", { model: "test-model" });
      registry.setDefaultProvider("test");
      const provider = registry.getDefaultProvider();

      expect(provider).toBeDefined();
      expect(provider?.name).toBe("test");
    });

    it("设置不存在的提供商应该抛出错误", () => {
      expect(() => {
        registry.setDefaultProvider("nonexistent");
      }).toThrow("提供商 \"nonexistent\" 不存在");
    });

    it("如果未设置默认提供商，应该返回第一个注册的提供商", () => {
      registry.register({
        name: "test1",
        keywords: ["test1"],
        envKey: "TEST1_API_KEY",
        displayName: "Test 1",
        factory: (config) => new MockProvider(config, "test1"),
      });

      registry.register({
        name: "test2",
        keywords: ["test2"],
        envKey: "TEST2_API_KEY",
        displayName: "Test 2",
        factory: (config) => new MockProvider(config, "test2"),
      });

      registry.setProviderConfig("test1", { model: "test1-model" });

      const provider = registry.getDefaultProvider();
      expect(provider?.name).toBe("test1");
    });
  });

  describe("提供商列表", () => {
    beforeEach(() => {
      registry.register({
        name: "test1",
        keywords: ["test1"],
        envKey: "TEST1_API_KEY",
        displayName: "Test 1",
        factory: (config) => new MockProvider(config),
      });

      registry.register({
        name: "test2",
        keywords: ["test2"],
        envKey: "TEST2_API_KEY",
        displayName: "Test 2",
        factory: (config) => new MockProvider(config),
      });
    });

    it("应该能够列出所有提供商", () => {
      const providers = registry.listProviders();
      expect(providers).toHaveLength(2);
      expect(providers.map((p) => p.name)).toEqual(["test1", "test2"]);
    });

    it("应该能够列出可用的提供商", () => {
      // 设置环境变量
      process.env.TEST1_API_KEY = "key1";
      // 不设置 TEST2_API_KEY

      const availableProviders = registry.listAvailableProviders();
      expect(availableProviders).toHaveLength(1);
      expect(availableProviders[0].name).toBe("test1");

      // 清理环境变量
      delete process.env.TEST1_API_KEY;
    });
  });

  describe("提供商实例管理", () => {
    it("应该能够创建提供商实例", () => {
      const spec: ProviderSpec = {
        name: "test",
        keywords: ["test"],
        envKey: "TEST_API_KEY",
        displayName: "Test",
        factory: (config) => new MockProvider(config),
      };

      registry.register(spec);

      const config: LLMConfig = { model: "test-model" };
      const provider = registry.createProvider("test", config);

      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(MockProvider);
    });

    it("创建不存在的提供商应该抛出错误", () => {
      expect(() => {
        registry.createProvider("nonexistent", { model: "test" });
      }).toThrow("提供商 \"nonexistent\" 不存在");
    });

    it("应该能够复用已创建的实例", () => {
      const spec: ProviderSpec = {
        name: "test",
        keywords: ["test"],
        envKey: "TEST_API_KEY",
        displayName: "Test",
        factory: (config) => new MockProvider(config),
      };

      registry.register(spec);
      registry.setProviderConfig("test", { model: "test-model" });

      const provider1 = registry.getProviderByName("test");
      const provider2 = registry.getProviderByName("test");

      expect(provider1).toBe(provider2);
    });
  });

  describe("配置管理", () => {
    it("应该能够设置提供商配置", () => {
      const config: LLMConfig = { model: "test-model" };
      registry.setProviderConfig("test", config);

      const retrievedConfig = registry.getProviderConfig("test");
      expect(retrievedConfig).toEqual(config);
    });

    it("应该能够清除所有配置", () => {
      registry.setProviderConfig("test1", { model: "test1-model" });
      registry.setProviderConfig("test2", { model: "test2-model" });

      registry.clearConfigs();

      expect(registry.getProviderConfig("test1")).toBeUndefined();
      expect(registry.getProviderConfig("test2")).toBeUndefined();
    });
  });

  describe("重置功能", () => {
    it("应该能够清除所有实例", () => {
      const spec: ProviderSpec = {
        name: "test",
        keywords: ["test"],
        envKey: "TEST_API_KEY",
        displayName: "Test",
        factory: (config) => new MockProvider(config),
      };

      registry.register(spec);
      registry.setProviderConfig("test", { model: "test-model" });

      const provider1 = registry.getProviderByName("test") as MockProvider; // 创建实例
      registry.clearInstances();

      // 重新获取应该创建新实例
      const provider2 = registry.getProviderByName("test") as MockProvider;

      expect(provider1.getInstanceId()).not.toBe(provider2.getInstanceId());
    });

    it("应该能够完全重置注册表", () => {
      const spec: ProviderSpec = {
        name: "test",
        keywords: ["test"],
        envKey: "TEST_API_KEY",
        displayName: "Test",
        factory: (config) => new MockProvider(config),
      };

      registry.register(spec);
      registry.setProviderConfig("test", { model: "test-model" });
      registry.setDefaultProvider("test");

      registry.reset();

      expect(registry.getProviderConfig("test")).toBeUndefined();
      expect(registry.listProviders()).toHaveLength(1); // 规格仍然保留
    });
  });

  describe("边界情况", () => {
    it("应该能够处理空模型名", () => {
      const provider = registry.getProvider("");
      expect(provider).toBeUndefined();
    });

    it("应该能够处理无效的显式指定格式", () => {
      const provider = registry.getProvider("invalid//format");
      expect(provider).toBeUndefined();
    });

    it("应该能够处理大小写不敏感的关键词匹配", () => {
      registry.register({
        name: "test",
        keywords: ["GPT"],
        envKey: "TEST_API_KEY",
        displayName: "Test",
        factory: (config) => new MockProvider(config, "test"),
      });
      registry.setProviderConfig("test", { model: "test-model" });

      const provider = registry.getProvider("gpt-4o");
      expect(provider?.name).toBe("test");
    });

    it("应该能够处理无网关无默认提供商的情况", () => {
      registry.register({
        name: "test",
        keywords: ["test"],
        envKey: "TEST_API_KEY",
        displayName: "Test",
        factory: (config) => new MockProvider(config),
      });
      registry.setProviderConfig("test", { model: "test-model" });

      const provider = registry.getProvider("unknown-model");
      expect(provider).toBeUndefined();
    });
  });
});