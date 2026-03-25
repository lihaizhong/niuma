/**
 * 工具调用拦截器
 *
 * 拦截指定的工具调用并路由到沙箱执行
 */

import { createLogger } from "../../log";

import type { SandboxManager } from "./manager";
import type { ToolCall } from "../../types/tool";

const logger = createLogger("sandbox-interceptor");

export interface InterceptorConfig {
  enabled: boolean;
  interceptedTools: string[];
  fallbackToDirect: boolean;
}

export const DEFAULT_INTERCEPTOR_CONFIG: InterceptorConfig = {
  enabled: true,
  interceptedTools: ["exec", "bash", "shell"],
  fallbackToDirect: true,
};

export class ToolInterceptor {
  private sandboxManager: SandboxManager | null = null;
  private config: InterceptorConfig;
  private directExecutor?: (
    toolCall: ToolCall
  ) => Promise<string>;

  constructor(config: Partial<InterceptorConfig> = {}) {
    this.config = { ...DEFAULT_INTERCEPTOR_CONFIG, ...config };
  }

  setSandboxManager(manager: SandboxManager): void {
    this.sandboxManager = manager;
    logger.info({ manager: "SandboxManager" }, "沙箱管理器已设置");
  }

  setDirectExecutor(
    executor: (toolCall: ToolCall) => Promise<string>
  ): void {
    this.directExecutor = executor;
    logger.info("直接执行器已设置");
  }

  shouldIntercept(toolName: string): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const lowerName = toolName.toLowerCase();
    return this.config.interceptedTools.some(
      (t) => t.toLowerCase() === lowerName
    );
  }

  async intercept(toolCall: ToolCall): Promise<string> {
    if (!this.shouldIntercept(toolCall.name)) {
      return this._executeDirect(toolCall);
    }

    if (!this.sandboxManager) {
      logger.warn(
        { toolName: toolCall.name },
        "沙箱管理器未设置，回退到直接执行"
      );
      return this._executeDirect(toolCall);
    }

    try {
      const result = await this.sandboxManager.executeToolCall(toolCall);
      logger.debug(
        { toolName: toolCall.name, exitCode: result.exitCode },
        "沙箱执行成功"
      );
      return result.stdout || result.stderr;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error({ toolName: toolCall.name, error: message }, "沙箱执行失败");

      if (this.config.fallbackToDirect) {
        logger.info({ toolName: toolCall.name }, "回退到直接执行");
        return this._executeDirect(toolCall);
      }

      throw error;
    }
  }

  private async _executeDirect(toolCall: ToolCall): Promise<string> {
    if (!this.directExecutor) {
      throw new Error(
        `工具 ${toolCall.name} 需要沙箱执行但沙箱不可用，且未配置直接执行器`
      );
    }

    return this.directExecutor(toolCall);
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  getInterceptedTools(): string[] {
    return [...this.config.interceptedTools];
  }

  addInterceptedTool(toolName: string): void {
    if (!this.config.interceptedTools.includes(toolName)) {
      this.config.interceptedTools.push(toolName);
    }
  }

  removeInterceptedTool(toolName: string): void {
    const index = this.config.interceptedTools.findIndex(
      (t) => t.toLowerCase() === toolName.toLowerCase()
    );
    if (index !== -1) {
      this.config.interceptedTools.splice(index, 1);
    }
  }
}
