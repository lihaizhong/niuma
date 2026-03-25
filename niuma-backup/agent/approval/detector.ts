/**
 * 敏感操作检测器
 *
 * 检测需要审批的敏感操作
 */

import { createLogger } from "../../log";

import type {
  SensitiveOperation,
  SensitivePattern,
  Severity,
  OperationType,
} from "./types";

const logger = createLogger("approval-detector");

export interface DetectionResult {
  isSensitive: boolean;
  operation?: SensitiveOperation;
  autoApprove: boolean;
}

export class OperationDetector {
  private patterns: SensitivePattern[];
  private autoApproveBelowSeverity: Severity;

  constructor(
    patterns: SensitivePattern[],
    autoApproveBelowSeverity: Severity
  ) {
    this.patterns = patterns;
    this.autoApproveBelowSeverity = autoApproveBelowSeverity;
  }

  detect(toolName: string, args: Record<string, unknown>): DetectionResult {
    const operationType = this._mapToolToOperation(toolName, args);

    if (!operationType) {
      return { isSensitive: false, autoApprove: false };
    }

    const target = this._extractTarget(toolName, args);
    const severity = this._determineSeverity(operationType, target);

    const operation: SensitiveOperation = {
      type: operationType,
      target,
      severity,
    };

    if (this._matchesSensitivePattern(operation)) {
      const autoApprove = this._shouldAutoApprove(severity);

      logger.debug(
        {
          toolName,
          operationType,
          severity,
          autoApprove,
        },
        "检测到敏感操作"
      );

      return {
        isSensitive: true,
        operation,
        autoApprove,
      };
    }

    return { isSensitive: false, autoApprove: false };
  }

  private _mapToolToOperation(
    toolName: string,
    args: Record<string, unknown>
  ): OperationType | null {
    const lowerName = toolName.toLowerCase();

    if (lowerName === "exec" || lowerName === "bash") {
      const command = (args.command as string) || "";
      if (/\b(rm|del|rmdir)\b/.test(command)) {
        return "file_delete";
      }
      if (/\b(deploy| kubectl apply|helm install)\b/.test(command)) {
        return "deploy";
      }
      return "command_execution";
    }

    if (lowerName.includes("delete") || lowerName.includes("remove")) {
      return "file_delete";
    }

    if (lowerName.includes("write") || lowerName.includes("edit")) {
      const path = (args.path as string) || "";
      if (/\.env$|\.config\./.test(path)) {
        return "env_change";
      }
      return "file_overwrite";
    }

    if (lowerName.includes("network") || lowerName.includes("http")) {
      return "network_request";
    }

    if (lowerName.includes("db") || lowerName.includes("database")) {
      return "db_write";
    }

    return null;
  }

  private _extractTarget(
    toolName: string,
    args: Record<string, unknown>
  ): string {
    const path = args.path || args.paths || args.target || args.url || args.command || "";
    return String(path);
  }

  private _determineSeverity(
    type: OperationType,
    target: string
  ): Severity {
    for (const pattern of this.patterns) {
      if (pattern.type !== type) {
        continue;
      }

      for (const regex of pattern.patterns) {
        if (regex.test(target)) {
          return pattern.severity;
        }
      }
    }

    switch (type) {
      case "file_delete":
        return "medium";
      case "file_overwrite":
        return "low";
      case "network_request":
        return "medium";
      case "db_write":
        return "high";
      case "deploy":
        return "critical";
      case "env_change":
        return "high";
      case "command_execution":
        return "low";
      default:
        return "low";
    }
  }

  private _matchesSensitivePattern(operation: SensitiveOperation): boolean {
    const severityOrder: Severity[] = ["low", "medium", "high", "critical"];

    const operationSeverityIndex = severityOrder.indexOf(operation.severity);
    const autoApproveThresholdIndex = severityOrder.indexOf(
      this.autoApproveBelowSeverity
    );

    return operationSeverityIndex >= autoApproveThresholdIndex;
  }

  private _shouldAutoApprove(severity: Severity): boolean {
    const severityOrder: Severity[] = ["low", "medium", "high", "critical"];
    const operationIndex = severityOrder.indexOf(severity);
    const thresholdIndex = severityOrder.indexOf(this.autoApproveBelowSeverity);

    return operationIndex < thresholdIndex;
  }
}
