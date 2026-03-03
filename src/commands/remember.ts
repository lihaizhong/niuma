/**
 * Remember 命令 - 记录记忆
 */

import chalk from 'chalk';
import * as p from '@clack/prompts';
import { MemoryStore } from '../core/memory-store.js';
import type { MemoryType } from '../types/index.js';

interface RememberConfig {
  memoryStore: MemoryStore;
}

export async function rememberCommand(args: string[], config: RememberConfig): Promise<void> {
  const { memoryStore } = config;

  let content = args.join(' ');

  if (!content) {
    p.intro(chalk.cyan('记录新记忆'));

    const result = await p.group({
      content: () => p.text({
        message: '记录内容：',
        placeholder: '输入要记录的内容...',
        validate: (value) => !value || value.trim() === '' ? '请输入内容' : undefined,
      }),
      type: () => p.select({
        message: '记忆类型：',
        options: [
          { value: 'experience', label: '📝 经验' },
          { value: 'knowledge', label: '💡 知识' },
          { value: 'preference', label: '❤️ 偏好' },
          { value: 'task', label: '📋 任务' },
          { value: 'conversation', label: '💬 对话' },
        ],
        initialValue: 'experience',
      }),
      tags: () => p.text({
        message: '标签（逗号分隔，可选）：',
        placeholder: '工作, 学习, 灵感...',
      }),
    }, {
      onCancel: () => {
        p.cancel('操作已取消');
        process.exit(0);
      },
    });

    const tags = result.tags
      ? result.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined;

    await memoryStore.add(result.content, {
      type: result.type as MemoryType,
      tags,
    });

    p.outro(chalk.green('✓ 已记录！'));
  } else {
    await memoryStore.add(content, {
      type: 'experience',
    });

    console.log(chalk.green('✓ 已记录！'));
  }
}