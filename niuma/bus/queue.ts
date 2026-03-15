/**
 * 异步消息队列 - 用于消息缓冲
 */

/**
 * 用于消息缓冲的通用异步队列
 */
export class AsyncQueue<T = unknown> {
  /** 存储队列项目的数组 */
  private queue: T[] = [];
  /** 等待取值的 Promise 解析器数组 */
  private waitingResolvers: Array<(value: T) => void> = [];
  /** 队列最大容量，0 表示无限制 */
  private maxSize: number;

  /**
   * 创建异步队列实例
   * @param maxSize 最大队列大小，0 表示无限制
   */
  constructor(maxSize: number = 0) {
    this.maxSize = maxSize;
  }

  /**
   * 获取队列大小
   */
  get size(): number {
    return this.queue.length;
  }

  /**
   * 检查队列是否为空
   */
  get isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * 添加项目到队列
   * @throws 如果队列已满且 maxSize > 0
   */
  enqueue(item: T): void {
    if (this.maxSize > 0 && this.queue.length >= this.maxSize) {
      throw new Error("队列已满");
    }

    if (this.waitingResolvers.length > 0) {
      this.waitingResolvers.shift()!(item);
    } else {
      this.queue.push(item);
    }
  }

  /**
   * 从队列移除并返回下一个项目
   */
  async dequeue(): Promise<T> {
    if (this.queue.length > 0) {
      return this.queue.shift()!;
    }
    return new Promise((resolve) => {
      this.waitingResolvers.push(resolve);
    });
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = [];
    this.waitingResolvers = [];
  }
}
