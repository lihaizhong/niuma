/**
 * AGENTS.md 规则解析器
 *
 * 解析和提取 AGENTS.md 中的规则
 */

import { createLogger } from "../../log";

import type { AgentRule, ParsedAgentsMd } from "./types";

const logger = createLogger("agents-md-parser");

const RULE_HEADER = "## Rules (accumulated from failures)";
const RULE_PATTERN = /^(\d+)\.\s+(.+?)(?:\s*-\s*Reason:\s*(.+))?\s*(?:\s*-\s*Added:\s*(.+))?$/;
const TASK_PATTERN = /^\s*-\s*Reason:\s*(.+?)(?:\s*-\s*Added:\s*(.+))?$/;

export class AgentsMdParser {
  parse(content: string): ParsedAgentsMd {
    const header = this._extractHeader(content);
    const rules = this._extractRules(content);
    const footer = this._extractFooter(content, rules.length);

    return { header, rules, footer };
  }

  private _extractHeader(content: string): string {
    const headerEnd = content.indexOf(RULE_HEADER);
    if (headerEnd === -1) {
      return "";
    }

    const rulesStart = headerEnd + RULE_HEADER.length;
    return content.substring(0, rulesStart);
  }

  private _extractFooter(content: string, rulesCount: number): string {
    const lastRule = content.lastIndexOf("## ");
    if (lastRule === -1 || rulesCount === 0) {
      return "";
    }

    return content.substring(lastRule);
  }

  private _extractRules(content: string): AgentRule[] {
    const rules: AgentRule[] = [];
    const lines = content.split("\n");
    let currentRule: Partial<AgentRule> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const ruleMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (ruleMatch) {
        if (currentRule.rule) {
          rules.push(currentRule as AgentRule);
        }

        currentRule = {
          id: parseInt(ruleMatch[1], 10),
          rule: ruleMatch[2].trim(),
          reason: "",
          createdAt: "",
        };
        continue;
      }

      const reasonMatch = line.match(/^\s*-\s*Reason:\s*(.+?)(?:\s*-\s*Added:\s*(.+))?$/);
      if (reasonMatch && currentRule.rule) {
        currentRule.reason = reasonMatch[1].trim();
        if (reasonMatch[2]) {
          currentRule.createdAt = reasonMatch[2].trim();
        }
      }

      const addedMatch = line.match(/^\s*-\s*Added:\s*(.+)$/);
      if (addedMatch && currentRule.rule && !currentRule.createdAt) {
        currentRule.createdAt = addedMatch[1].trim();
      }
    }

    if (currentRule.rule) {
      rules.push(currentRule as AgentRule);
    }

    return rules;
  }

  getNextRuleId(rules: AgentRule[]): number {
    if (rules.length === 0) {
      return 1;
    }

    return Math.max(...rules.map((r) => r.id)) + 1;
  }

  findSimilarRule(rules: AgentRule[], newRule: string): AgentRule | null {
    const normalizedNew = this._normalizeRule(newRule);

    for (const rule of rules) {
      const normalizedExisting = this._normalizeRule(rule.rule);
      if (normalizedNew === normalizedExisting) {
        return rule;
      }

      const similarity = this._calculateSimilarity(normalizedNew, normalizedExisting);
      if (similarity > 0.8) {
        return rule;
      }
    }

    return null;
  }

  private _normalizeRule(rule: string): string {
    return rule
      .toLowerCase()
      .replace(/[`*_]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private _calculateSimilarity(a: string, b: string): number {
    if (a === b) return 1;

    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;

    const distance = this._levenshteinDistance(a, b);
    return 1 - distance / maxLen;
  }

  private _levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }
}
