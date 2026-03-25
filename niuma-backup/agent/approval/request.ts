/**
 * 审批请求处理
 *
 * 管理审批请求的创建和响应
 */

import { nanoid } from "nanoid";

import { createLogger } from "../../log";

import type {
  ApprovalRequest,
  ApprovalResponse,
  ApprovalLog,
  ApprovalStatus,
  SensitiveOperation,
} from "./types";

const logger = createLogger("approval-request");

export interface ApprovalCallback {
  (request: ApprovalRequest): Promise<ApprovalResponse>;
}

export class ApprovalRequestHandler {
  private pendingRequests: Map<string, ApprovalRequest> = new Map();
  private logs: ApprovalLog[] = [];
  private callback: ApprovalCallback | null = null;
  private timeout: number;

  constructor(timeout: number = 300000) {
    this.timeout = timeout;
  }

  setCallback(callback: ApprovalCallback): void {
    this.callback = callback;
  }

  async createRequest(
    operation: SensitiveOperation,
    context: string
  ): Promise<ApprovalRequest> {
    const request: ApprovalRequest = {
      id: nanoid(8),
      operation,
      context,
      requestedAt: new Date().toISOString(),
      timeout: this.timeout,
      status: "pending",
    };

    this.pendingRequests.set(request.id, request);

    logger.info(
      { requestId: request.id, operationType: operation.type, severity: operation.severity },
      "审批请求创建"
    );

    return request;
  }

  async waitForResponse(requestId: string): Promise<ApprovalResponse> {
    const request = this.pendingRequests.get(requestId);

    if (!request) {
      return {
        requestId,
        approved: false,
        comment: "Request not found",
        respondedAt: new Date().toISOString(),
      };
    }

    if (this.callback) {
      try {
        const response = await Promise.race([
          this.callback(request),
          this._timeout(request.timeout),
        ]);

        this._updateRequestStatus(requestId, response.approved ? "approved" : "denied");
        this._logDecision(request, response);

        return response;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (message === "timeout") {
          this._updateRequestStatus(requestId, "timeout");
          return {
            requestId,
            approved: false,
            comment: "Approval timeout",
            respondedAt: new Date().toISOString(),
          };
        }

        throw error;
      }
    }

    return {
      requestId,
      approved: false,
      comment: "No callback configured",
      respondedAt: new Date().toISOString(),
    };
  }

  approve(requestId: string, comment?: string): ApprovalResponse {
    const request = this.pendingRequests.get(requestId);

    if (!request) {
      return {
        requestId,
        approved: false,
        comment: "Request not found",
        respondedAt: new Date().toISOString(),
      };
    }

    const response: ApprovalResponse = {
      requestId,
      approved: true,
      comment,
      respondedAt: new Date().toISOString(),
    };

    this._updateRequestStatus(requestId, "approved");
    this._logDecision(request, response);

    return response;
  }

  deny(requestId: string, comment?: string): ApprovalResponse {
    const request = this.pendingRequests.get(requestId);

    if (!request) {
      return {
        requestId,
        approved: false,
        comment: "Request not found",
        respondedAt: new Date().toISOString(),
      };
    }

    const response: ApprovalResponse = {
      requestId,
      approved: false,
      comment,
      respondedAt: new Date().toISOString(),
    };

    this._updateRequestStatus(requestId, "denied");
    this._logDecision(request, response);

    return response;
  }

  getPendingRequests(): ApprovalRequest[] {
    return Array.from(this.pendingRequests.values()).filter(
      (r) => r.status === "pending"
    );
  }

  getLogs(): ApprovalLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  private _updateRequestStatus(
    requestId: string,
    status: ApprovalStatus
  ): void {
    const request = this.pendingRequests.get(requestId);
    if (request) {
      request.status = status;
      this.pendingRequests.set(requestId, request);

      logger.debug(
        { requestId, status },
        "审批请求状态更新"
      );
    }
  }

  private _logDecision(
    request: ApprovalRequest,
    response: ApprovalResponse
  ): void {
    const log: ApprovalLog = {
      requestId: request.id,
      operation: request.operation,
      decision: request.status,
      comment: response.comment,
      timestamp: response.respondedAt,
    };

    this.logs.push(log);

    logger.info(
      {
        requestId: request.id,
        operationType: request.operation.type,
        decision: request.status,
      },
      "审批决策已记录"
    );
  }

  private _timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("timeout"));
      }, ms);
    });
  }
}
