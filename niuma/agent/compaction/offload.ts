/**
 * 输出卸载模块
 *
 * 提供大型工具输出到文件的卸载和检索能力
 */

import { join } from "path";
import fs from "fs-extra";
import { nanoid } from "nanoid";
import { createLogger } from "../../log";
import type { OffloadConfig } from "./types";

const logger = createLogger("output-offload");

export interface OffloadMetadata {
  fileId: string;
  toolName: string;
  originalSize: number;
  offloadedAt: string;
  accessed: number;
}

export class OutputOffloader {
  private config: OffloadConfig;
  private metadataPath: string;
  private metadata: Map<string, OffloadMetadata> = new Map();

  constructor(config: OffloadConfig) {
    this.config = config;
    this.metadataPath = join(config.offloadDir, ".metadata.json");
  }

  async initialize(): Promise<void> {
    await fs.ensureDir(this.config.offloadDir);
    await this._loadMetadata();
  }

  async offload(
    toolName: string,
    output: string
  ): Promise<{ fileId: string; reference: string; truncated?: string }> {
    await this.initialize();

    const fileId = nanoid(8);
    const fileName = `${toolName}_${fileId}.txt`;
    const filePath = join(this.config.offloadDir, fileName);

    const estimatedTokens = Math.ceil(output.length / 4);
    let contentToSave = output;
    let truncated: string | undefined;

    if (estimatedTokens > this.config.maxOutputTokens) {
      truncated = this._truncate(output, this.config.maxOutputTokens * 4);
      contentToSave = output;
    }

    await fs.writeFile(filePath, contentToSave, "utf-8");

    const metadata: OffloadMetadata = {
      fileId,
      toolName,
      originalSize: output.length,
      offloadedAt: new Date().toISOString(),
      accessed: 0,
    };

    this.metadata.set(fileId, metadata);
    await this._saveMetadata();

    logger.debug({ fileId, toolName, size: output.length }, "输出已卸载");

    const reference = `[Output (${this._formatSize(output.length)}) saved to ${fileName}]`;

    return { fileId, reference, truncated };
  }

  async retrieve(fileId: string, maxTokens?: number): Promise<string | null> {
    await this.initialize();

    const metadata = this.metadata.get(fileId);
    if (!metadata) {
      return null;
    }

    const files = await fs.readdir(this.config.offloadDir);
    const match = files.find((f) => f.includes(fileId) && f.endsWith(".txt"));

    if (!match) {
      return null;
    }

    const content = await fs.readFile(join(this.config.offloadDir, match), "utf-8");

    metadata.accessed++;
    await this._saveMetadata();

    if (maxTokens) {
      const maxChars = maxTokens * 4;
      if (content.length > maxChars) {
        return content.slice(0, maxChars) + "\n...[truncated]";
      }
    }

    return content;
  }

  async listOffloads(): Promise<OffloadMetadata[]> {
    await this.initialize();
    return Array.from(this.metadata.values()).sort(
      (a, b) => new Date(b.offloadedAt).getTime() - new Date(a.offloadedAt).getTime()
    );
  }

  async cleanup(olderThanDays: number = 7): Promise<number> {
    await this.initialize();

    const now = Date.now();
    const maxAge = olderThanDays * 24 * 60 * 60 * 1000;
    let removed = 0;

    for (const [fileId, metadata] of this.metadata.entries()) {
      const age = now - new Date(metadata.offloadedAt).getTime();
      if (age > maxAge) {
        const files = await fs.readdir(this.config.offloadDir);
        const match = files.find((f) => f.includes(fileId));

        if (match) {
          await fs.remove(join(this.config.offloadDir, match));
          removed++;
        }

        this.metadata.delete(fileId);
      }
    }

    if (removed > 0) {
      await this._saveMetadata();
    }

    return removed;
  }

  private _truncate(content: string, maxChars: number): string {
    return content.slice(0, maxChars) + "\n...[output truncated, full content saved to file]";
  }

  private _formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  private async _loadMetadata(): Promise<void> {
    try {
      if (await fs.pathExists(this.metadataPath)) {
        const data = await fs.readJson(this.metadataPath);
        this.metadata = new Map(Object.entries(data));
      }
    } catch {
      this.metadata = new Map();
    }
  }

  private async _saveMetadata(): Promise<void> {
    const obj = Object.fromEntries(this.metadata);
    await fs.writeJson(this.metadataPath, obj, { spaces: 2 });
  }
}
