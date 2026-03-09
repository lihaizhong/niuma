// tool.ts
import Ajv, { ValidateFunction, ErrorObject } from 'ajv';

/**
 * 工具参数的JSON Schema定义
 */
export type ToolParameters = {
  type: 'object';
  properties?: Record<string, any>;
  required?: string[];
  [key: string]: any;
};

/**
 * 抽象工具基类
 */
export abstract class Tool {
  protected ajv: Ajv;
  protected validateFn: ValidateFunction | null = null;

  constructor() {
    this.ajv = new Ajv({ allErrors: true }); // 初始化Ajv，配置显示所有错误
  }

  /**
   * 工具名称
   */
  abstract get name(): string;

  /**
   * 工具描述
   */
  abstract get description(): string;

  /**
   * 工具参数的JSON Schema
   */
  abstract get parameters(): ToolParameters;

  /**
   * 执行工具逻辑
   */
  abstract execute(...params: unknown[]): Promise<string>;

  /**
   * 根据Schema转换参数类型（例如将字符串"123"转为数字123）
   */
  castParams(params: Record<string, any>): Record<string, any> {
    const schema = this.parameters;
    if (schema.type !== 'object') return params;
    return this._castObject(params, schema);
  }

  private _castObject(obj: any, schema: ToolParameters): Record<string, any> {
    if (typeof obj !== 'object' || obj === null) return obj;
    const props = schema.properties || {};
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      result[key] = key in props ? this._castValue(value, props[key]) : value;
    }
    return result;
  }

  private _castValue(val: any, schema: any): any {
    const targetType = schema.type;

    // 处理基本类型
    if (targetType === 'boolean' && typeof val === 'boolean') return val;
    if (targetType === 'integer' && typeof val === 'number' && Number.isInteger(val)) return val;
    if (targetType === 'number' && typeof val === 'number') return val;
    if (targetType === 'string' && typeof val === 'string') return val;

    // 字符串转整数
    if (targetType === 'integer' && typeof val === 'string') {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? val : parsed;
    }

    // 字符串转浮点数
    if (targetType === 'number' && typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? val : parsed;
    }

    // 字符串转布尔值
    if (targetType === 'boolean' && typeof val === 'string') {
      const lowerVal = val.toLowerCase();
      if (['true', '1', 'yes'].includes(lowerVal)) return true;
      if (['false', '0', 'no'].includes(lowerVal)) return false;
      return val;
    }

    // 处理数组
    if (targetType === 'array' && Array.isArray(val) && schema.items) {
      return val.map(item => this._castValue(item, schema.items));
    }

    // 处理嵌套对象
    if (targetType === 'object' && typeof val === 'object' && val !== null) {
      return this._castObject(val, schema);
    }

    return val;
  }

  /**
   * 使用Ajv验证参数，返回错误信息数组
   */
  validateParams(params: Record<string, any>): string[] {
    if (typeof params !== 'object' || params === null) {
      return [`parameters must be an object, got ${typeof params}`];
    }

    // 惰性编译验证函数
    if (!this.validateFn) {
      this.validateFn = this.ajv.compile(this.parameters);
    }

    const isValid = this.validateFn(params);
    if (isValid) return [];

    // 格式化Ajv错误信息
    return (this.validateFn.errors || []).map((err: ErrorObject) => {
      const path = err.instancePath || 'root';
      return `${path} ${err.message}`;
    });
  }

  /**
   * 生成OpenAI function schema格式
   */
  toSchema(): { type: 'function'; function: { name: string; description: string; parameters: any } } {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: this.parameters,
      },
    };
  }
}
