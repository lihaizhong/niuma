#!/usr/bin/env node

/**
 * Niuma CLI - 智能生活助手
 * 一个提供陪伴感和情绪价值的智能精灵
 */

import cac from 'cac';
import chalk from 'chalk';
import { NiumaDaemon } from './core/daemon.js';

// 检查是否请求帮助（在解析前检查）
const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) {
  showHelp();
  process.exit(0);
}

// 创建 CLI 程序
const cli = cac('niuma');

cli
  .version('0.1.0')
  .usage('[command] [options]');

// 启动守护进程（默认命令）
cli
  .command('start', '🚀 启动牛马守护进程（后台持续运行）')
  .alias('s')
  .option('-m, --morning <time>', '早安时间，默认 7:00', { default: '0 7 * * *' })
  .option('-e, --evening <time>', '晚间复盘时间，默认 22:00', { default: '0 22 * * *' })
  .action((options) => {
    const daemon = new NiumaDaemon({
      morningTime: options.morning,
      eveningTime: options.evening,
    });
    daemon.start();
  });

// 默认命令 - 启动守护进程
cli
  .command('', '启动牛马守护进程')
  .action(() => {
    const daemon = new NiumaDaemon();
    daemon.start();
  });

// 自定义帮助命令
cli
  .command('help', '显示帮助信息')
  .action(() => {
    showHelp();
  });

// 显示帮助信息
function showHelp(): void {
  const commandsHelp = `
${chalk.cyan('可用命令:')}

  ${chalk.green('niuma')}           启动牛马守护进程（交互式聊天模式）
  ${chalk.green('niuma start')}     启动守护进程（可配置定时任务）
  ${chalk.green('niuma help')}      显示帮助信息
  ${chalk.green('niuma -v')}        显示版本号

${chalk.cyan('交互式命令（启动后使用）:')}

  ${chalk.yellow('聊天功能:')}
    直接输入任意内容即可与大模型对话

  ${chalk.yellow('任务管理:')}
    /add <title> [-p high|medium|low]   添加待办任务
    /done <id|index>                    完成任务
    /rm <id|index>                      删除任务
    /todos [-a]                         查看任务列表（-a 显示所有）

  ${chalk.yellow('记忆管理:')}
    /remember <content>                 保存记忆
    /recall <keyword>                   搜索记忆

  ${chalk.yellow('日常流程:')}
    /morning                            手动触发早安流程
    /evening                            手动触发晚间复盘
    /weather                            查看天气

  ${chalk.yellow('系统命令:')}
    /status                             查看当前状态
    /clear                              清除对话历史
    /help                               显示帮助信息
    /exit, /quit                        退出程序

${chalk.cyan('环境变量:')}

  ${chalk.gray('IFLOW_API_KEY')}     iFlow API Key（优先）
  ${chalk.gray('IFLOW_BASE_URL')}    iFlow API 地址（可选）
  ${chalk.gray('IFLOW_MODEL')}       模型名称（可选，默认 GLM-5）

  ${chalk.gray('LLM_API_KEY')}       通用 LLM API Key（备选）
  ${chalk.gray('LLM_BASE_URL')}      通用 LLM API 地址（可选）
  ${chalk.gray('LLM_MODEL')}         模型名称（可选）

${chalk.gray('更多信息请访问:')} https://github.com/lihaizhong/niuma
`;

  console.log(commandsHelp);
}

// 解析命令
cli.parse();
