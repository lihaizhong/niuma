/**
 * Todo Service - TodoList 管理服务
 */

import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import type { Todo, TodoStatus, TodoPriority } from '../types/index.js';

export class TodoService {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        due_date DATETIME,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME,
        completed_at DATETIME
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_todo_status ON todos(status);
      CREATE INDEX IF NOT EXISTS idx_todo_priority ON todos(priority);
      CREATE INDEX IF NOT EXISTS idx_todo_due_date ON todos(due_date);
    `);
  }

  /**
   * 创建 Todo
   */
  async create(
    title: string,
    options?: {
      description?: string;
      priority?: TodoPriority;
      dueDate?: Date;
      tags?: string[];
    }
  ): Promise<Todo> {
    const id = nanoid();
    const now = new Date();

    const todo: Todo = {
      id,
      title,
      description: options?.description,
      status: 'pending',
      priority: options?.priority ?? 'medium',
      dueDate: options?.dueDate,
      tags: options?.tags,
      createdAt: now,
    };

    const insert = this.db.prepare(`
      INSERT INTO todos (id, title, description, status, priority, due_date, tags, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      title,
      options?.description ?? null,
      todo.status,
      todo.priority,
      options?.dueDate?.toISOString() ?? null,
      options?.tags ? JSON.stringify(options.tags) : null,
      now.toISOString()
    );

    return todo;
  }

  /**
   * 获取所有 Todo
   */
  async getAll(options?: { status?: TodoStatus; priority?: TodoPriority }): Promise<Todo[]> {
    let query = 'SELECT * FROM todos WHERE 1=1';
    const params: (string | null)[] = [];

    if (options?.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }

    if (options?.priority) {
      query += ' AND priority = ?';
      params.push(options.priority);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(query);
    const results = stmt.all(...params) as Array<{
      id: string;
      title: string;
      description: string | null;
      status: string;
      priority: string;
      due_date: string | null;
      tags: string | null;
      created_at: string;
      updated_at: string | null;
      completed_at: string | null;
    }>;

    return results.map((r) => this.mapToTodo(r));
  }

  /**
   * 获取今日待办
   */
  async getToday(): Promise<Todo[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = this.db.prepare(`
      SELECT * FROM todos
      WHERE status != 'completed'
        AND status != 'cancelled'
        AND (due_date IS NULL OR due_date >= ? AND due_date < ?)
      ORDER BY priority DESC, created_at ASC
    `);

    const results = query.all(today.toISOString(), tomorrow.toISOString()) as Array<{
      id: string;
      title: string;
      description: string | null;
      status: string;
      priority: string;
      due_date: string | null;
      tags: string | null;
      created_at: string;
      updated_at: string | null;
      completed_at: string | null;
    }>;

    return results.map((r) => this.mapToTodo(r));
  }

  /**
   * 更新 Todo 状态
   */
  async updateStatus(id: string, status: TodoStatus): Promise<Todo | null> {
    const now = new Date();
    const completedAt = status === 'completed' ? now.toISOString() : null;

    const update = this.db.prepare(`
      UPDATE todos
      SET status = ?, updated_at = ?, completed_at = ?
      WHERE id = ?
    `);

    const result = update.run(status, now.toISOString(), completedAt, id);

    if (result.changes === 0) return null;

    return this.getById(id);
  }

  /**
   * 更新 Todo
   */
  async update(
    id: string,
    updates: {
      title?: string;
      description?: string;
      priority?: TodoPriority;
      dueDate?: Date;
      tags?: string[];
    }
  ): Promise<Todo | null> {
    const now = new Date();
    const setClauses: string[] = ['updated_at = ?'];
    const params: (string | null)[] = [now.toISOString()];

    if (updates.title) {
      setClauses.push('title = ?');
      params.push(updates.title);
    }

    if (updates.description !== undefined) {
      setClauses.push('description = ?');
      params.push(updates.description);
    }

    if (updates.priority) {
      setClauses.push('priority = ?');
      params.push(updates.priority);
    }

    if (updates.dueDate !== undefined) {
      setClauses.push('due_date = ?');
      params.push(updates.dueDate?.toISOString() ?? null);
    }

    if (updates.tags !== undefined) {
      setClauses.push('tags = ?');
      params.push(updates.tags ? JSON.stringify(updates.tags) : null);
    }

    params.push(id);

    const update = this.db.prepare(`
      UPDATE todos
      SET ${setClauses.join(', ')}
      WHERE id = ?
    `);

    const result = update.run(...params);

    if (result.changes === 0) return null;

    return this.getById(id);
  }

  /**
   * 删除 Todo
   */
  async delete(id: string): Promise<boolean> {
    const del = this.db.prepare('DELETE FROM todos WHERE id = ?');
    const result = del.run(id);
    return result.changes > 0;
  }

  /**
   * 获取单个 Todo
   */
  async getById(id: string): Promise<Todo | null> {
    const query = this.db.prepare('SELECT * FROM todos WHERE id = ?');
    const result = query.get(id) as {
      id: string;
      title: string;
      description: string | null;
      status: string;
      priority: string;
      due_date: string | null;
      tags: string | null;
      created_at: string;
      updated_at: string | null;
      completed_at: string | null;
    } | undefined;

    if (!result) return null;

    return this.mapToTodo(result);
  }

  /**
   * 统计
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  }> {
    const query = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) as in_progress,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed
      FROM todos
    `);

    const result = query.get() as {
      total: number;
      pending: number;
      in_progress: number;
      completed: number;
    };

    return {
      total: result.total ?? 0,
      pending: result.pending ?? 0,
      inProgress: result.in_progress ?? 0,
      completed: result.completed ?? 0,
    };
  }

  private mapToTodo(r: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    due_date: string | null;
    tags: string | null;
    created_at: string;
    updated_at: string | null;
    completed_at: string | null;
  }): Todo {
    return {
      id: r.id,
      title: r.title,
      description: r.description ?? undefined,
      status: r.status as TodoStatus,
      priority: r.priority as TodoPriority,
      dueDate: r.due_date ? new Date(r.due_date) : undefined,
      tags: r.tags ? JSON.parse(r.tags) : undefined,
      createdAt: new Date(r.created_at),
      updatedAt: r.updated_at ? new Date(r.updated_at) : undefined,
      completedAt: r.completed_at ? new Date(r.completed_at) : undefined,
    };
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.db.close();
  }
}
