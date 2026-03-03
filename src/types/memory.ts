/**
 * 记忆类型定义
 */

export type MemoryType = 'preference' | 'experience' | 'knowledge' | 'task' | 'conversation';

export interface MemoryMetadata {
  type: MemoryType;
  agent?: string;
  tags?: string[];
  importance?: number; // 1-10
  source?: string;
}

export interface Memory {
  id: string;
  content: string;
  embedding?: Float32Array;
  metadata: MemoryMetadata;
  createdAt: Date;
  updatedAt?: Date;
}

export interface MemorySearchResult extends Memory {
  score: number;
}

export interface MemoryStoreConfig {
  dbPath: string;
  embeddingDimension?: number;
}
