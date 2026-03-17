/**
 * 工具上下文 - 提供全局的工具注册中心引用
 */

import type { ToolRegistry } from "./registry";
import type { SessionManager } from "../../session/manager";
import type { SubagentManager } from "../subagent/manager";

/**
 * 全局工具注册中心引用
 */
let globalRegistry: ToolRegistry | null = null;

/**
 * 全局会话管理器引用
 */
let globalSessionManager: SessionManager | null = null;

/**
 * 全局子智能体管理器引用
 */
let globalSubagentManager: SubagentManager | null = null;

/**
 * 设置全局工具注册中心
 */
export function setGlobalRegistry(registry: ToolRegistry | null): void {
  globalRegistry = registry;
}

/**
 * 获取全局工具注册中心
 */
export function getGlobalRegistry(): ToolRegistry | null {
  return globalRegistry;
}

/**
 * 设置全局会话管理器
 */
export function setGlobalSessionManager(sessionManager: SessionManager | null): void {
  globalSessionManager = sessionManager;
}

/**
 * 获取全局会话管理器
 */
export function getGlobalSessionManager(): SessionManager | null {
  return globalSessionManager;
}

/**
 * 设置全局子智能体管理器
 */
export function setGlobalSubagentManager(manager: SubagentManager | null): void {
  globalSubagentManager = manager;
}

/**
 * 获取全局子智能体管理器
 *
 * @throws 如果管理器未初始化
 */
export function getGlobalSubagentManager(): SubagentManager {
  if (!globalSubagentManager) {
    throw new Error("SubagentManager not initialized");
  }
  return globalSubagentManager;
}

/**
 * 清空全局上下文（主要用于测试）
 */
export function clearGlobalContext(): void {
  globalRegistry = null;
  globalSessionManager = null;
  globalSubagentManager = null;
}