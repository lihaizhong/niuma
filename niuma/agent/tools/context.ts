/**
 * 工具上下文 - 提供全局的工具注册中心引用
 */

import type { ToolRegistry } from "./registry";
import type { SessionManager } from "../../session/manager";

/**
 * 全局工具注册中心引用
 */
let globalRegistry: ToolRegistry | null = null;

/**
 * 全局会话管理器引用
 */
let globalSessionManager: SessionManager | null = null;

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
 * 清空全局上下文（主要用于测试）
 */
export function clearGlobalContext(): void {
  globalRegistry = null;
  globalSessionManager = null;
}