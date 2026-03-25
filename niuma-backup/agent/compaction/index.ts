/**
 * 上下文压缩器
 *
 * 提供历史压缩和输出卸载能力
 */

import { join } from "path";

import fs from "fs-extra";
import { nanoid } from "nanoid";

import { createLogger } from "../../log";


import { HistoryCompressor } from "./history";
import { OutputOffloader } from "./offload";
import { DEFAULT_COMPACTION_CONFIG } from "./types";

import type {
  CompactionConfig,
  CompactionResult,
  OffloadConfig,
} from "./types";

const logger = createLogger("context-compaction");

export interface ContextCompactionOptions {
  workspace: string;
  config?: Partial<CompactionConfig>;
  offloadConfig?: Partial<OffloadConfig>;
}

export class ContextCompaction {
  private config: CompactionConfig;
  private offloadConfig: OffloadConfig;
  private workspace: string;
  private historyCompressor: HistoryCompressor;
  private outputOffloader: OutputOffloader;

  constructor(options: ContextCompactionOptions) {
    this.workspace = options.workspace;
    this.config = { ...DEFAULT_COMPACTION_CONFIG, ...options.config };
    this.offloadConfig = {
      maxOutputTokens: 2000,
      offloadDir: join(options.workspace, ".harness", "offloads"),
      ...options.offloadConfig,
    };
    this.historyCompressor = new HistoryCompressor({
      preserveRounds: this.config.maxHistoryRounds,
    });
    this.outputOffloader = new OutputOffloader(this.offloadConfig);
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  enable(): void {
    this.config.enabled = true;
  }

  disable(): void {
    this.config.enabled = false;
  }

  shouldCompact(tokenCount: number, maxTokens: number): boolean {
    if (!this.config.enabled) {
      return false;
    }
    return tokenCount / maxTokens >= this.config.threshold;
  }

  compact(
    messages: Array<{ role: string; content: string }>,
    options?: { preserveRounds?: number }
  ): { compacted: Array<{ role: string; content: string }>; summary: string } {
    const result = this.historyCompressor.compress(messages);

    return {
      compacted: result.compacted,
      summary: result.result.originalTokens > result.result.compactedTokens
        ? `Compressed ${result.result.originalTokens - result.result.compactedTokens} tokens`
        : "",
    };
  }

  async offloadOutput(
    toolName: string,
    output: string
  ): Promise<{ fileId: string; reference: string }> {
    const result = await this.outputOffloader.offload(toolName, output);
    return { fileId: result.fileId, reference: result.reference };
  }

  async retrieveOutput(fileId: string): Promise<string | null> {
    return this.outputOffloader.retrieve(fileId);
  }

  async cleanupOffloads(olderThanDays: number = 7): Promise<number> {
    return this.outputOffloader.cleanup(olderThanDays);
  }
}
