/**
 * 历史压缩模块
 *
 * 提供对话历史的压缩和摘要能力
 */

import type { CompactionResult } from "./types";

export interface HistoryCompressionOptions {
  preserveRounds: number;
  minMessagesToCompress: number;
}

export interface CompressedSegment {
  summary: string;
  messageCount: number;
  startTime: string;
  endTime: string;
  keyDecisions: string[];
}

export class HistoryCompressor {
  private options: HistoryCompressionOptions;

  constructor(options: Partial<HistoryCompressionOptions> = {}) {
    this.options = {
      preserveRounds: 5,
      minMessagesToCompress: 6,
      ...options,
    };
  }

  compress(
    messages: Array<{ role: string; content: string; timestamp?: string }>
  ): { compacted: Array<{ role: string; content: string }>; result: CompactionResult } {
    if (messages.length < this.options.minMessagesToCompress) {
      return {
        compacted: messages,
        result: {
          originalTokens: this._estimateTokens(messages),
          compactedTokens: this._estimateTokens(messages),
          preservedRounds: Math.floor(messages.length / 2),
        },
      };
    }

    const preserveCount = this.options.preserveRounds * 2;
    const recentMessages = messages.slice(-preserveCount);
    const oldMessages = messages.slice(0, -preserveCount);

    const summary = this._summarize(oldMessages);
    const compressed = [
      { role: "system" as const, content: `[Earlier conversation (${oldMessages.length} messages)]\n${summary}` },
      ...recentMessages,
    ];

    return {
      compacted: compressed,
      result: {
        originalTokens: this._estimateTokens(messages),
        compactedTokens: this._estimateTokens(compressed),
        preservedRounds: this.options.preserveRounds,
      },
    };
  }

  extractSegments(
    messages: Array<{ role: string; content: string; timestamp?: string }>
  ): CompressedSegment[] {
    const segments: CompressedSegment[] = [];
    const roundSize = 2;

    for (let i = 0; i < messages.length; i += roundSize * 3) {
      const segmentMessages = messages.slice(i, i + roundSize * 3);
      if (segmentMessages.length < roundSize) break;

      const decisions = this._extractDecisions(segmentMessages);

      segments.push({
        summary: this._summarize(segmentMessages),
        messageCount: segmentMessages.length,
        startTime: segmentMessages[0]?.timestamp ?? new Date().toISOString(),
        endTime: segmentMessages[segmentMessages.length - 1]?.timestamp ?? new Date().toISOString(),
        keyDecisions: decisions,
      });
    }

    return segments;
  }

  private _summarize(
    messages: Array<{ role: string; content: string }>
  ): string {
    const parts: string[] = [];
    const userMessages = messages.filter((m) => m.role === "user");
    const toolCalls = messages.filter(
      (m) => m.role === "assistant" && typeof m.content === "string" && m.content.includes("tool_calls")
    );

    parts.push(`- ${messages.length} messages exchanged`);
    parts.push(`- ${userMessages.length} user requests`);
    parts.push(`- ${toolCalls.length} tool interactions`);

    const decisions = this._extractDecisions(messages);
    if (decisions.length > 0) {
      parts.push(`- Key decisions: ${decisions.length}`);
    }

    return parts.join("\n");
  }

  private _extractDecisions(
    messages: Array<{ role: string; content: string }>
  ): string[] {
    const decisions: string[] = [];
    const decisionPatterns = [
      /decided to/i,
      /chose to/i,
      /will use/i,
      /going with/i,
      /selected/i,
      /implemented/i,
    ];

    for (const msg of messages) {
      if (typeof msg.content !== "string") continue;
      for (const pattern of decisionPatterns) {
        if (pattern.test(msg.content)) {
          const match = msg.content.match(pattern);
          if (match && match.index !== undefined) {
            const start = Math.max(0, match.index - 20);
            const end = Math.min(msg.content.length, match.index + 50);
            decisions.push(msg.content.slice(start, end));
          }
          break;
        }
      }
    }

    return [...new Set(decisions)].slice(0, 5);
  }

  private _estimateTokens(messages: Array<{ role: string; content: string }>): number {
    return messages.reduce((sum, msg) => {
      const text = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
      return sum + Math.ceil(text.length / 4);
    }, 0);
  }
}
