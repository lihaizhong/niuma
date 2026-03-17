/**
 * 异步队列测试
 */

// ==================== 第三方库 ====================
import { describe, it, expect, beforeEach } from "vitest";

// ==================== 本地模块 ====================
import { AsyncQueue } from "../bus/queue";

describe("AsyncQueue", () => {
  let queue: AsyncQueue<number>;

  beforeEach(() => {
    queue = new AsyncQueue<number>();
  });

  describe("基本操作", () => {
    it("应该创建空队列", () => {
      expect(queue.size).toBe(0);
      expect(queue.isEmpty).toBe(true);
    });

    it("应该添加项目到队列", () => {
      queue.enqueue(1);
      expect(queue.size).toBe(1);
      expect(queue.isEmpty).toBe(false);
    });

    it("应该按 FIFO 顺序返回项目", async () => {
      queue.enqueue(1);
      queue.enqueue(2);
      queue.enqueue(3);

      expect(await queue.dequeue()).toBe(1);
      expect(await queue.dequeue()).toBe(2);
      expect(await queue.dequeue()).toBe(3);
    });

    it("应该在取出项目后减少队列大小", async () => {
      queue.enqueue(1);
      queue.enqueue(2);

      await queue.dequeue();

      expect(queue.size).toBe(1);
    });
  });

  describe("等待特性", () => {
    it("dequeue 应该等待项目加入", async () => {
      const dequeuePromise = queue.dequeue();

      // 队列应该为空（正在等待）
      expect(queue.size).toBe(0);

      // 稍后添加项目
      setTimeout(() => queue.enqueue(42), 10);

      const result = await dequeuePromise;
      expect(result).toBe(42);
    });

    it("多个 dequeue 应该按顺序等待", async () => {
      const promise1 = queue.dequeue();
      const promise2 = queue.dequeue();
      const promise3 = queue.dequeue();

      // 添加三个项目
      queue.enqueue(1);
      queue.enqueue(2);
      queue.enqueue(3);

      const results = await Promise.all([promise1, promise2, promise3]);
      expect(results).toEqual([1, 2, 3]);
    });

    it("先添加的项目应该立即返回", async () => {
      queue.enqueue(100);

      const result = await queue.dequeue();
      expect(result).toBe(100);
    });
  });

  describe("clear", () => {
    it("应该清空队列", () => {
      queue.enqueue(1);
      queue.enqueue(2);
      queue.enqueue(3);

      queue.clear();

      expect(queue.size).toBe(0);
      expect(queue.isEmpty).toBe(true);
    });

    it("应该取消等待中的 dequeue", async () => {
      const dequeuePromise = queue.dequeue();

      // 清空队列（包括等待中的 resolver）
      queue.clear();

      // 添加新项目，旧的 dequeue 不应该收到
      queue.enqueue(99);
      const newDequeuePromise = queue.dequeue();

      // 新的 dequeue 应该能获取到项目
      const result = await newDequeuePromise;
      expect(result).toBe(99);
    });
  });

  describe("maxSize 限制", () => {
    it("应该在超过最大容量时抛出错误", () => {
      const limitedQueue = new AsyncQueue<string>(2);

      limitedQueue.enqueue("a");
      limitedQueue.enqueue("b");

      expect(() => limitedQueue.enqueue("c")).toThrow("队列已满");
    });

    it("maxSize=0 表示无限制", () => {
      const unlimitedQueue = new AsyncQueue<number>(0);

      for (let i = 0; i < 100; i++) {
        unlimitedQueue.enqueue(i);
      }

      expect(unlimitedQueue.size).toBe(100);
    });

    it("取出项目后应该能继续添加", async () => {
      const limitedQueue = new AsyncQueue<string>(2);

      limitedQueue.enqueue("a");
      limitedQueue.enqueue("b");
      await limitedQueue.dequeue(); // 取出 "a"

      // 现在应该可以添加了
      expect(() => limitedQueue.enqueue("c")).not.toThrow();
      expect(limitedQueue.size).toBe(2);
    });
  });

  describe("泛型支持", () => {
    it("应该支持字符串类型", async () => {
      const stringQueue = new AsyncQueue<string>();
      stringQueue.enqueue("hello");
      stringQueue.enqueue("world");

      expect(await stringQueue.dequeue()).toBe("hello");
      expect(await stringQueue.dequeue()).toBe("world");
    });

    it("应该支持对象类型", async () => {
      const objectQueue = new AsyncQueue<{ id: number; name: string }>();

      objectQueue.enqueue({ id: 1, name: "first" });
      objectQueue.enqueue({ id: 2, name: "second" });

      const result1 = await objectQueue.dequeue();
      expect(result1).toEqual({ id: 1, name: "first" });

      const result2 = await objectQueue.dequeue();
      expect(result2).toEqual({ id: 2, name: "second" });
    });
  });

  describe("边界情况", () => {
    it("应该处理连续的添加和移除", async () => {
      for (let i = 0; i < 10; i++) {
        queue.enqueue(i);
        expect(await queue.dequeue()).toBe(i);
      }

      expect(queue.isEmpty).toBe(true);
    });

    it("应该处理大量项目", async () => {
      const count = 1000;

      for (let i = 0; i < count; i++) {
        queue.enqueue(i);
      }

      expect(queue.size).toBe(count);

      for (let i = 0; i < count; i++) {
        await queue.dequeue();
      }

      expect(queue.isEmpty).toBe(true);
    });
  });
});
