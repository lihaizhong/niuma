/**
 * 环境变量解析器
 * 支持在配置文件中引用环境变量，使用 ${VAR} 和 ${VAR:default} 语法
 */

import type { EnvVarResolverOptions } from "./schema";

// ============================================
// 函数定义
// ============================================

/**
 * 解析单个字符串中的环境变量引用
 * @param value 字符串值
 * @param env 环境变量对象
 * @param strict 是否严格模式
 * @returns 解析后的字符串
 */
function resolveStringValue(
  value: string,
  env: Record<string, string>,
  strict: boolean,
): string {
  // 匹配 ${VAR} 或 ${VAR:default} 语法
  return value.replace(
    /\$\{(\w+)(?::([^}]*))?\}/g,
    (_, varName, defaultValue) => {
      const envValue = env[varName];

      if (envValue !== undefined) {
        return envValue;
      }

      if (defaultValue !== undefined) {
        return defaultValue;
      }

      if (strict) {
        throw new Error(`环境变量 ${varName} 未定义`);
      }

      // 非严格模式，保持原样
      return `\${${varName}}`;
    },
  );
}

/**
 * 递归解析对象中的环境变量引用
 * @param obj 待解析的对象
 * @param env 环境变量对象
 * @param strict 是否严格模式
 * @returns 解析后的对象
 */
function resolveObject(
  obj: Record<string, unknown>,
  env: Record<string, string>,
  strict: boolean,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    result[key] = resolveValue(value, env, strict);
  }

  return result;
}

/**
 * 递归解析数组中的环境变量引用
 * @param arr 待解析的数组
 * @param env 环境变量对象
 * @param strict 是否严格模式
 * @returns 解析后的数组
 */
function resolveArray(
  arr: unknown[],
  env: Record<string, string>,
  strict: boolean,
): unknown[] {
  return arr.map((item) => resolveValue(item, env, strict));
}

/**
 * 递归解析值中的环境变量引用
 * @param value 待解析的值
 * @param env 环境变量对象
 * @param strict 是否严格模式
 * @returns 解析后的值
 */
function resolveValue(
  value: unknown,
  env: Record<string, string>,
  strict: boolean,
): unknown {
  if (typeof value === "string") {
    return resolveStringValue(value, env, strict);
  }

  if (Array.isArray(value)) {
    return resolveArray(value, env, strict);
  }

  if (typeof value === "object" && value !== null) {
    return resolveObject(value as Record<string, unknown>, env, strict);
  }

  return value;
}

/**
 * 解析配置对象中的环境变量引用
 * @param config 配置对象
 * @param options 解析选项
 * @returns 解析后的配置对象
 */
export function resolveEnvVars<T = unknown>(
  config: T,
  options: EnvVarResolverOptions,
): T {
  const { strict = false, env: customEnv } = options;

  // 合并环境变量：自定义环境变量 > 系统环境变量
  const env: Record<string, string> = {
    ...(process.env as Record<string, string>),
    ...customEnv,
  };

  return resolveValue(config, env, strict) as T;
}
