/**
 * 重试工具
 * @description 提供通用的重试逻辑，支持指数退避
 */

/** 默认重试延迟（毫秒），指数退避 */
const DEFAULT_DELAYS = [1000, 2000, 4000, 8000]

/**
 * 重试选项
 */
export interface RetryOptions<T> {
  /** 最大重试次数 */
  maxRetries: number
  /** 重试延迟（毫秒），支持数组实现指数退避（可选，默认使用指数退避） */
  delays?: number[]
  /** 执行函数 */
  fn: (attempt: number) => Promise<T>
  /** 错误处理回调（可选） */
  onError?: (error: Error, attempt: number) => void
}

/**
 * 带重试机制的异步执行
 * @param options 重试选项
 * @returns 执行结果
 * @throws 最后一次错误
 *
 * @example
 * ```typescript
 * // 使用默认延迟（指数退避）
 * const result = await retryWithBackoff({
 *   maxRetries: 4,
 *   fn: async (attempt) => {
 *     return await someAsyncOperation()
 *   },
 *   onError: (error, attempt) => {
 *     console.error(`尝试 ${attempt} 失败: ${error.message}`)
 *   }
 * })
 *
 * // 自定义延迟
 * const result = await retryWithBackoff({
 *   maxRetries: 3,
 *   delays: [500, 1000, 2000],
 *   fn: async (attempt) => {
 *     return await someAsyncOperation()
 *   }
 * })
 * ```
 */
export async function retryWithBackoff<T>(options: RetryOptions<T>): Promise<T> {
  const { maxRetries, delays = DEFAULT_DELAYS, fn, onError } = options
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn(attempt)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (onError) {
        onError(lastError, attempt)
      }

      // 如果还有重试机会，等待后重试
      if (attempt < maxRetries - 1) {
        const delay = delays[attempt] ?? delays[delays.length - 1]
        await sleep(delay)
      }
    }
  }

  throw lastError ?? new Error('重试失败')
}

/**
 * 异步等待
 * @param ms 等待毫秒数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}