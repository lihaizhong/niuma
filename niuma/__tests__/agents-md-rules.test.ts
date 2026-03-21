/**
 * AGENTS.md 规则系统测试
 */

import { existsSync } from "fs";
import { rm } from "fs/promises";
import { join } from "path";

import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { AgentsMdRules } from "../agent/rules";

describe("AgentsMdRules", () => {
  const testWorkspace = "/tmp/agents-md-test";
  let rules: AgentsMdRules;

  beforeEach(async () => {
    rules = new AgentsMdRules({
      workspace: testWorkspace,
    });
    await rules.initialize();
  });

  afterEach(async () => {
    try {
      await rm(join(testWorkspace, "AGENTS.md"), { force: true });
    } catch {
      // 忽略
    }
  });

  describe("初始化", () => {
    it("应该创建 AGENTS.md 文件", () => {
      const filePath = join(testWorkspace, "AGENTS.md");
      expect(existsSync(filePath)).toBe(true);
    });

    it("应该初始化为空规则列表", async () => {
      const count = await rules.getRuleCount();
      expect(count).toBe(0);
    });
  });

  describe("添加规则", () => {
    it("应该添加新规则", async () => {
      const rule = await rules.addRule({
        rule: "Always run tests after writing code",
        reason: "Agent forgot to verify changes",
        sourceTask: "task-1",
      });

      expect(rule).not.toBeNull();
      expect(rule?.id).toBe(1);
      expect(rule?.rule).toBe("Always run tests after writing code");

      const count = await rules.getRuleCount();
      expect(count).toBe(1);
    });

    it("应该自动分配递增的 ID", async () => {
      await rules.addRule({ rule: "Rule 1", reason: "Test" });
      await rules.addRule({ rule: "Rule 2", reason: "Test" });
      await rules.addRule({ rule: "Rule 3", reason: "Test" });

      const rulesList = await rules.getRules();
      expect(rulesList.map((r) => r.id)).toEqual([1, 2, 3]);
    });

    it("应该跳过相似的规则", async () => {
      await rules.addRule({
        rule: "Always run tests after writing code",
        reason: "Test",
      });

      const similar = await rules.addRule({
        rule: "Always run tests after writing code",
        reason: "Duplicate",
      });

      expect(similar).toBeNull();

      const count = await rules.getRuleCount();
      expect(count).toBe(1);
    });

    it("应该批量添加规则", async () => {
      const added = await rules.addRules([
        { rule: "Rule 1", reason: "Test" },
        { rule: "Rule 2", reason: "Test" },
      ]);

      expect(added).toHaveLength(2);
      expect(await rules.getRuleCount()).toBe(2);
    });
  });

  describe("查询规则", () => {
    beforeEach(async () => {
      await rules.addRules([
        { rule: "Rule 1", reason: "Reason 1" },
        { rule: "Rule 2", reason: "Reason 2" },
      ]);
    });

    it("应该返回所有规则", async () => {
      const rulesList = await rules.getRules();
      expect(rulesList).toHaveLength(2);
    });

    it("应该生成用于上下文的格式", async () => {
      const context = await rules.getRulesForContext();
      expect(context).toContain("Rule 1");
      expect(context).toContain("Rule 2");
    });
  });

  describe("移除规则", () => {
    beforeEach(async () => {
      await rules.addRules([
        { rule: "Rule 1", reason: "Test" },
        { rule: "Rule 2", reason: "Test" },
      ]);
    });

    it("应该移除指定规则", async () => {
      const removed = await rules.removeRule(1);
      expect(removed).toBe(true);
      expect(await rules.getRuleCount()).toBe(1);
    });

    it("应该返回 false 当规则不存在时", async () => {
      const removed = await rules.removeRule(999);
      expect(removed).toBe(false);
    });
  });

  describe("清空规则", () => {
    it("应该清空所有规则", async () => {
      await rules.addRules([
        { rule: "Rule 1", reason: "Test" },
        { rule: "Rule 2", reason: "Test" },
      ]);

      await rules.clearRules();
      expect(await rules.getRuleCount()).toBe(0);
    });
  });
});
