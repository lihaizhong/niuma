/**
 * 对象清理工具
 *
 * @description 提供安全的对象清理功能，防止原型链污染和恶意属性
 */

import { scan } from "secure-json-parse";
import * as cleaner from "fast-clean";

/**
 * 清理对象选项
 */
export interface SanitizeOptions {
  /** 是否保留 null 值（默认 true） */
  keepNull?: boolean;
  /** 是否移除空数组（默认 true） */
  removeEmptyArrays?: boolean;
  /** 是否移除空对象（默认 true） */
  removeEmptyObjects?: boolean;
  /** 是否移除空字符串（默认 true） */
  removeEmptyStrings?: boolean;
  /** 是否移除 NaN（默认 true） */
  removeNaN?: boolean;
}

/**
 * 清理对象，防止原型链污染和恶意属性
 *
 * @description 使用 secure-json-parse 防止原型污染，使用 fast-clean 清理不需要的值
 * @param obj 待清理的对象
 * @param options 清理选项
 * @returns 清理后的安全对象
 *
 * @example
 * ```typescript
 * import { sanitizeObject } from './utils/sanitize';
 *
 * const safe = sanitizeObject({
 *   '__proto__': { polluted: true },
 *   'normal': 'value',
 *   'empty': '',
 *   'null': null
 * });
 * // 结果: { normal: 'value', null: null }
 * ```
 */
export function sanitizeObject(
  obj: Record<string, unknown>,
  options: SanitizeOptions = {},
): Record<string, unknown> {
  // 使用 secure-json-parse 扫描并移除原型污染属性
  const safeObj = scan(obj, {
    protoAction: "remove",
    constructorAction: "remove",
  });

  // 使用 fast-clean 清理空值
  return cleaner.clean(safeObj, {
    nullCleaner: options.keepNull === false, // 只有明确设置为 false 时才移除 null
    emptyArraysCleaner: options.removeEmptyArrays !== false, // 默认移除
    emptyObjectsCleaner: options.removeEmptyObjects !== false, // 默认移除
    emptyStringsCleaner: options.removeEmptyStrings !== false, // 默认移除
    nanCleaner: options.removeNaN !== false, // 默认移除
  });
}