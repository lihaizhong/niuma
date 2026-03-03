#!/usr/bin/env node

/**
 * Niuma CLI - 智能生活助手
 * 一个提供陪伴感和情绪价值的智能精灵
 */

import cac from 'cac';
import chalk from 'chalk';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { MemoryStore } from './core/memory-store.js';
import { TodoService } from './services/todo-service.js';
import { WeatherService } from './services/weather-service.js';
import { morningCommand, eveningCommand, todoCommand, rememberCommand } from './commands/index.js';

// 数据目录
const DATA_DIR = join(homedir(), '.niuma');
const DB_PATH = join(DATA_DIR, 'niuma.db');

// 确保数据目录存在
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化服务
const memoryStore = new MemoryStore({ dbPath: DB_PATH });
const todoService = new TodoService(DB_PATH);
const weatherService = new WeatherService();

// 创建 CLI 程序
const cli = cac('niuma');

cli
  .version('0.1.0')
  .usage('[command] [options]')
  .help();

// 早安命令
cli
  .command('morning', '🌅 早安流程 - 问候 + 天气 + 待办')
  .alias('m')
  .option('-n, --name <name>', '你的名字')
  .action(async (options) => {
    try {
      await morningCommand({
        weatherService,
        todoService,
        memoryStore,
        userName: options.name,
      });
    } catch (error) {
      console.error(chalk.red('早安流程出错：'), error);
    }
  });

// 晚间命令
cli
  .command('evening', '🌙 晚间复盘 - 总结今日成就')
  .alias('e')
  .option('-n, --name <name>', '你的名字')
  .action(async (options) => {
    try {
      await eveningCommand({
        todoService,
        memoryStore,
        userName: options.name,
      });
    } catch (error) {
      console.error(chalk.red('晚间复盘出错：'), error);
    }
  });

// Todo 命令
cli
  .command('todo [action] [args]', '📋 TodoList 管理')
  .alias('t')
  .action(async (action, args, options) => {
    try {
      await todoCommand(action || 'list', args ? [args] : [], { todoService });
    } catch (error) {
      console.error(chalk.red('Todo 操作出错：'), error);
    }
  });

// Remember 命令
cli
  .command('remember [content]', '📝 记录记忆')
  .alias('r')
  .action(async (content) => {
    try {
      await rememberCommand(content ? [content] : [], { memoryStore });
    } catch (error) {
      console.error(chalk.red('记录记忆出错：'), error);
    }
  });

// 交互模式
cli
  .command('chat', '💬 进入交互聊天模式（开发中）')
  .alias('c')
  .action(() => {
    console.log(chalk.yellow('交互聊天模式正在开发中...'));
    console.log(chalk.gray('敬请期待！'));
  });

// 默认命令 - 显示帮助
cli
  .command('', '显示帮助')
  .action(() => {
    console.log();
    console.log(chalk.bold.cyan('🐮 Niuma (牛马) - 智能生活助手'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log();
    console.log(chalk.white('常用命令：'));
    console.log(chalk.cyan('  niuma morning') + chalk.gray('    🌅 早安流程'));
    console.log(chalk.cyan('  niuma evening') + chalk.gray('    🌙 晚间复盘'));
    console.log(chalk.cyan('  niuma todo') + chalk.gray('        📋 待办管理'));
    console.log(chalk.cyan('  niuma remember') + chalk.gray('   📝 记录记忆'));
    console.log();
    console.log(chalk.gray('使用 niuma --help 查看完整帮助'));
    console.log();
  });

// 优雅退出
process.on('SIGINT', () => {
  console.log();
  console.log(chalk.cyan('再见！期待下次见面 🌈'));
  memoryStore.close();
  todoService.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  memoryStore.close();
  todoService.close();
  process.exit(0);
});

// 解析命令
cli.parse();