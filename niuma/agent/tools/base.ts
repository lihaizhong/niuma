/**
 * 工具框架基类和接口
 */

// ==================== 第三方库 ====================
import { z } from "zod";

// ==================== 本地模块 ====================
import type {
  ToolParameterSchema,
  OpenAIToolSchema,
  ToolDefinition,
} from "../../types";
import { getGlobalRegistry, getGlobalSessionManager } from "./context";
import type { SessionManager } from "../../session/manager";

/**
 * 所有工具必须实现的接口
 */
export interface ITool<TInput = unknown, TOutput = string> {
  readonly name: string;
  readonly description: string;
  readonly parameters: z.ZodType<TInput>;

  getDefinition(): ToolDefinition;
  toSchema(): OpenAIToolSchema;
  validateArgs(args: unknown): TInput;
  execute(args: TInput): Promise<TOutput>;
}

/**
 * 将 Zod 类型转换为 JSON Schema 参数格式
 */
export function zodToParameter(
  zodType: z.ZodType<unknown>,
): ToolParameterSchema {
  const jsonSchema = z.toJSONSchema(zodType);
  // 移除不需要的字段
  const { $schema, additionalProperties, ...result } = jsonSchema as Record<
    string,
    unknown
  >;
  return result as ToolParameterSchema;
}

/**
 * 工具抽象基类
 */
export abstract class BaseTool<
  TInput = unknown,
  TOutput = string,
> implements ITool<TInput, TOutput> {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly parameters: z.ZodType<TInput>;

  /**
   * 获取当前 Agent ID
   */
  protected getAgentId(): string {
    const registry = getGlobalRegistry();
    return registry?.getAgentId() || "default";
  }

  /**
   * 获取会话管理器
   */
  protected getSessionManager(): SessionManager | null {
    return getGlobalSessionManager();
  }

  /**
   * 获取工具定义（内部格式）
   */
  getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters,
    };
  }

  /**
   * 转换为 OpenAI 函数 Schema 格式
   */
  toSchema(): OpenAIToolSchema {
    const params = zodToParameter(this.parameters);
    return {
      type: "function",
      function: {
        name: this.name,
        description: this.description,
        parameters: {
          type: "object",
          properties: params.properties || {},
          required: params.required,
        },
      },
    };
  }

  /**
   * 验证输入参数
   */
  validateArgs(args: unknown): TInput {
    const result = this.parameters.safeParse(args);
    if (!result.success) {
      throw new Error(`参数无效: ${result.error?.message || "验证失败"}`);
    }
    return result.data as TInput;
  }

  /**
   * 执行工具（必须由子类实现）
   */
  abstract execute(args: TInput): Promise<TOutput>;
}

/**
 * 基于函数的简单工具实现
 */
export class SimpleTool<TInput = unknown, TOutput = string> extends BaseTool<
  TInput,
  TOutput
> {
  readonly name: string;
  readonly description: string;
  readonly parameters: z.ZodType<TInput>;

  private readonly handler: (args: TInput) => Promise<TOutput>;

  constructor(options: {
    name: string;
    description: string;
    parameters: z.ZodType<TInput>;
    handler: (args: TInput) => Promise<TOutput>;
  }) {
    super();
    this.name = options.name;
    this.description = options.description;
    this.parameters = options.parameters;
    this.handler = options.handler;
  }

  async execute(args: TInput): Promise<TOutput> {
    return this.handler(args);
  }
}
