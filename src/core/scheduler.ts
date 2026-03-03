/**
 * Scheduler - 定时任务调度器
 */

import cron from 'node-cron';
import { WeatherService } from '../services/weather-service.js';
import { TodoService } from '../services/todo-service.js';
import { MemoryStore } from './memory-store.js';

export interface SchedulerConfig {
  morningTime?: string;  // 默认 '0 7 * * *' (每天7点)
  eveningTime?: string;  // 默认 '0 22 * * *' (每天22点)
  reminderInterval?: string; // 默认 '0 */2 * * *' (每2小时)
}

export interface SchedulerCallbacks {
  onMorning?: (message: string) => void;
  onEvening?: (message: string) => void;
  onReminder?: (message: string) => void;
  onNotify?: (title: string, message: string) => void;
}

type ScheduledTask = {
  name: string;
  schedule: string;
  task: ReturnType<typeof cron.schedule>;
};

export class Scheduler {
  private weatherService: WeatherService;
  private todoService: TodoService;
  private memoryStore: MemoryStore;
  private config: SchedulerConfig;
  private callbacks: SchedulerCallbacks;
  private tasks: ScheduledTask[] = [];
  private lastMorningDate: string = '';
  private lastEveningDate: string = '';

  constructor(
    weatherService: WeatherService,
    todoService: TodoService,
    memoryStore: MemoryStore,
    config?: SchedulerConfig,
    callbacks?: SchedulerCallbacks
  ) {
    this.weatherService = weatherService;
    this.todoService = todoService;
    this.memoryStore = memoryStore;
    this.config = {
      morningTime: config?.morningTime ?? '0 7 * * *',
      eveningTime: config?.eveningTime ?? '0 22 * * *',
      reminderInterval: config?.reminderInterval ?? '0 */2 * * *',
    };
    this.callbacks = callbacks ?? {};
  }

  /**
   * 启动所有定时任务
   */
  start(): void {
    this.scheduleMorning();
    this.scheduleEvening();
    this.scheduleReminder();
    console.log('📅 定时任务已启动');
    this.tasks.forEach(t => {
      console.log(`   - ${t.name}: ${t.schedule}`);
    });
  }

  /**
   * 停止所有定时任务
   */
  stop(): void {
    this.tasks.forEach(t => t.task.stop());
    this.tasks = [];
    console.log('📅 定时任务已停止');
  }

  /**
   * 早安任务
   */
  private scheduleMorning(): void {
    const task = cron.schedule(this.config.morningTime!, async () => {
      const today = new Date().toDateString();
      // 防止同一天重复执行
      if (this.lastMorningDate === today) return;
      this.lastMorningDate = today;

      try {
        const message = await this.generateMorningMessage();
        this.callbacks.onMorning?.(message);
      } catch (error) {
        console.error('早安任务执行失败:', error);
      }
    }, { timezone: 'Asia/Shanghai' });

    this.tasks.push({ name: '早安问候', schedule: this.config.morningTime!, task });
  }

  /**
   * 晚间复盘任务
   */
  private scheduleEvening(): void {
    const task = cron.schedule(this.config.eveningTime!, async () => {
      const today = new Date().toDateString();
      if (this.lastEveningDate === today) return;
      this.lastEveningDate = today;

      try {
        const message = await this.generateEveningMessage();
        this.callbacks.onEvening?.(message);
      } catch (error) {
        console.error('晚间任务执行失败:', error);
      }
    }, { timezone: 'Asia/Shanghai' });

    this.tasks.push({ name: '晚间复盘', schedule: this.config.eveningTime!, task });
  }

  /**
   * 提醒任务
   */
  private scheduleReminder(): void {
    const task = cron.schedule(this.config.reminderInterval!, async () => {
      try {
        const message = await this.generateReminderMessage();
        if (message) {
          this.callbacks.onReminder?.(message);
        }
      } catch (error) {
        console.error('提醒任务执行失败:', error);
      }
    }, { timezone: 'Asia/Shanghai' });

    this.tasks.push({ name: '定时提醒', schedule: this.config.reminderInterval!, task });
  }

  /**
   * 生成早安消息
   */
  private async generateMorningMessage(): Promise<string> {
    const weather = await this.weatherService.generateWeatherGreeting();
    const stats = await this.todoService.getStats();
    const pendingTodos = await this.todoService.getAll({ status: 'pending' });

    let message = `🌅 ${weather}\n\n`;

    if (stats.total > 0) {
      message += `📋 今日待办：${stats.pending} 个待处理，${stats.inProgress} 个进行中\n`;

      if (pendingTodos.length > 0) {
        message += '\n优先处理：\n';
        pendingTodos.slice(0, 3).forEach((todo, i) => {
          const priority = todo.priority === 'high' ? '🔥' : todo.priority === 'low' ? '💤' : '📌';
          message += `  ${i + 1}. ${priority} ${todo.title}\n`;
        });
      }
    }

    return message;
  }

  /**
   * 生成晚间复盘消息
   */
  private async generateEveningMessage(): Promise<string> {
    const stats = await this.todoService.getStats();
    const completedToday = await this.todoService.getAll({ status: 'completed' });

    let message = `🌙 晚间复盘\n\n`;
    message += `📊 今日成果：\n`;
    message += `   - 已完成：${stats.completed} 个任务\n`;
    message += `   - 进行中：${stats.inProgress} 个任务\n`;
    message += `   - 待处理：${stats.pending} 个任务\n`;

    if (completedToday.length > 0) {
      message += `\n✅ 今日完成：\n`;
      completedToday.slice(0, 5).forEach((todo, i) => {
        message += `  ${i + 1}. ${todo.title}\n`;
      });
    }

    message += `\n💪 辛苦了，早点休息！`;

    return message;
  }

  /**
   * 生成提醒消息
   */
  private async generateReminderMessage(): Promise<string | null> {
    const pendingTodos = await this.todoService.getAll({ status: 'pending' });
    const inProgressTodos = await this.todoService.getAll({ status: 'in_progress' });

    // 有高优先级任务时提醒
    const highPriority = pendingTodos.filter(t => t.priority === 'high');
    if (highPriority.length > 0) {
      return `⏰ 提醒：你有 ${highPriority.length} 个高优先级任务待处理`;
    }

    // 有进行中超过1天的任务时提醒
    const stalledTasks = inProgressTodos.filter(t => {
      const updated = t.updatedAt ? new Date(t.updatedAt) : new Date(t.createdAt);
      const hours = (Date.now() - updated.getTime()) / (1000 * 60 * 60);
      return hours > 24;
    });

    if (stalledTasks.length > 0) {
      return `⏰ 提醒：你有 ${stalledTasks.length} 个任务超过24小时未更新`;
    }

    return null;
  }

  /**
   * 手动触发早安流程
   */
  async triggerMorning(): Promise<string> {
    return this.generateMorningMessage();
  }

  /**
   * 手动触发晚间流程
   */
  async triggerEvening(): Promise<string> {
    return this.generateEveningMessage();
  }
}