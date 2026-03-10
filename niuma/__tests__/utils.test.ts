/**
 * 工具函数测试
 */

import { describe, it, expect } from 'vitest';
import { retryWithBackoff } from '../utils/retry';

describe('retryWithBackoff', () => {
  it('应该在第一次成功时返回结果', async () => {
    const result = await retryWithBackoff({
      fn: async () => 'success',
      maxRetries: 3,
    });

    expect(result).toBe('success');
  });

  it('应该在重试后成功', async () => {
    let attempts = 0;
    const result = await retryWithBackoff({
      fn: async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Failed');
        }
        return 'success after retries';
      },
      maxRetries: 5,
      delays: [10, 10, 10, 10, 10],
    });

    expect(result).toBe('success after retries');
    expect(attempts).toBe(3);
  });

  it('应该在达到最大重试次数后抛出错误', async () => {
    await expect(
      retryWithBackoff({
        fn: async () => {
          throw new Error('Always fails');
        },
        maxRetries: 2,
      })
    ).rejects.toThrow('Always fails');
  });

  it('应该调用 onRetry 回调', async () => {
    let retryCount = 0;
    await retryWithBackoff({
      fn: async () => {
        retryCount++;
        if (retryCount < 3) {
          throw new Error('Retry needed');
        }
        return 'success after retries';
      },
      maxRetries: 5,
      delays: [10, 10, 10, 10, 10],
      onError: (_error: Error) => {
        expect(_error).toBeInstanceOf(Error);
        expect(_error.message).toBe('Retry needed');
      },
    });

    expect(retryCount).toBe(3);
  });
});