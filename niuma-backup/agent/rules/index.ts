/**
 * AGENTS.md 规则系统 - 主模块
 *
 * 管理 AGENTS.md 文件中的渐进规则积累
 */

import { join } from "path";

import fs from "fs-extra";

import { createLogger } from "../../log";

import { AgentsMdParser } from "./parser";
import { DEFAULT_AGENTS_MD_CONFIG } from "./types";
import { AgentsMdWriter } from "./writer";

import type {
  AgentRule,
  ParsedAgentsMd,
  AddRuleOptions,
  AgentsMdRulesConfig,
} from "./types";

const logger = createLogger("agents-md-rules");

export interface AgentsMdRulesOptions {
  workspace: string;
  config?: Partial<AgentsMdRulesConfig>;
}

export class AgentsMdRules {
  private workspace: string;
  private config: AgentsMdRulesConfig;
  private parser: AgentsMdParser;
  private writer: AgentsMdWriter;
  private filePath: string;
  private cachedParsed: ParsedAgentsMd | null = null;
  private cacheValid = false;

  constructor(options: AgentsMdRulesOptions) {
    this.workspace = options.workspace;
    this.config = { ...DEFAULT_AGENTS_MD_CONFIG, ...options.config };
    this.parser = new AgentsMdParser();
    this.filePath = join(this.workspace, this.config.fileName);
    this.writer = new AgentsMdWriter(this.filePath);
  }

  async initialize(): Promise<void> {
    await this.writer.initialize();
    await this._loadAndCache();
    logger.info({ filePath: this.filePath }, "AGENTS.md 规则系统初始化成功");
  }

  async addRule(options: AddRuleOptions): Promise<AgentRule | null> {
    await this._ensureInitialized();

    const parsed = await this._loadAndCache();

    const similar = this.parser.findSimilarRule(parsed.rules, options.rule);
    if (similar) {
      logger.debug(
        { newRule: options.rule, existingRule: similar.rule },
        "发现相似规则，跳过添加"
      );
      return null;
    }

    const newRule: AgentRule = {
      id: this.parser.getNextRuleId(parsed.rules),
      rule: options.rule,
      reason: options.reason,
      createdAt: new Date().toISOString().split("T")[0],
      sourceTask: options.sourceTask,
    };

    await this.writer.appendRule(newRule, parsed.rules);
    this._invalidateCache();

    await this._checkAndCleanup();

    logger.info({ ruleId: newRule.id, rule: newRule.rule }, "规则添加成功");

    return newRule;
  }

  async addRules(optionsList: AddRuleOptions[]): Promise<AgentRule[]> {
    const added: AgentRule[] = [];

    for (const options of optionsList) {
      const rule = await this.addRule(options);
      if (rule) {
        added.push(rule);
      }
    }

    return added;
  }

  async getRules(): Promise<AgentRule[]> {
    await this._ensureInitialized();
    const parsed = await this._loadAndCache();
    return parsed.rules;
  }

  async getRulesForContext(): Promise<string> {
    const rules = await this.getRules();

    if (rules.length === 0) {
      return "";
    }

    const lines: string[] = ["\n## Agent Rules\n"];

    for (const rule of rules) {
      lines.push(`${rule.id}. ${rule.rule}`);
    }

    return lines.join("\n");
  }

  async getRuleCount(): Promise<number> {
    const rules = await this.getRules();
    return rules.length;
  }

  async clearRules(): Promise<void> {
    await this._ensureInitialized();
    await this.writer.replaceRules([]);
    this._invalidateCache();
    logger.info("规则已清空");
  }

  async removeRule(ruleId: number): Promise<boolean> {
    await this._ensureInitialized();
    const parsed = await this._loadAndCache();

    const filtered = parsed.rules.filter((r) => r.id !== ruleId);
    if (filtered.length === parsed.rules.length) {
      return false;
    }

    await this.writer.replaceRules(filtered);
    this._invalidateCache();

    logger.info({ ruleId }, "规则移除成功");
    return true;
  }

  private async _ensureInitialized(): Promise<void> {
    if (!this.cacheValid) {
      await this.initialize();
    }
  }

  private async _loadAndCache(): Promise<ParsedAgentsMd> {
    if (this.cachedParsed && this.cacheValid) {
      return this.cachedParsed;
    }

    try {
      const content = await fs.readFile(this.filePath, "utf-8");
      this.cachedParsed = this.parser.parse(content);
      this.cacheValid = true;
    } catch {
      this.cachedParsed = {
        header: "",
        rules: [],
        footer: "",
      };
      this.cacheValid = true;
    }

    return this.cachedParsed;
  }

  private _invalidateCache(): void {
    this.cacheValid = false;
  }

  private async _checkAndCleanup(): Promise<void> {
    if (!this.config.autoCleanup) {
      return;
    }

    const parsed = await this._loadAndCache();

    if (parsed.rules.length > (this.config.maxRules ?? 100)) {
      const keepCount = Math.floor((this.config.maxRules ?? 100) * 0.8);
      const rulesToKeep = parsed.rules.slice(-keepCount);

      await this.writer.replaceRules(rulesToKeep);
      this._invalidateCache();

      logger.info(
        { before: parsed.rules.length, after: rulesToKeep.length },
        "规则已清理"
      );
    }
  }
}

export * from "./types";
