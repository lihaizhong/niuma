/**
 * 使用 zod 的配置 Schema 定义
 */

import { z } from 'zod'

// ============================================
// 提供商配置 Schema
// ============================================

/**
 * 基础提供商配置 Schema
 */
export const ProviderConfigSchema = z.object({
  /** 提供商类型（openai、anthropic 等） */
  type: z.enum(['openai', 'anthropic', 'ollama', 'custom']).default('openai'),
  /** 模型标识符 */
  model: z.string(),
  /** API 密钥 */
  apiKey: z.string().optional(),
  /** API 基础 URL */
  apiBase: z.string().optional(),
  /** 采样温度 */
  temperature: z.number().min(0).max(2).optional(),
  /** 最大生成 token 数 */
  maxTokens: z.number().int().positive().optional(),
  /** 其他提供商特定选项 */
  extra: z.record(z.string(), z.unknown()).optional(),
})

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>

// ============================================
// 渠道配置 Schema
// ============================================

/** Telegram 渠道配置 */
export const TelegramChannelSchema = z.object({
  type: z.literal('telegram'),
  enabled: z.boolean().default(true),
  token: z.string(),
  webhookUrl: z.string().url().optional(),
})

/** Discord 渠道配置 */
export const DiscordChannelSchema = z.object({
  type: z.literal('discord'),
  enabled: z.boolean().default(true),
  token: z.string(),
  applicationId: z.string(),
})

/** 飞书渠道配置 */
export const FeishuChannelSchema = z.object({
  type: z.literal('feishu'),
  enabled: z.boolean().default(true),
  appId: z.string(),
  appSecret: z.string(),
})

/** 钉钉渠道配置 */
export const DingtalkChannelSchema = z.object({
  type: z.literal('dingtalk'),
  enabled: z.boolean().default(true),
  appKey: z.string(),
  appSecret: z.string(),
})

/** Slack 渠道配置 */
export const SlackChannelSchema = z.object({
  type: z.literal('slack'),
  enabled: z.boolean().default(true),
  botToken: z.string(),
  appToken: z.string().optional(),
  signingSecret: z.string().optional(),
})

/** WhatsApp 渠道配置 */
export const WhatsAppChannelSchema = z.object({
  type: z.literal('whatsapp'),
  enabled: z.boolean().default(true),
  phoneNumberId: z.string(),
  accessToken: z.string(),
})

/** 邮件渠道配置 */
export const EmailChannelSchema = z.object({
  type: z.literal('email'),
  enabled: z.boolean().default(true),
  host: z.string(),
  port: z.number().int().positive().default(587),
  secure: z.boolean().default(true),
  user: z.string(),
  password: z.string(),
  from: z.string(),
})

/** QQ 渠道配置 */
export const QQChannelSchema = z.object({
  type: z.literal('qq'),
  enabled: z.boolean().default(true),
  appId: z.string(),
  token: z.string(),
})

/** CLI 渠道配置 */
export const CLIChannelSchema = z.object({
  type: z.literal('cli'),
  enabled: z.boolean().default(true),
})

/** 所有渠道配置的联合类型 */
export const ChannelConfigSchema = z.discriminatedUnion('type', [
  TelegramChannelSchema,
  DiscordChannelSchema,
  FeishuChannelSchema,
  DingtalkChannelSchema,
  SlackChannelSchema,
  WhatsAppChannelSchema,
  EmailChannelSchema,
  QQChannelSchema,
  CLIChannelSchema,
])

export type ChannelConfig = z.infer<typeof ChannelConfigSchema>

// ============================================
// 定时任务配置 Schema
// ============================================

export const CronTaskConfigSchema = z.object({
  /** 任务名称 */
  name: z.string(),
  /** Cron 表达式 */
  schedule: z.string(),
  /** 是否启用 */
  enabled: z.boolean().default(true),
  /** 任务处理器名称 */
  handler: z.string(),
  /** 任务参数 */
  params: z.record(z.string(), z.unknown()).optional(),
})

export type CronTaskConfig = z.infer<typeof CronTaskConfigSchema>

// ============================================
// Agent 配置 Schema
// ============================================

/** 进度通知模式 */
export const ProgressModeSchema = z.enum(['quiet', 'normal', 'verbose']).default('normal')

export type ProgressMode = z.infer<typeof ProgressModeSchema>

/** Agent 配置 */
export const AgentConfigSchema = z.object({
  /** 进度通知模式 */
  progressMode: ProgressModeSchema,
  /** 是否显示推理内容（思维模型） */
  showReasoning: z.boolean().default(false),
  /** 是否显示工具执行耗时 */
  showToolDuration: z.boolean().default(true),
  /** 记忆窗口大小（触发整合的消息数阈值） */
  memoryWindow: z.number().int().positive().default(50),
  /** LLM 调用失败重试次数 */
  maxRetries: z.number().int().min(0).max(10).default(4),
  /** 重试基础延迟（毫秒），指数退避 */
  retryBaseDelay: z.number().int().positive().default(1000),
})

export type AgentConfig = z.infer<typeof AgentConfigSchema>

// ============================================
// 主配置 Schema
// ============================================

export const NiumaConfigSchema = z.object({
  /** 工作目录 */
  workspaceDir: z.string().default('.niuma'),
  /** 最大 Agent 迭代次数 */
  maxIterations: z.number().int().positive().default(40),
  /** Agent 配置 */
  agent: AgentConfigSchema.default({
    progressMode: 'normal',
    showReasoning: false,
    showToolDuration: true,
    memoryWindow: 50,
    maxRetries: 4,
    retryBaseDelay: 1000,
  }),
  /** LLM 提供商配置 */
  providers: z.record(z.string(), ProviderConfigSchema).default({}),
  /** 渠道配置 */
  channels: z.array(ChannelConfigSchema).default([]),
  /** 定时任务配置 */
  cronTasks: z.array(CronTaskConfigSchema).default([]),
  /** 调试模式 */
  debug: z.boolean().default(false),
  /** 日志级别 */
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

export type NiumaConfig = z.infer<typeof NiumaConfigSchema>