/**
 * Todo 类型定义
 */

export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TodoPriority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: Date;
  tags?: string[];
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
}

export interface TodoList {
  id: string;
  name: string;
  todos: Todo[];
  createdAt: Date;
}
