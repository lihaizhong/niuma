/**
 * 子智能体模块 - 共享类型定义
 */

// ==================== 外部类型导入 ====================

import type { EventBus } from "../../bus/events";
import type { LLMProvider } from "../../providers/base";
import type { ChatMessage, ToolCall, OutboundMessage, ToolDefinition } from "../../types";
import type { ToolRegistry } from "../tools/registry";

// ==================== 导出外部类型 ====================

export type { EventBus, LLMProvider, ChatMessage, ToolCall, OutboundMessage, ToolDefinition, ToolRegistry };

// ==================== 类型定义 ====================

/**
 * 任务执行状态
 */
export type TaskStatus = "success" | "error" | "cancelled";

/**
 * 任务完成结果
 */
export interface TaskResult {
  /** 状态 */
  status: TaskStatus;
  /** 结果内容 */
  content: string;
  /** 错误信息 */
  error?: string;
}

/**
 * 子智能体创建选项
 */
export interface SubagentSpawnOptions {
  /** 任务描述 */
  task: string;
  /** 任务标签（用于显示） */
  label?: string;
  /** 来源渠道 */
  originChannel: string;
  /** 来源聊天 ID */
  originChatId: string;
  /** 会话键（用于任务关联） */
  sessionKey?: string;
}

/**
 * 运行中的子智能体任务
 */
export interface RunningTask {
  /** 任务 ID */
  taskId: string;
  /** 任务描述 */
  task: string;
  /** 任务标签 */
  label: string;
  /** 来源渠道 */
  originChannel: string;
  /** 来源聊天 ID */
  originChatId: string;
  /** 会话键 */
  sessionKey?: string;
  /** AbortController 用于取消任务 */
  controller: AbortController;
  /** 任务 Promise */
  promise: Promise<void>;
  /** 开始时间 */
  startTime: number;
}

/**
 * 任务信息（对外展示）
 */
export interface TaskInfo {
  taskId: string;
  task: string;
  label: string;
  startTime: number;
  duration: number;
}

/**
 * 任务来源信息
 */
export interface TaskOrigin {
  channel: string;
  chatId: string;
}

// ==================== SubagentExecutor 类型 ====================

/**
 * SubagentExecutor 配置
 */
export interface SubagentExecutorConfig {
  /** LLM 提供商 */
  provider: LLMProvider;
  /** 工具注册表 */
  tools: ToolRegistry;
  /** 工作空间路径 */
  workspace?: string;
  /** 模型名称 */
  model?: string;
  /** 采样温度 */
  temperature?: number;
  /** 最大 token 数 */
  maxTokens?: number;
}

/**
 * 执行选项
 */
export interface ExecuteOptions {
  /** 任务 ID */
  taskId: string;
  /** 任务描述 */
  task: string;
  /** 任务标签 */
  label: string;
  /** 任务来源 */
  origin: TaskOrigin;
  /** 取消信号 */
  signal?: AbortSignal;
}

/**
 * 执行结果
 */
export interface ExecuteResult {
  /** 状态 */
  status: TaskStatus;
  /** 结果内容 */
  content: string;
  /** 错误信息 */
  error?: string;
}

// ==================== SubagentManager 类型 ====================

/**
 * SubagentManager 配置
 */
export interface SubagentManagerConfig {
  /** 执行器 */
  executor: ISubagentExecutor;
  /** 事件总线 */
  bus: EventBus;
  /** 最大并发数 */
  maxConcurrent?: number;
  /** 任务超时（毫秒） */
  taskTimeout?: number;
}

// ==================== 前向声明 ====================

/**
 * SubagentExecutor 接口定义
 */
export interface ISubagentExecutor {
  execute(options: ExecuteOptions): Promise<ExecuteResult>;
  getIsolatedTools(): ToolDefinition[];
  buildSystemPrompt(): string;
}

// ==================== 常量 ====================

/**
 * 子智能体最大迭代次数
 */
export const MAX_ITERATIONS = 15;

/**
 * 最大并发子智能体数量
 */
export const MAX_CONCURRENT_TASKS = 5;

/**
 * 子智能体任务超时时间（毫秒）
 */
export const TASK_TIMEOUT = 10 * 60 * 1000;

/**
 * 子智能体 System Prompt
 */
export const SUBAGENT_SYSTEM_PROMPT = `你是一个专业的后台任务执行助手。你的职责是独立完成分配给你的任务。

## 工作模式

1. 你是一个独立的执行单元，不能与用户直接交互
2. 专注于完成任务，使用可用工具进行操作
3. 任务完成后，提供简洁明确的结果摘要
4. 如果遇到无法解决的问题，清晰说明原因

## 行为准则

- 不询问用户问题，基于现有信息做出合理推断
- 优先使用工具完成任务
- 保持输出简洁，聚焦于任务目标
- 如果任务超出你的能力范围，明确说明

## 工作空间

你可以在指定的目录中读写文件，执行命令，完成开发任务。

## 输出要求

任务完成时，提供：
1. 完成的具体工作内容
2. 创建或修改的文件列表
3. 需要注意的事项（如果有）

如果任务失败，说明失败原因和建议的解决方案。`;

/**
 * 排除的工具名称集合
 * 子智能体不能使用这些工具
 */
export const EXCLUDED_TOOLS = new Set([
  "message",
  "spawn",
  "send_message",
  "create_subagent",
  "task",
  "subagent",
]);
