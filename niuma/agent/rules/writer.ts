/**
 * AGENTS.md 规则写入器
 *
 * 将规则追加到 AGENTS.md 文件
 */

import { join } from "path";

import fs from "fs-extra";

import { createLogger } from "../../log";

import type { AgentRule, AddRuleOptions, ParsedAgentsMd } from "./types";

const logger = createLogger("agents-md-writer");

const DEFAULT_HEADER = `## Rules (accumulated from failures)

This file contains rules learned from agent failures. Each rule describes a pattern to avoid or follow.

`;

export class AgentsMdWriter {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async initialize(): Promise<void> {
    try {
      const exists = await fs.pathExists(this.filePath);
      if (!exists) {
        await fs.ensureDir(join(this.filePath, ".."));
        await fs.writeFile(this.filePath, DEFAULT_HEADER, "utf-8");
        logger.info({ filePath: this.filePath }, "AGENTS.md 初始化成功");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error({ error: message }, "AGENTS.md 初始化失败");
      throw error;
    }
  }

  async appendRule(
    rule: AgentRule,
    existingRules: AgentRule[]
  ): Promise<void> {
    const ruleLine = this._formatRule(rule);
    const rulesSection = this._getRulesSection(existingRules, rule);

    const newContent = DEFAULT_HEADER + rulesSection + "\n" + ruleLine + "\n";

    await this._atomicWrite(newContent);
    logger.debug({ ruleId: rule.id }, "规则追加成功");
  }

  async replaceRules(rules: AgentRule[]): Promise<void> {
    let content = DEFAULT_HEADER;

    for (const rule of rules) {
      content += this._formatRule(rule) + "\n";
    }

    await this._atomicWrite(content);
    logger.debug({ rulesCount: rules.length }, "规则替换成功");
  }

  async addRules(rules: AgentRule[]): Promise<void> {
    if (rules.length === 0) {
      return;
    }

    let content = DEFAULT_HEADER;

    for (const rule of rules) {
      content += this._formatRule(rule) + "\n";
    }

    await this._atomicWrite(content);
    logger.debug({ rulesCount: rules.length }, "批量规则添加成功");
  }

  private _getRulesSection(existingRules: AgentRule[], newRule: AgentRule): string {
    if (existingRules.length === 0) {
      return "";
    }

    let section = "";
    for (const rule of existingRules) {
      section += this._formatRule(rule) + "\n";
    }

    return section;
  }

  private _formatRule(rule: AgentRule): string {
    let line = `${rule.id}. ${rule.rule}`;

    const details: string[] = [];
    if (rule.reason) {
      details.push(`Reason: ${rule.reason}`);
    }
    if (rule.createdAt) {
      details.push(`Added: ${rule.createdAt}`);
    }

    if (details.length > 0) {
      line += "\n  - " + details.join(" - ");
    }

    return line;
  }

  private async _atomicWrite(content: string): Promise<void> {
    const tempPath = `${this.filePath}.tmp`;
    await fs.writeFile(tempPath, content, "utf-8");
    await fs.rename(tempPath, this.filePath);
  }
}
