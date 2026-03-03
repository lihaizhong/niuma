/**
 * Todo 命令
 */

import chalk from 'chalk';
import * as p from '@clack/prompts';
import { TodoService } from '../services/todo-service.js';
import type { TodoPriority, TodoStatus } from '../types/index.js';
import { format } from 'date-fns';

interface TodoCommandConfig {
  todoService: TodoService;
}

export async function todoCommand(action: string, args: string[], config: TodoCommandConfig): Promise<void> {
  const { todoService } = config;

  switch (action) {
    case 'add':
    case 'a':
      await addTodo(args, config);
      break;
    case 'list':
    case 'ls':
    case 'l':
      await listTodos(args, config);
      break;
    case 'done':
    case 'complete':
    case 'd':
      await completeTodo(args, config);
      break;
    case 'start':
    case 's':
      await startTodo(args, config);
      break;
    case 'remove':
    case 'rm':
    case 'r':
      await removeTodo(args, config);
      break;
    case 'stats':
      await showStats(config);
      break;
    case 'today':
    case 't':
      await showToday(config);
      break;
    default:
      await showHelp();
  }
}

async function addTodo(args: string[], config: TodoCommandConfig): Promise<void> {
  const { todoService } = config;

  let title = args.join(' ');
  
  if (!title) {
    p.intro(chalk.cyan('添加新任务'));
    
    const result = await p.group({
      title: () => p.text({
        message: '任务标题：',
        placeholder: '输入任务标题...',
        validate: (value) => !value || value.trim() === '' ? '请输入任务标题' : undefined,
      }),
      priority: () => p.select({
        message: '优先级：',
        options: [
          { value: 'low', label: '🟢 低' },
          { value: 'medium', label: '🟡 中' },
          { value: 'high', label: '🔴 高' },
        ],
        initialValue: 'medium',
      }),
      description: () => p.text({
        message: '描述（可选）：',
        placeholder: '输入任务描述...',
      }),
    }, {
      onCancel: () => {
        p.cancel('操作已取消');
        process.exit(0);
      },
    });
    
    const todo = await todoService.create(result.title, {
      priority: result.priority as TodoPriority,
      description: result.description || undefined,
    });
    
    p.outro(chalk.green(`✓ 已添加任务: ${todo.title}`));
  } else {
    const todo = await todoService.create(title);
    console.log(chalk.green(`✓ 已添加任务: ${todo.title}`));
  }
}

async function listTodos(args: string[], config: TodoCommandConfig): Promise<void> {
  const { todoService } = config;

  const statusFilter = args[0] as TodoStatus | undefined;
  const todos = await todoService.getAll(statusFilter ? { status: statusFilter } : undefined);

  if (todos.length === 0) {
    console.log(chalk.gray('暂无任务'));
    return;
  }

  console.log();
  console.log(chalk.bold('📋 任务列表'));
  console.log(chalk.gray('─'.repeat(40)));

  todos.forEach((todo) => {
    const statusIcon = {
      pending: '⬜',
      in_progress: '🔄',
      completed: '✅',
      cancelled: '❌',
    }[todo.status];

    const priorityColor = {
      high: chalk.red,
      medium: chalk.yellow,
      low: chalk.green,
    }[todo.priority];

    console.log(`${statusIcon} ${priorityColor(todo.title)}`);
    console.log(chalk.gray(`   ID: ${todo.id}`));
    if (todo.description) {
      console.log(chalk.gray(`   描述: ${todo.description}`));
    }
    if (todo.dueDate) {
      console.log(chalk.gray(`   截止: ${format(todo.dueDate, 'yyyy-MM-dd HH:mm')}`));
    }
  });

  console.log();
}

async function completeTodo(args: string[], config: TodoCommandConfig): Promise<void> {
  const { todoService } = config;

  const idOrTitle = args.join(' ');
  
  if (!idOrTitle) {
    const todos = await todoService.getAll({ status: 'pending' });
    const inProgressTodos = await todoService.getAll({ status: 'in_progress' });
    const allTodos = [...todos, ...inProgressTodos];

    if (allTodos.length === 0) {
      console.log(chalk.yellow('没有待完成的任务'));
      return;
    }

    const todoId = await p.select({
      message: '选择要完成的任务：',
      options: allTodos.map((t) => ({
        value: t.id,
        label: `${t.title} (${t.status === 'in_progress' ? '进行中' : '待处理'})`,
      })),
    });

    if (p.isCancel(todoId)) {
      p.cancel('操作已取消');
      return;
    }

    await todoService.updateStatus(todoId as string, 'completed');
    p.outro(chalk.green('✓ 任务已完成！'));
    return;
  }

  const todo = await todoService.getById(idOrTitle);
  if (todo) {
    await todoService.updateStatus(idOrTitle, 'completed');
    console.log(chalk.green(`✓ 已完成: ${todo.title}`));
  } else {
    console.log(chalk.yellow('未找到指定任务'));
  }
}

async function startTodo(args: string[], config: TodoCommandConfig): Promise<void> {
  const { todoService } = config;

  const idOrTitle = args.join(' ');
  
  if (!idOrTitle) {
    const todos = await todoService.getAll({ status: 'pending' });

    if (todos.length === 0) {
      console.log(chalk.yellow('没有待开始的任务'));
      return;
    }

    const todoId = await p.select({
      message: '选择要开始的任务：',
      options: todos.map((t) => ({
        value: t.id,
        label: t.title,
      })),
    });

    if (p.isCancel(todoId)) {
      p.cancel('操作已取消');
      return;
    }

    await todoService.updateStatus(todoId as string, 'in_progress');
    p.outro(chalk.green('✓ 任务已开始！'));
    return;
  }

  const todo = await todoService.getById(idOrTitle);
  if (todo) {
    await todoService.updateStatus(idOrTitle, 'in_progress');
    console.log(chalk.green(`✓ 已开始: ${todo.title}`));
  } else {
    console.log(chalk.yellow('未找到指定任务'));
  }
}

async function removeTodo(args: string[], config: TodoCommandConfig): Promise<void> {
  const { todoService } = config;

  const idOrTitle = args.join(' ');
  
  if (!idOrTitle) {
    console.log(chalk.yellow('请指定要删除的任务 ID'));
    return;
  }

  const deleted = await todoService.delete(idOrTitle);
  if (deleted) {
    console.log(chalk.green('✓ 任务已删除'));
  } else {
    console.log(chalk.yellow('未找到指定任务'));
  }
}

async function showStats(config: TodoCommandConfig): Promise<void> {
  const { todoService } = config;
  const stats = await todoService.getStats();

  console.log();
  console.log(chalk.bold('📊 任务统计'));
  console.log(chalk.gray('─'.repeat(30)));
  console.log(`总数: ${stats.total}`);
  console.log(chalk.green(`已完成: ${stats.completed}`));
  console.log(chalk.yellow(`进行中: ${stats.inProgress}`));
  console.log(chalk.white(`待处理: ${stats.pending}`));
  console.log();
}

async function showToday(config: TodoCommandConfig): Promise<void> {
  const { todoService } = config;
  const todos = await todoService.getToday();

  console.log();
  console.log(chalk.bold('📋 今日待办'));
  console.log(chalk.gray('─'.repeat(30)));

  if (todos.length === 0) {
    console.log(chalk.green('暂无今日待办，轻松愉快！'));
  } else {
    todos.forEach((todo) => {
      const statusIcon = todo.status === 'in_progress' ? '🔄' : '⬜';
      const priorityIcon = {
        high: chalk.red('🔴'),
        medium: chalk.yellow('🟡'),
        low: chalk.green('🟢'),
      }[todo.priority];

      console.log(`${statusIcon} ${priorityIcon} ${todo.title}`);
    });
  }

  console.log();
}

async function showHelp(): Promise<void> {
  console.log();
  console.log(chalk.bold('📝 Todo 命令帮助'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log('用法: niuma todo <命令> [参数]');
  console.log();
  console.log('命令:');
  console.log('  add, a [标题]     添加任务');
  console.log('  list, ls, l       列出所有任务');
  console.log('  today, t          显示今日待办');
  console.log('  done, d [ID]      完成任务');
  console.log('  start, s [ID]     开始任务');
  console.log('  remove, rm [ID]   删除任务');
  console.log('  stats             显示统计');
  console.log();
}