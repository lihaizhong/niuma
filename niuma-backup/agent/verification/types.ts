/**
 * 自验证循环类型定义
 */

export interface VerificationConfig {
  enabled: boolean;
  maxRetries: number;
  testCommand: string;
  successExitCodes: number[];
  timeout: number;
}

export interface VerificationResult {
  passed: boolean;
  errors?: string[];
  output: string;
  duration: number;
}

export interface VerificationRequest {
  taskId: string;
  taskName: string;
  context?: string;
  testCommand?: string;
}

export interface ErrorInjection {
  originalError: string;
  testOutput: string;
  suggestion?: string;
  retryCount: number;
  maxRetries: number;
}

export interface VerificationLoopState {
  taskId: string;
  retryCount: number;
  lastResult?: VerificationResult;
  errors: string[];
}

export const DEFAULT_VERIFICATION_CONFIG: VerificationConfig = {
  enabled: false,
  maxRetries: 3,
  testCommand: "npm test",
  successExitCodes: [0],
  timeout: 60000,
};
