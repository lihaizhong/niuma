/**
 * 异步消息队列 - 用于消息缓冲
 */

// ============================================
// AsyncQueue 类
// ============================================

/**
 * 用于消息缓冲的通用异步队列
 */
export class AsyncQueue<T = unknown> {
  protected queue: T[] = []
  protected waitingResolvers: Array<(value: T) => void> = []

  /**
   * 添加项目到队列
   */
  enqueue(item: T): void {
    // 如果有人在等待，直接给他们
    if (this.waitingResolvers.length > 0) {
      const resolver = this.waitingResolvers.shift()!
      resolver(item)
    } else {
      this.queue.push(item)
    }
  }

  /**
   * 从队列移除并返回下一个项目
   */
  async dequeue(): Promise<T> {
    if (this.queue.length > 0) {
      return this.queue.shift()!
    }

    // 等待项目入队
    return new Promise((resolve) => {
      this.waitingResolvers.push(resolve)
    })
  }

  /**
   * 查看队首项目（不移除）
   */
  peek(): T | undefined {
    return this.queue[0]
  }

  /**
   * 获取队列大小
   */
  get size(): number {
    return this.queue.length
  }

  /**
   * 检查队列是否为空
   */
  get isEmpty(): boolean {
    return this.queue.length === 0
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = []
    // 拒绝所有等待的 resolver（它们会得到 undefined）
    this.waitingResolvers = []
  }

  /**
   * 获取所有项目（不移除）
   */
  peekAll(): T[] {
    return [...this.queue]
  }

  /**
   * 使用处理器处理所有项目
   */
  async processAll(handler: (item: T) => Promise<void> | void): Promise<void> {
    while (this.queue.length > 0) {
      const item = this.queue.shift()!
      await handler(item)
    }
  }

  /**
   * 创建队列的异步迭代器
   */
  async *[Symbol.asyncIterator](): AsyncGenerator<T> {
    while (true) {
      yield await this.dequeue()
    }
  }
}

// ============================================
// BoundedQueue 类
// ============================================

/**
 * 带最大容量限制的队列
 */
export class BoundedQueue<T = unknown> extends AsyncQueue<T> {
  private maxSize: number
  private droppedCount = 0

  constructor(maxSize: number = 1000) {
    super()
    this.maxSize = maxSize
  }

  /**
   * 添加项目到队列
   * 如果队列已满，返回 false（项目被丢弃）
   */
  override enqueue(item: T): boolean {
    if (this.size >= this.maxSize) {
      this.droppedCount++
      return false
    }
    super.enqueue(item)
    return true
  }

  /**
   * 获取已丢弃项目数量
   */
  get dropped(): number {
    return this.droppedCount
  }

  /**
   * 获取最大容量
   */
  get max(): number {
    return this.maxSize
  }

  /**
   * 检查队列是否已满
   */
  get isFull(): boolean {
    return this.queue.length >= this.maxSize
  }
}

// ============================================
// PriorityQueue 类
// ============================================

/** 优先级队列项目 */
interface PriorityItem<T> {
  item: T
  priority: number
}

/**
 * 优先级队列
 * 优先级数值越小，优先级越高
 */
export class PriorityQueue<T = unknown> {
  private heap: PriorityItem<T>[] = []

  /**
   * 添加项目到队列
   */
  enqueue(item: T, priority: number = 0): void {
    this.heap.push({ item, priority })
    this.bubbleUp(this.heap.length - 1)
  }

  /**
   * 移除并返回最高优先级项目
   */
  dequeue(): T | undefined {
    if (this.heap.length === 0) {
      return undefined
    }

    const top = this.heap[0]
    const last = this.heap.pop()!

    if (this.heap.length > 0) {
      this.heap[0] = last
      this.bubbleDown(0)
    }

    return top.item
  }

  /**
   * 查看最高优先级项目
   */
  peek(): T | undefined {
    return this.heap[0]?.item
  }

  /**
   * 获取队列大小
   */
  get size(): number {
    return this.heap.length
  }

  /**
   * 检查队列是否为空
   */
  get isEmpty(): boolean {
    return this.heap.length === 0
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.heap = []
  }

  // ============================================
  // 私有方法
  // ============================================

  /**
   * 向上冒泡（维护堆性质）
   */
  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)
      if (this.heap[parentIndex].priority <= this.heap[index].priority) {
        break
      }
      this.swap(parentIndex, index)
      index = parentIndex
    }
  }

  /**
   * 向下冒泡（维护堆性质）
   */
  private bubbleDown(index: number): void {
    while (true) {
      const leftChild = 2 * index + 1
      const rightChild = 2 * index + 2
      let smallest = index

      if (
        leftChild < this.heap.length &&
        this.heap[leftChild].priority < this.heap[smallest].priority
      ) {
        smallest = leftChild
      }

      if (
        rightChild < this.heap.length &&
        this.heap[rightChild].priority < this.heap[smallest].priority
      ) {
        smallest = rightChild
      }

      if (smallest === index) {
        break
      }

      this.swap(index, smallest)
      index = smallest
    }
  }

  /**
   * 交换两个位置的项目
   */
  private swap(i: number, j: number): void {
    const temp = this.heap[i]
    this.heap[i] = this.heap[j]
    this.heap[j] = temp
  }
}