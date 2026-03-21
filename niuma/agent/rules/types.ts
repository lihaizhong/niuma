/**
 * AGENTS.md 规则系统类型定义
 */

export interface AgentRule {
  id: number;
  rule: string;
  reason: string;
  createdAt: string;
  sourceTask?: string;
}

export interface ParsedAgentsMd {
  header: string;
  rules: AgentRule[];
  footer: string;
}

export interface AddRuleOptions {
  rule: string;
  reason: string;
  sourceTask?: string;
}

export interface AgentsMdRulesConfig {
  fileName: string;
  maxRules?: number;
  autoCleanup?: boolean;
}

export const DEFAULT_AGENTS_MD_CONFIG: AgentsMdRulesConfig = {
  fileName: "AGENTS.md",
  maxRules: 100,
  autoCleanup: false,
};
