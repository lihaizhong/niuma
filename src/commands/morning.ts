/**
 * 早安流程命令
 */

import chalk from 'chalk';
import { WeatherService } from '../services/weather-service.js';
import { TodoService } from '../services/todo-service.js';
import { MemoryStore } from '../core/memory-store.js';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface MorningConfig {
  weatherService: WeatherService;
  todoService: TodoService;
  memoryStore: MemoryStore;
  userName?: string;
}

export async function morningCommand(config: MorningConfig): Promise<void> {
  const { weatherService, todoService, memoryStore, userName } = config;
  const now = new Date();
  const hour = now.getHours();

  console.log();
  console.log(chalk.bold.cyan('═'.repeat(50)));
  console.log(chalk.bold.cyan(`🌅 ${userName ? userName + '，' : ''}早上好！`));
  console.log(chalk.bold.cyan('═'.repeat(50)));
  console.log();
  console.log(chalk.gray(`今天是 ${format(now, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}`));
  console.log();

  // 天气信息
  console.log(chalk.bold.yellow('📍 天气情况'));
  console.log(chalk.gray('─'.repeat(30)));
  try {
    const weatherGreeting = await weatherService.generateWeatherGreeting();
    console.log(weatherGreeting);
  } catch (error) {
    console.log(chalk.yellow('暂无法获取天气信息'));
  }
  console.log();

  // 今日待办
  console.log(chalk.bold.green('📋 今日待办'));
  console.log(chalk.gray('─'.repeat(30)));
  try {
    const todayTodos = await todoService.getToday();
    if (todayTodos.length === 0) {
      console.log(chalk.gray('暂无待办事项，今天轻松愉快！'));
    } else {
      todayTodos.forEach((todo, index) => {
        const priorityIcon = {
          high: chalk.red('🔴'),
          medium: chalk.yellow('🟡'),
          low: chalk.green('🟢'),
        }[todo.priority];

        const statusIcon = todo.status === 'in_progress' ? '🔄' : '⬜';
        console.log(`${statusIcon} ${priorityIcon} ${todo.title}`);
        if (todo.dueDate) {
          console.log(chalk.gray(`   截止: ${format(todo.dueDate, 'HH:mm')}`));
        }
      });
    }

    // 统计信息
    const stats = await todoService.getStats();
    console.log();
    console.log(
      chalk.gray(`📊 共 ${stats.total} 个任务：`) +
      chalk.green(`${stats.completed} 已完成`) +
      chalk.gray(' | ') +
      chalk.yellow(`${stats.inProgress} 进行中`) +
      chalk.gray(' | ') +
      chalk.white(`${stats.pending} 待处理`)
    );
  } catch (error) {
    console.log(chalk.yellow('暂无法获取待办信息'));
  }
  console.log();

  // 今日提示
  console.log(chalk.bold.magenta('💡 今日提示'));
  console.log(chalk.gray('─'.repeat(30)));
  
  // 获取记忆中的重要事项
  const importantMemories = await memoryStore.getByType('task', 3);
  if (importantMemories.length > 0) {
    importantMemories.forEach((memory) => {
      console.log(chalk.white(`• ${memory.content}`));
    });
  } else {
    // 随机励志语
    const quotes = [
      '每一天都是新的开始，加油！💪',
      '保持专注，一步一步来 🎯',
      '今天也要元气满满哦！✨',
      '困难只是暂时的，坚持就是胜利！🌟',
      '做最好的自己，无需比较 🌈',
    ];
    console.log(chalk.white(quotes[Math.floor(Math.random() * quotes.length)]));
  }

  console.log();
  console.log(chalk.bold.cyan('═'.repeat(50)));
  console.log(chalk.cyan('祝你有美好的一天！ 🌈'));
  console.log();
}
