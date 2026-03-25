/**
 * 上下文压缩模块
 */

export interface CompactionConfig {
  enabled: boolean;
  threshold: number;
  reserveTokens: number;
  maxHistoryRounds: number;
}

export interface CompactionResult {
  originalTokens: number;
  compactedTokens: number;
  preservedRounds: number;
}

export interface OffloadConfig {
  maxOutputTokens: number;
  offloadDir: string;
}

export const DEFAULT_COMPACTION_CONFIG: CompactionConfig = {
  enabled: false,
  threshold: 0.8,
  reserveTokens: 1000,
  maxHistoryRounds: 5,
};
