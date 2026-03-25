/**
 * Human-in-the-Loop 审批模块
 *
 * 提供敏感操作审批机制
 */

import { createLogger } from "../../log";

import { OperationDetector } from "./detector";
import { ApprovalRequestHandler } from "./request";
import { DEFAULT_APPROVAL_CONFIG } from "./types";

import type {
  ApprovalConfig,
  ApprovalRequest,
  ApprovalResponse,
  ApprovalLog,
  SensitiveOperation,
} from "./types";

const logger = createLogger("human-in-the-loop");

export interface HumanInTheLoopOptions {
  config?: Partial<ApprovalConfig>;
}

export class HumanInTheLoop {
  private config: ApprovalConfig;
  private detector: OperationDetector;
  private requestHandler: ApprovalRequestHandler;

  constructor(options: HumanInTheLoopOptions = {}) {
    this.config = { ...DEFAULT_APPROVAL_CONFIG, ...options.config };
    this.detector = new OperationDetector(
      this.config.sensitivePatterns,
      this.config.autoApproveBelowSeverity
    );
    this.requestHandler = new ApprovalRequestHandler(
      this.config.approvalTimeout
    );
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  enable(): void {
    this.config.enabled = true;
    logger.info("Human-in-the-Loop 已启用");
  }

  disable(): void {
    this.config.enabled = false;
    logger.info("Human-in-the-Loop 已禁用");
  }

  detectSensitiveOperation(
    toolName: string,
    args: Record<string, unknown>
  ): { shouldBlock: boolean; operation?: SensitiveOperation } {
    if (!this.config.enabled) {
      return { shouldBlock: false };
    }

    const result = this.detector.detect(toolName, args);

    if (!result.isSensitive) {
      return { shouldBlock: false };
    }

    if (result.autoApprove) {
      logger.debug(
        { operationType: result.operation?.type },
        "操作自动批准"
      );
      return { shouldBlock: false };
    }

    return {
      shouldBlock: true,
      operation: result.operation,
    };
  }

  async requestApproval(
    operation: SensitiveOperation,
    context: string
  ): Promise<ApprovalResponse> {
    const request = await this.requestHandler.createRequest(operation, context);
    return this.requestHandler.waitForResponse(request.id);
  }

  setApprovalCallback(
    callback: (request: ApprovalRequest) => Promise<ApprovalResponse>
  ): void {
    this.requestHandler.setCallback(callback);
  }

  approve(requestId: string, comment?: string): ApprovalResponse {
    return this.requestHandler.approve(requestId, comment);
  }

  deny(requestId: string, comment?: string): ApprovalResponse {
    return this.requestHandler.deny(requestId, comment);
  }

  getPendingRequests(): ApprovalRequest[] {
    return this.requestHandler.getPendingRequests();
  }

  getLogs(): ApprovalLog[] {
    return this.requestHandler.getLogs();
  }

  clearLogs(): void {
    this.requestHandler.clearLogs();
  }

  addSensitivePattern(
    type: SensitiveOperation["type"],
    patterns: RegExp[],
    severity: SensitiveOperation["severity"]
  ): void {
    this.config.sensitivePatterns.push({ type, patterns, severity });
    this.detector = new OperationDetector(
      this.config.sensitivePatterns,
      this.config.autoApproveBelowSeverity
    );
    logger.debug({ type, severity }, "敏感模式已添加");
  }
}

export * from "./types";
