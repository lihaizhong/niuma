/**
 * 错误注入器
 *
 * 将验证错误转换为可操作的反馈注入到 Agent 上下文
 */

import { createLogger } from "../../log";

import type { ErrorInjection, VerificationResult } from "./types";

const logger = createLogger("error-injector");

export class ErrorInjector {
  private includeSuggestions = true;

  setIncludeSuggestions(include: boolean): void {
    this.includeSuggestions = include;
  }

  inject(request: {
    taskId: string;
    taskName: string;
    result: VerificationResult;
    retryCount: number;
    maxRetries: number;
  }): ErrorInjection {
    const { taskId, taskName, result, retryCount, maxRetries } = request;

    const suggestion = this.includeSuggestions
      ? this._generateSuggestion(result)
      : undefined;

    const injection: ErrorInjection = {
      originalError: `Task "${taskName}" (${taskId}) verification failed`,
      testOutput: result.output,
      suggestion,
      retryCount,
      maxRetries,
    };

    logger.debug(
      { taskId, retryCount, maxRetries },
      "生成错误注入"
    );

    return injection;
  }

  formatForContext(injection: ErrorInjection): string {
    const lines: string[] = [];

    lines.push(`❌ **Verification Failed**`);
    lines.push(`\n**Task:** ${injection.originalError}`);
    lines.push(`\n**Attempt:** ${injection.retryCount}/${injection.maxRetries}`);

    if (injection.testOutput) {
      lines.push(`\n**Test Output:**\n\`\`\`\n${this._truncate(injection.testOutput, 2000)}\n\`\`\``);
    }

    if (injection.suggestion) {
      lines.push(`\n**Suggestion:** ${injection.suggestion}`);
    }

    if (injection.retryCount >= injection.maxRetries) {
      lines.push(`\n⚠️ **Max retries reached. Please analyze the errors and fix manually.**`);
    } else {
      lines.push(`\n🔄 Please fix the issues and try again.`);
    }

    return lines.join("");
  }

  private _generateSuggestion(result: VerificationResult): string | undefined {
    if (!result.errors || result.errors.length === 0) {
      return undefined;
    }

    const firstError = result.errors[0];

    if (firstError.includes("Cannot find module")) {
      return "Missing dependency. Run 'npm install' or check package.json.";
    }

    if (firstError.includes("SyntaxError")) {
      return "Check for syntax errors in the modified files.";
    }

    if (firstError.includes("TypeError")) {
      return "Type mismatch detected. Check the type definitions.";
    }

    if (firstError.includes("ReferenceError")) {
      return "Undefined variable or function. Check imports and declarations.";
    }

    if (firstError.includes("ENOENT") || firstError.includes("not found")) {
      return "File not found. Check the file path.";
    }

    if (firstError.includes("timeout")) {
      return "Test timeout. Consider optimizing the test or increasing timeout.";
    }

    return `Error pattern: ${firstError.substring(0, 100)}`;
  }

  private _truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + "\n... (truncated)";
  }
}
