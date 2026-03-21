/**
 * Human-in-the-Loop 审批系统类型定义
 */

export type Severity = "low" | "medium" | "high" | "critical";

export type OperationType =
  | "file_delete"
  | "file_overwrite"
  | "network_request"
  | "db_write"
  | "deploy"
  | "env_change"
  | "command_execution";

export interface SensitiveOperation {
  type: OperationType;
  target: string;
  severity: Severity;
  details?: Record<string, unknown>;
}

export interface ApprovalRequest {
  id: string;
  operation: SensitiveOperation;
  context: string;
  requestedAt: string;
  timeout: number;
  status: ApprovalStatus;
}

export type ApprovalStatus = "pending" | "approved" | "denied" | "timeout";

export interface ApprovalResponse {
  requestId: string;
  approved: boolean;
  comment?: string;
  respondedAt: string;
}

export interface ApprovalLog {
  requestId: string;
  operation: SensitiveOperation;
  decision: ApprovalStatus;
  approver?: string;
  comment?: string;
  timestamp: string;
}

export interface ApprovalConfig {
  enabled: boolean;
  approvalTimeout: number;
  autoApproveBelowSeverity: Severity;
  sensitivePatterns: SensitivePattern[];
}

export interface SensitivePattern {
  type: OperationType;
  patterns: RegExp[];
  severity: Severity;
}

export const DEFAULT_APPROVAL_CONFIG: ApprovalConfig = {
  enabled: false,
  approvalTimeout: 300000,
  autoApproveBelowSeverity: "low",
  sensitivePatterns: [
    {
      type: "file_delete",
      patterns: [/\.git/, /\.env/, /node_modules/, /dist/],
      severity: "high",
    },
    {
      type: "deploy",
      patterns: [/production/, /production\.yaml/, /deploy/],
      severity: "critical",
    },
    {
      type: "db_write",
      patterns: [/DROP/i, /DELETE.*FROM/i, /TRUNCATE/i],
      severity: "critical",
    },
  ],
};
