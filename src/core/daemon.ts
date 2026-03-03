/**
 * Niuma Daemon - 后台守护进程
 */

import chalk from 'chalk';
import boxen from 'boxen';
import { config } from 'dotenv';
import { homedir } from 'os';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { MemoryStore } from './memory-store.js';
import { TodoService } from '../services/todo-service.js';
import { WeatherService } from '../services/weather-service.js';
import { LLMService } from '../services/llm-service.js';
import { Scheduler, SchedulerCallbacks } from './scheduler.js';
import { REPL } from './repl.js';

// 加载环境变量
config();

export interface DaemonConfig {
  dataDir?: string;
  morningTime?: string;
  eveningTime?: string;
}

export class NiumaDaemon {
  private dataDir: string;
  private memoryStore!: MemoryStore;
  private todoService!: TodoService;
  private weatherService!: WeatherService;
  private llmService!: LLMService;
  private scheduler!: Scheduler;
  private repl!: REPL;
  private running = false;

  constructor(config?: DaemonConfig) {
    this.dataDir = config?.dataDir ?? join(homedir(), '.niuma');
    this.ensureDataDir();
    this.initServices(config);
  }

  private ensureDataDir(): void {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private initServices(config?: DaemonConfig): void {
    // 初始化数据库路径
    const memoryDbPath = join(this.dataDir, 'memory.db');
    const todoDbPath = join(this.dataDir, 'todos.db');

    // 初始化服务
    this.memoryStore = new MemoryStore({ dbPath: memoryDbPath });
    this.todoService = new TodoService(todoDbPath);
    this.weatherService = new WeatherService();
    
    // 从环境变量读取 LLM 配置
    this.llmService = new LLMService({
      apiKey: process.env.IFLOW_API_KEY ?? process.env.LLM_API_KEY ?? '',
      baseUrl: process.env.IFLOW_BASE_URL ?? process.env.LLM_BASE_URL ?? 'https://open.bigmodel.cn/api/paas/v4',
      model: process.env.IFLOW_MODEL ?? process.env.LLM_MODEL ?? 'glm-4-flash',
    });

    // 初始化调度器回调
    const callbacks: SchedulerCallbacks = {
      onMorning: (msg: string) => this.onMorning(msg),
      onEvening: (msg: string) => this.onEvening(msg),
      onReminder: (msg: string) => this.onReminder(msg),
    };

    // 初始化调度器
    this.scheduler = new Scheduler(
      this.weatherService,
      this.todoService,
      this.memoryStore,
      {
        morningTime: config?.morningTime,
        eveningTime: config?.eveningTime,
      },
      callbacks
    );

    // 初始化 REPL
    this.repl = new REPL(
      this.todoService,
      this.llmService,
      this.memoryStore,
      this.scheduler
    );
  }

  /**
   * 启动守护进程
   */
  start(): void {
    if (this.running) {
      console.log(chalk.yellow('牛马已经在运行中'));
      return;
    }

    this.running = true;

    // 显示启动信息
    this.showWelcome();

    // 启动定时任务
    this.scheduler.start();

    // 启动 REPL
    this.repl.start();

    // 处理退出信号
    this.setupExitHandlers();
  }

  /**
   * 停止守护进程
   */
  stop(): void {
    if (!this.running) return;

    this.running = false;
    this.scheduler.stop();
    this.memoryStore.close();
    this.todoService.close();
    console.log(chalk.cyan('\n🐂 牛马已停止'));
  }

  /**
   * 显示欢迎信息
   */
  private showWelcome(): void {
    const hour = new Date().getHours();
    let greeting = '你好';

    if (hour < 6) {
      greeting = '夜深了';
    } else if (hour < 12) {
      greeting = '早上好';
    } else if (hour < 18) {
      greeting = '下午好';
    } else {
      greeting = '晚上好';
    }

    const message = `🐂 牛马助手 v0.1.0\n\n${greeting}，我是你的智能伙伴`;
    console.log(boxen(message, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      textAlignment: 'center',
    }));
  }

  /**
   * 早安回调
   */
  private onMorning(message: string): void {
    console.log('\n' + chalk.yellow('━'.repeat(40)));
    console.log(chalk.cyan(message));
    console.log(chalk.yellow('━'.repeat(40)) + '\n');
    this.repl.print('');
  }

  /**
   * 晚间回调
   */
  private onEvening(message: string): void {
    console.log('\n' + chalk.yellow('━'.repeat(40)));
    console.log(chalk.cyan(message));
    console.log(chalk.yellow('━'.repeat(40)) + '\n');
    this.repl.print('');
  }

  /**
   * 提醒回调
   */
  private onReminder(message: string): void {
    console.log('\n' + chalk.magenta('💡 ' + message) + '\n');
    this.repl.print('');
  }

  /**
   * 设置退出处理器
   */
  private setupExitHandlers(): void {
    process.on('SIGINT', () => {
      this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.stop();
      process.exit(0);
    });
  }
}