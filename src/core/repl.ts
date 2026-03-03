/**
 * REPL - 交互式命令行界面
 */

import * as readline from 'readline';
import chalk from 'chalk';
import ora from 'ora';
import { TodoService } from '../services/todo-service.js';
import { LLMService } from '../services/llm-service.js';
import { MemoryStore } from './memory-store.js';
import { Scheduler } from './scheduler.js';

export interface REPLConfig {
  prompt?: string;
}

type CommandHandler = (args: string[]) => Promise<string | void> | string | void;

export class REPL {
  private todoService: TodoService;
  private llmService: LLMService;
  private memoryStore: MemoryStore;
  private scheduler: Scheduler;
  private rl: readline.Interface;
  private prompt: string;
  private commands: Map<string, { handler: CommandHandler; help: string }> = new Map();
  private running = false;
  private notifyFn?: (title: string, message: string) => void;

  constructor(
    todoService: TodoService,
    llmService: LLMService,
    memoryStore: MemoryStore,
    scheduler: Scheduler,
    config?: REPLConfig
  ) {
    this.todoService = todoService;
    this.llmService = llmService;
    this.memoryStore = memoryStore;
    this.scheduler = scheduler;
    this.prompt = config?.prompt ?? 'niuma> ';

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      completer: this.completer.bind(this),
    });

    this.registerCommands();
  }

  /**
   * 设置通知函数
   */
  setNotify(fn: (title: string, message: string) => void): void {
    this.notifyFn = fn;
  }

  /**
   * 注册内置命令
   */
  private registerCommands(): void {
    // Todo 相关命令
    this.registerCommand('/add', {
      help: '/add <title> [-p high|medium|low]  添加待办任务',
      handler: (args) => this.handleAddTodo(args),
    });

    this.registerCommand('/done', {
      help: '/done <id|index>  完成任务',
      handler: (args) => this.handleDoneTodo(args),
    });

    this.registerCommand('/todos', {
      help: '/todos [-a]  查看任务列表（-a 显示所有）',
      handler: (args) => this.handleListTodos(args),
    });

    this.registerCommand('/rm', {
      help: '/rm <id|index>  删除任务',
      handler: (args) => this.handleRemoveTodo(args),
    });

    // 记忆相关命令
    this.registerCommand('/remember', {
      help: '/remember <content>  保存记忆',
      handler: (args) => this.handleRemember(args),
    });

    this.registerCommand('/recall', {
      help: '/recall <keyword>  搜索记忆',
      handler: (args) => this.handleRecall(args),
    });

    // 触发流程
    this.registerCommand('/morning', {
      help: '/morning  手动触发早安流程',
      handler: async () => {
        const msg = await this.scheduler.triggerMorning();
        return msg;
      },
    });

    this.registerCommand('/evening', {
      help: '/evening  手动触发晚间复盘',
      handler: async () => {
        const msg = await this.scheduler.triggerEvening();
        return msg;
      },
    });

    // 状态命令
    this.registerCommand('/status', {
      help: '/status  查看当前状态',
      handler: () => this.handleStatus(),
    });

    this.registerCommand('/weather', {
      help: '/weather  查看天气',
      handler: async () => {
        const { WeatherService } = await import('../services/weather-service');
        const weatherService = new WeatherService();
        return weatherService.generateWeatherGreeting();
      },
    });

    // 帮助和退出
    this.registerCommand('/help', {
      help: '/help  显示帮助信息',
      handler: () => this.handleHelp(),
    });

    this.registerCommand('/exit', {
      help: '/exit  退出程序',
      handler: () => {
        this.stop();
        return '再见！👋';
      },
    });

    this.registerCommand('/quit', {
      help: '/quit  退出程序',
      handler: () => {
        this.stop();
        return '再见！👋';
      },
    });

    this.registerCommand('/clear', {
      help: '/clear  清除对话历史',
      handler: () => {
        this.llmService.clearHistory();
        return '🧹 对话历史已清除';
      },
    });
  }

  /**
   * 注册自定义命令
   */
  registerCommand(name: string, config: { handler: CommandHandler; help: string }): void {
    this.commands.set(name, config);
  }

  /**
   * 启动 REPL
   */
  start(): void {
    this.running = true;
    console.log(chalk.cyan('\n🐂 牛马助手已启动！输入 /help 查看可用命令，或直接与我聊天。\n'));
    this.promptInput();
  }

  /**
   * 停止 REPL
   */
  stop(): void {
    this.running = false;
    this.rl.close();
  }

  /**
   * 提示输入
   */
  private promptInput(): void {
    if (!this.running) return;

    this.rl.question(chalk.green(this.prompt), async (input) => {
      const trimmed = input.trim();
      
      if (trimmed) {
        try {
          await this.executeInput(trimmed);
        } catch (error) {
          console.log(chalk.red(`错误: ${error}`));
        }
      }

      this.promptInput();
    });
  }

  /**
   * 处理输入：命令或对话
   */
  private async executeInput(input: string): Promise<void> {
    // 以 / 开头的是命令
    if (input.startsWith('/')) {
      await this.executeCommand(input);
    } else {
      // 其他输入作为对话发送给大模型
      await this.handleChat(input);
    }
  }

  /**
   * 执行命令
   */
  private async executeCommand(input: string): Promise<void> {
    const parts = input.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (!this.commands.has(cmd)) {
      console.log(chalk.yellow(`未知命令: ${cmd}。输入 /help 查看可用命令。`));
      return;
    }

    const { handler } = this.commands.get(cmd)!;
    const result = await handler(args);

    if (result) {
      console.log(result);
    }
  }

  /**
   * 处理对话（接入大模型）
   */
  private async handleChat(message: string): Promise<void> {
    // 检查 LLM 是否已配置
    if (!this.llmService.isConfigured()) {
      console.log(chalk.yellow('\n⚠️  未配置 LLM API Key，无法使用聊天功能。'));
      console.log(chalk.gray('   请设置环境变量 IFLOW_API_KEY 或 LLM_API_KEY 后重试。\n'));
      return;
    }

    const spinner = ora({
      text: '思考中...',
      color: 'cyan',
    }).start();

    try {
      // 调用 LLM 服务
      const response = await this.llmService.chat(message);
      
      spinner.stop();
      console.log(chalk.magenta(`\n${response.content}\n`));
    } catch (error) {
      spinner.fail('请求失败');
      console.log(chalk.red(`\n❌ 聊天出错: ${error instanceof Error ? error.message : error}\n`));
    }
  }

  /**
   * 自动补全
   */
  private completer(line: string): [string[], string] {
    const commands = Array.from(this.commands.keys());
    const hits = commands.filter(c => c.startsWith(line));
    return [hits.length ? hits : commands, line];
  }

  // === 命令处理器 ===

  private async handleAddTodo(args: string[]): Promise<string> {
    if (args.length === 0) {
      return '用法: /add <title> [-p high|medium|low]';
    }

    let priority: 'high' | 'medium' | 'low' = 'medium';
    let titleParts: string[] = [];

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-p' && args[i + 1]) {
        const p = args[i + 1].toLowerCase();
        if (['high', 'medium', 'low'].includes(p)) {
          priority = p as typeof priority;
        }
        i++;
      } else {
        titleParts.push(args[i]);
      }
    }

    const title = titleParts.join(' ');
    const todo = await this.todoService.create(title, { priority });

    return `✅ 已添加: ${todo.title} [${priority}]`;
  }

  private async handleDoneTodo(args: string[]): Promise<string> {
    if (args.length === 0) {
      return '用法: /done <id|index>';
    }

    const idOrIndex = args[0];
    const todo = await this.findTodoByIdOrIndex(idOrIndex);

    if (!todo) {
      return `❌ 找不到任务: ${idOrIndex}`;
    }

    await this.todoService.updateStatus(todo.id, 'completed');
    return `🎉 已完成: ${todo.title}`;
  }

  private async handleRemoveTodo(args: string[]): Promise<string> {
    if (args.length === 0) {
      return '用法: /rm <id|index>';
    }

    const idOrIndex = args[0];
    const todo = await this.findTodoByIdOrIndex(idOrIndex);

    if (!todo) {
      return `❌ 找不到任务: ${idOrIndex}`;
    }

    await this.todoService.delete(todo.id);
    return `🗑️ 已删除: ${todo.title}`;
  }

  private async handleListTodos(args: string[]): Promise<string> {
    const showAll = args.includes('-a');
    const status = showAll ? undefined : 'pending';
    const todos = await this.todoService.getAll({ status });

    if (todos.length === 0) {
      return '📭 暂无任务';
    }

    const lines: string[] = ['📋 任务列表:\n'];
    const stats = await this.todoService.getStats();
    lines.push(`   总计: ${stats.total} | 待处理: ${stats.pending} | 进行中: ${stats.inProgress} | 已完成: ${stats.completed}\n`);

    todos.forEach((todo, index) => {
      const priorityIcon = todo.priority === 'high' ? '🔥' : todo.priority === 'low' ? '💤' : '📌';
      const statusIcon = todo.status === 'completed' ? '✅' : todo.status === 'in_progress' ? '🔄' : '⏳';
      const dateStr = todo.updatedAt ? todo.updatedAt.toLocaleDateString() : todo.createdAt.toLocaleDateString();
      lines.push(`  ${index + 1}. ${statusIcon} ${priorityIcon} ${todo.title}`);
      lines.push(`     ID: ${todo.id.slice(0, 8)}... | ${dateStr}`);
    });

    return lines.join('\n');
  }

  private async handleRemember(args: string[]): Promise<string> {
    if (args.length === 0) {
      return '用法: /remember <content>';
    }

    const content = args.join(' ');
    await this.memoryStore.add(content, {
      type: 'short_term',
      importance: 0.5,
    });

    return `🧠 已记住: ${content.slice(0, 50)}${content.length > 50 ? '...' : ''}`;
  }

  private async handleRecall(args: string[]): Promise<string> {
    if (args.length === 0) {
      return '用法: /recall <keyword>';
    }

    // 注意：当前 MemoryStore 的 search 方法需要向量嵌入
    // 这里暂时返回提示信息，后续可以集成文本嵌入模型
    return `🔍 搜索功能需要向量嵌入支持，暂不可用。\n   关键词: ${args.join(' ')}`;
  }

  private async handleStatus(): Promise<string> {
    const stats = await this.todoService.getStats();
    const memoryCount = await this.memoryStore.count();

    const lines: string[] = ['📊 当前状态:\n'];
    lines.push(`  任务: ${stats.pending} 待处理 | ${stats.inProgress} 进行中 | ${stats.completed} 已完成`);
    lines.push(`  记忆: ${memoryCount} 条`);
    lines.push(`  时间: ${new Date().toLocaleString('zh-CN')}`);

    return lines.join('\n');
  }

  private handleHelp(): string {
    const lines: string[] = ['📖 可用命令:\n'];

    const categories: Record<string, string[]> = {
      '任务管理': ['/add', '/done', '/rm', '/todos'],
      '记忆': ['/remember', '/recall'],
      '流程': ['/morning', '/evening', '/weather'],
      '系统': ['/status', '/help', '/clear', '/exit'],
    };

    for (const [category, cmds] of Object.entries(categories)) {
      lines.push(`\n${category}:`);
      for (const cmd of cmds) {
        const config = this.commands.get(cmd);
        if (config) {
          lines.push(`  ${config.help}`);
        }
      }
    }

    lines.push('\n💬 其他输入将作为对话发送给大模型');

    return lines.join('\n');
  }

  private async findTodoByIdOrIndex(idOrIndex: string) {
    // 尝试作为索引
    const index = parseInt(idOrIndex, 10) - 1;
    if (!isNaN(index) && index >= 0) {
      const todos = await this.todoService.getAll({});
      return todos[index];
    }

    // 尝试作为 ID
    return this.todoService.getById(idOrIndex);
  }

  /**
   * 输出消息（供外部调用）
   */
  print(message: string): void {
    console.log('\n' + message);
    this.rl.prompt();
  }
}
