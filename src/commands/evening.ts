/**
 * 晚间复盘流程命令
 */

import chalk from 'chalk';
import { TodoService } from '../services/todo-service.js';
import { MemoryStore } from '../core/memory-store.js';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface EveningConfig {
  todoService: TodoService;
  memoryStore: MemoryStore;
  userName?: string;
}

export async function eveningCommand(config: EveningConfig): Promise<void> {
  const { todoService, memoryStore, userName } = config;
  const now = new Date();

  console.log();
  console.log(chalk.bold.magenta('═'.repeat(50)));
  console.log(chalk.bold.magenta(`🌙 ${userName ? userName + '，' : ''}晚上好！`));
  console.log(chalk.bold.magenta('═'.repeat(50)));
  console.log();
  console.log(chalk.gray(`今天是 ${format(now, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}`));
  console.log();

  // 今日成就
  console.log(chalk.bold.green('✅ 今日成就'));
  console.log(chalk.gray('─'.repeat(30)));
  
  const stats = await todoService.getStats();
  const completedToday = await todoService.getAll({ status: 'completed' });
  
  console.log(chalk.green(`完成了 ${stats.completed} 个任务！`));
  console.log();

  if (completedToday.length > 0) {
    console.log(chalk.white('完成任务：'));
    completedToday.slice(0, 5).forEach((todo) => {
      console.log(chalk.green(`  ✓ ${todo.title}`));
    });
    if (completedToday.length > 5) {
      console.log(chalk.gray(`  ... 还有 ${completedToday.length - 5} 个`));
    }
  }
  console.log();

  // 未完成任务
  console.log(chalk.bold.yellow('📋 待处理事项'));
  console.log(chalk.gray('─'.repeat(30)));
  
  const pendingTodos = await todoService.getAll({ status: 'pending' });
  const inProgressTodos = await todoService.getAll({ status: 'in_progress' });
  
  if (pendingTodos.length === 0 && inProgressTodos.length === 0) {
    console.log(chalk.green('太棒了！所有任务都已完成 🎉'));
  } else {
    if (inProgressTodos.length > 0) {
      console.log(chalk.yellow('进行中：'));
      inProgressTodos.forEach((todo) => {
        console.log(chalk.yellow(`  🔄 ${todo.title}`));
      });
    }
    
    if (pendingTodos.length > 0) {
      console.log(chalk.white('待处理：'));
      pendingTodos.slice(0, 3).forEach((todo) => {
        console.log(chalk.white(`  ⬜ ${todo.title}`));
      });
      if (pendingTodos.length > 3) {
        console.log(chalk.gray(`  ... 还有 ${pendingTodos.length - 3} 个`));
      }
    }
  }
  console.log();

  // 复盘引导
  console.log(chalk.bold.cyan('💭 今日复盘'));
  console.log(chalk.gray('─'.repeat(30)));
  console.log(chalk.white('可以思考一下：'));
  console.log(chalk.gray('  1. 今天最重要的事情是什么？'));
  console.log(chalk.gray('  2. 有什么可以改进的地方？'));
  console.log(chalk.gray('  3. 明天最想完成的事情是什么？'));
  console.log();

  // 记录今日亮点
  console.log(chalk.bold.magenta('📝 记录今日'));
  console.log(chalk.gray('─'.repeat(30)));
  console.log(chalk.gray('使用 `niuma remember <内容>` 记录今天的亮点或感悟'));
  console.log();

  // 晚安祝福
  const lateHour = now.getHours() >= 22;
  if (lateHour) {
    console.log(chalk.bold.blue('🌙 夜深了，早点休息，明天继续加油！'));
  } else {
    console.log(chalk.bold.blue('🌙 晚安，好好休息！'));
  }
  console.log();
}
