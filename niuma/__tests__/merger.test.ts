/**
 * 配置合并器单元测试
 */

import { describe, it, expect } from "vitest";
import { mergeConfigs, mergeMultipleConfigs } from "../config/merger";
import type { NiumaConfig, AgentDefinition } from "../config/schema";

describe("配置合并器", () => {
  describe("mergeConfigs()", () => {
    const globalConfig: NiumaConfig = {
      workspaceDir: "~/.niuma/workspace",
      maxIterations: 40,
      agent: {
        progressMode: "normal",
        showReasoning: false,
        showToolDuration: true,
        memoryWindow: 50,
        maxRetries: 4,
        retryBaseDelay: 1000,
      },
      providers: {
        openai: {
          type: "openai",
          model: "gpt-4o",
          apiKey: "${OPENAI_API_KEY}",
          temperature: 0.7,
        },
      },
      channels: [],
      cronTasks: [],
      debug: false,
      logLevel: "info",
      agents: {
        defaults: {
          progressMode: "normal",
          showReasoning: false,
          showToolDuration: true,
          memoryWindow: 50,
          maxRetries: 4,
          retryBaseDelay: 1000,
        },
        list: [],
      },
    };

    it("应该保持全局配置当角色配置为空时", () => {
      const agentConfig: AgentDefinition = {
        id: "test",
        name: "Test Agent",
        default: false,
      };
      const result = mergeConfigs(globalConfig, agentConfig);
      expect(result.agent).toEqual(globalConfig.agent);
      expect(result.providers).toEqual(globalConfig.providers);
      expect(result.channels).toEqual(globalConfig.channels);
    });

    it("应该深度合并 agent 配置", () => {
      const agentConfig: AgentDefinition = {
        id: "test",
        default: false,
        agent: {
          progressMode: "verbose",
          showReasoning: true,
        },
      };
      const result = mergeConfigs(globalConfig, agentConfig);
      expect(result.agent?.progressMode).toBe("verbose");
      expect(result.agent?.showReasoning).toBe(true);
      expect(result.agent?.showToolDuration).toBe(true); // 继承全局配置
      expect(result.agent?.memoryWindow).toBe(50); // 继承全局配置
    });

    it("应该深度合并 providers 配置", () => {
      const agentConfig: AgentDefinition = {
        id: "test",
        default: false,
        providers: {
          openai: {
            type: "openai",
            model: "gpt-4o-mini", // 覆盖模型
            temperature: 0.3, // 覆盖温度
          },
        },
      };
      const result = mergeConfigs(globalConfig, agentConfig);
      expect(result.providers?.openai?.model).toBe("gpt-4o-mini");
      expect(result.providers?.openai?.temperature).toBe(0.3);
      expect(result.providers?.openai?.apiKey).toBe("${OPENAI_API_KEY}"); // 继承全局配置
    });

    it("应该完全替换 channels 配置", () => {
      const agentConfig: AgentDefinition = {
        id: "test",
        default: false,
        channels: [
          {
            type: "cli",
            enabled: true,
          },
        ],
      };
      const result = mergeConfigs(globalConfig, agentConfig);
      expect(result.channels).toEqual([
        {
          type: "cli",
          enabled: true,
        },
      ]);
    });

    it("应该完全替换 cronTasks 配置", () => {
      const agentConfig: AgentDefinition = {
        id: "test",
        default: false,
        cronTasks: [
          {
            name: "test-task",
            schedule: "0 9 * * *",
            enabled: true,
            handler: "testHandler",
          },
        ],
      };
      const result = mergeConfigs(globalConfig, agentConfig);
      expect(result.cronTasks).toEqual([
        {
          name: "test-task",
          schedule: "0 9 * * *",
          enabled: true,
          handler: "testHandler",
        },
      ]);
    });

    it("应该覆盖 debug 配置", () => {
      const agentConfig: AgentDefinition = {
        id: "test",
        default: false,
        debug: true,
      };
      const result = mergeConfigs(globalConfig, agentConfig);
      expect(result.debug).toBe(true);
    });

    it("应该覆盖 logLevel 配置", () => {
      const agentConfig: AgentDefinition = {
        id: "test",
        default: false,
        logLevel: "debug",
      };
      const result = mergeConfigs(globalConfig, agentConfig);
      expect(result.logLevel).toBe("debug");
    });

    it("应该覆盖 workspaceDir 配置", () => {
      const agentConfig: AgentDefinition = {
        id: "test",
        default: false,
        workspaceDir: "~/custom-workspace",
      };
      const result = mergeConfigs(globalConfig, agentConfig);
      expect(result.workspaceDir).toBe("~/custom-workspace");
    });

    it("应该处理嵌套对象合并", () => {
      const agentConfig: AgentDefinition = {
        id: "test",
        default: false,
        providers: {
          openai: {
            type: "openai",
            model: "gpt-4o-mini",
            extra: {
              customField: "custom-value",
            },
          },
        },
      };
      const result = mergeConfigs(globalConfig, agentConfig);
      expect(result.providers?.openai?.model).toBe("gpt-4o-mini");
      expect(result.providers?.openai?.apiKey).toBe("${OPENAI_API_KEY}");
      expect(result.providers?.openai?.extra).toEqual({
        customField: "custom-value",
      });
    });
  });

  describe("mergeMultipleConfigs()", () => {
    it("应该合并多个配置对象", () => {
      const config1: Record<string, unknown> = {
        field1: "value1",
        field2: "value2",
      };
      const config2: Record<string, unknown> = {
        field2: "new-value2",
        field3: "value3",
      };
      const config3: Record<string, unknown> = {
        field4: "value4",
      };
      const result = mergeMultipleConfigs(config1, config2, config3);
      expect(result).toEqual({
        field1: "value1",
        field2: "new-value2",
        field3: "value3",
        field4: "value4",
      });
    });

    it("应该深度合并嵌套对象", () => {
      const config1: Record<string, unknown> = {
        nested: {
          field1: "value1",
          field2: "value2",
        },
      };
      const config2: Record<string, unknown> = {
        nested: {
          field2: "new-value2",
          field3: "value3",
        },
      };
      const result = mergeMultipleConfigs(config1, config2);
      expect(result.nested).toEqual({
        field1: "value1",
        field2: "new-value2",
        field3: "value3",
      });
    });

    it("应该处理空配置", () => {
      const config1 = {
        field1: "value1",
      };
      const result = mergeMultipleConfigs(config1, {});
      expect(result).toEqual({
        field1: "value1",
      });
    });

    it("应该返回空对象当没有配置时", () => {
      const result = mergeMultipleConfigs();
      expect(result).toEqual({});
    });
  });
});
