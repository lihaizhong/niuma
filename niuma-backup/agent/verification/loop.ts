/**
 * 自验证循环 - 核心验证引擎
 *
 * 执行测试验证并在失败时提供重试机制
 */

import { createLogger } from "../../log";

import { ErrorInjector } from "./error-injector";
import { DEFAULT_VERIFICATION_CONFIG } from "./types";

import type {
  VerificationConfig,
  VerificationResult,
  VerificationRequest,
  ErrorInjection,
  VerificationLoopState,
} from "./types";

const logger = createLogger("verification-loop");

export interface TestExecutor {
  execute(command: string, options?: {
    cwd?: string;
    timeout?: number;
  }): Promise<{ stdout: string; stderr: string; exitCode: number }>;
}

export interface SelfVerificationOptions {
  config?: Partial<VerificationConfig>;
  testExecutor?: TestExecutor;
  workspace?: string;
}

export class SelfVerification {
  private config: VerificationConfig;
  private testExecutor: TestExecutor | null = null;
  private workspace: string;
  private errorInjector: ErrorInjector;
  private activeStates: Map<string, VerificationLoopState> = new Map();

  constructor(options: SelfVerificationOptions = {}) {
    this.config = { ...DEFAULT_VERIFICATION_CONFIG, ...options.config };
    this.workspace = options.workspace ?? process.cwd();
    this.errorInjector = new ErrorInjector();

    if (options.testExecutor) {
      this.testExecutor = options.testExecutor;
    }
  }

  setTestExecutor(executor: TestExecutor): void {
    this.testExecutor = executor;
  }

  setWorkspace(workspace: string): void {
    this.workspace = workspace;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  enable(): void {
    this.config.enabled = true;
    logger.info("自验证循环已启用");
  }

  disable(): void {
    this.config.enabled = false;
    logger.info("自验证循环已禁用");
  }

  async verify(request: VerificationRequest): Promise<VerificationResult> {
    if (!this.config.enabled) {
      return {
        passed: true,
        output: "Verification disabled",
        duration: 0,
      };
    }

    const testCommand = request.testCommand ?? this.config.testCommand;
    const startTime = Date.now();

    try {
      const result = await this._executeTest(testCommand);
      const duration = Date.now() - startTime;

      const verificationResult: VerificationResult = {
        passed: this.config.successExitCodes.includes(result.exitCode),
        output: result.stdout + "\n" + result.stderr,
        duration,
      };

      if (!verificationResult.passed) {
        verificationResult.errors = this._extractErrors(result.stderr);
      }

      logger.info(
        {
          taskId: request.taskId,
          passed: verificationResult.passed,
          exitCode: result.exitCode,
          duration,
        },
        "验证完成"
      );

      return verificationResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);

      logger.error({ taskId: request.taskId, error: message }, "验证执行失败");

      return {
        passed: false,
        errors: [message],
        output: `Verification error: ${message}`,
        duration,
      };
    }
  }

  async verifyWithRetry(request: VerificationRequest): Promise<{
    result: VerificationResult;
    shouldRetry: boolean;
    errorInjection?: ErrorInjection;
  }> {
    if (!this.config.enabled) {
      return {
        result: { passed: true, output: "Verification disabled", duration: 0 },
        shouldRetry: false,
      };
    }

    const state = this._getOrCreateState(request.taskId);

    const result = await this.verify({
      ...request,
      testCommand: request.testCommand ?? this.config.testCommand,
    });

    state.lastResult = result;

    if (result.passed) {
      this._clearState(request.taskId);
      return { result, shouldRetry: false };
    }

    state.retryCount++;
    state.errors.push(...(result.errors ?? []));

    if (state.retryCount >= this.config.maxRetries) {
      this._clearState(request.taskId);
      logger.warn(
        { taskId: request.taskId, retries: state.retryCount },
        "达到最大重试次数"
      );
      return {
        result,
        shouldRetry: false,
        errorInjection: this.errorInjector.inject({
          taskId: request.taskId,
          taskName: request.taskName,
          result,
          retryCount: state.retryCount,
          maxRetries: this.config.maxRetries,
        }),
      };
    }

    const errorInjection = this.errorInjector.inject({
      taskId: request.taskId,
      taskName: request.taskName,
      result,
      retryCount: state.retryCount,
      maxRetries: this.config.maxRetries,
    });

    return { result, shouldRetry: true, errorInjection };
  }

  getState(taskId: string): VerificationLoopState | undefined {
    return this.activeStates.get(taskId);
  }

  resetState(taskId: string): void {
    this._clearState(taskId);
  }

  private _getOrCreateState(taskId: string): VerificationLoopState {
    let state = this.activeStates.get(taskId);

    if (!state) {
      state = {
        taskId,
        retryCount: 0,
        errors: [],
      };
      this.activeStates.set(taskId, state);
    }

    return state;
  }

  private _clearState(taskId: string): void {
    this.activeStates.delete(taskId);
  }

  private async _executeTest(
    command: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    if (this.testExecutor) {
      return this.testExecutor.execute(command, {
        cwd: this.workspace,
        timeout: this.config.timeout,
      });
    }

    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({
          stdout: "",
          stderr: `Command timeout after ${this.config.timeout}ms`,
          exitCode: 124,
        });
      }, this.config.timeout);

      execAsync(command, { cwd: this.workspace })
        .then((result) => {
          clearTimeout(timeoutId);
          resolve({
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: 0,
          });
        })
        .catch((error: Error & { code?: number }) => {
          clearTimeout(timeoutId);
          resolve({
            stdout: "",
            stderr: error.message,
            exitCode: error.code ?? 1,
          });
        });
    });
  }

  private _extractErrors(output: string): string[] {
    const lines = output.split("\n");
    const errors: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.includes("FAIL") ||
        trimmed.includes("Error") ||
        trimmed.includes("FAILED") ||
        trimmed.includes("failed")
      ) {
        errors.push(trimmed);
      }
    }

    return errors.length > 0 ? errors : ["Unknown error"];
  }
}
