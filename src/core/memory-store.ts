/**
 * Memory Store - 基于 sqlite-vec 的记忆存储
 */

import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import { nanoid } from 'nanoid';
import type { Memory, MemorySearchResult, MemoryStoreConfig, MemoryMetadata } from '../types/index.js';

const DEFAULT_EMBEDDING_DIMENSION = 768;

export class MemoryStore {
  private db: Database.Database;
  private embeddingDimension: number;

  constructor(config: MemoryStoreConfig) {
    this.db = new Database(config.dbPath);
    this.embeddingDimension = config.embeddingDimension ?? DEFAULT_EMBEDDING_DIMENSION;
    this.initialize();
  }

  private initialize(): void {
    // 加载 sqlite-vec 扩展
    sqliteVec.load(this.db);

    // 创建记忆表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME
      )
    `);

    // 创建向量表
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS memory_embeddings USING vec0(
        embedding float[${this.embeddingDimension}],
        memory_id TEXT
      )
    `);

    // 创建索引（只为普通表创建索引，虚拟表不支持索引）
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_created_at ON memories(created_at);
    `);
  }

  /**
   * 添加记忆
   */
  async add(content: string, metadata: MemoryMetadata, embedding?: Float32Array): Promise<Memory> {
    const id = nanoid();
    const now = new Date();

    const memory: Memory = {
      id,
      content,
      metadata,
      createdAt: now,
    };

    const insertMemory = this.db.prepare(`
      INSERT INTO memories (id, content, metadata, created_at)
      VALUES (?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      insertMemory.run(id, content, JSON.stringify(metadata), now.toISOString());

      if (embedding) {
        const insertEmbedding = this.db.prepare(`
          INSERT INTO memory_embeddings (embedding, memory_id)
          VALUES (?, ?)
        `);
        insertEmbedding.run(embedding.buffer, id);
        memory.embedding = embedding;
      }
    });

    transaction();
    return memory;
  }

  /**
   * 语义搜索记忆
   */
  async search(queryEmbedding: Float32Array, topK: number = 5): Promise<MemorySearchResult[]> {
    const search = this.db.prepare(`
      SELECT 
        m.id,
        m.content,
        m.metadata,
        m.created_at,
        m.updated_at,
        e.distance as score
      FROM memory_embeddings e
      JOIN memories m ON e.memory_id = m.id
      WHERE e.embedding MATCH ?
      ORDER BY e.distance ASC
      LIMIT ?
    `);

    const results = search.all(queryEmbedding.buffer, topK) as Array<{
      id: string;
      content: string;
      metadata: string;
      created_at: string;
      updated_at: string | null;
      score: number;
    }>;

    return results.map((r) => ({
      id: r.id,
      content: r.content,
      metadata: JSON.parse(r.metadata) as MemoryMetadata,
      createdAt: new Date(r.created_at),
      updatedAt: r.updated_at ? new Date(r.updated_at) : undefined,
      score: r.score,
    }));
  }

  /**
   * 获取记忆 by ID
   */
  async get(id: string): Promise<Memory | null> {
    const query = this.db.prepare(`
      SELECT id, content, metadata, created_at, updated_at
      FROM memories
      WHERE id = ?
    `);

    const result = query.get(id) as {
      id: string;
      content: string;
      metadata: string;
      created_at: string;
      updated_at: string | null;
    } | undefined;

    if (!result) return null;

    return {
      id: result.id,
      content: result.content,
      metadata: JSON.parse(result.metadata) as MemoryMetadata,
      createdAt: new Date(result.created_at),
      updatedAt: result.updated_at ? new Date(result.updated_at) : undefined,
    };
  }

  /**
   * 按类型获取记忆
   */
  async getByType(type: string, limit: number = 50): Promise<Memory[]> {
    const query = this.db.prepare(`
      SELECT id, content, metadata, created_at, updated_at
      FROM memories
      WHERE json_extract(metadata, '$.type') = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const results = query.all(type, limit) as Array<{
      id: string;
      content: string;
      metadata: string;
      created_at: string;
      updated_at: string | null;
    }>;

    return results.map((r) => ({
      id: r.id,
      content: r.content,
      metadata: JSON.parse(r.metadata) as MemoryMetadata,
      createdAt: new Date(r.created_at),
      updatedAt: r.updated_at ? new Date(r.updated_at) : undefined,
    }));
  }

  /**
   * 更新记忆
   */
  async update(id: string, updates: { content?: string; metadata?: MemoryMetadata; embedding?: Float32Array }): Promise<boolean> {
    const existing = await this.get(id);
    if (!existing) return false;

    const now = new Date();
    const transaction = this.db.transaction(() => {
      if (updates.content || updates.metadata) {
        const updateMemory = this.db.prepare(`
          UPDATE memories
          SET content = ?, metadata = ?, updated_at = ?
          WHERE id = ?
        `);
        updateMemory.run(
          updates.content ?? existing.content,
          JSON.stringify(updates.metadata ?? existing.metadata),
          now.toISOString(),
          id
        );
      }

      if (updates.embedding) {
        // 删除旧的 embedding
        const deleteEmbedding = this.db.prepare('DELETE FROM memory_embeddings WHERE memory_id = ?');
        deleteEmbedding.run(id);

        // 插入新的 embedding
        const insertEmbedding = this.db.prepare(`
          INSERT INTO memory_embeddings (embedding, memory_id)
          VALUES (?, ?)
        `);
        insertEmbedding.run(updates.embedding.buffer, id);
      }
    });

    transaction();
    return true;
  }

  /**
   * 删除记忆
   */
  async delete(id: string): Promise<boolean> {
    const transaction = this.db.transaction(() => {
      const deleteMemory = this.db.prepare('DELETE FROM memories WHERE id = ?');
      const deleteEmbedding = this.db.prepare('DELETE FROM memory_embeddings WHERE memory_id = ?');
      
      deleteEmbedding.run(id);
      const result = deleteMemory.run(id);
      return result.changes > 0;
    });

    return transaction() as boolean;
  }

  /**
   * 获取所有记忆数量
   */
  async count(): Promise<number> {
    const query = this.db.prepare('SELECT COUNT(*) as count FROM memories');
    const result = query.get() as { count: number };
    return result.count;
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.db.close();
  }
}
