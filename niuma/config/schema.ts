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
  /** 采样温度（0-2，值越高输出越随机） */
  temperature: z.number().min(0).max(2).optional(),
  /** 最大生成 token 数 */
  maxTokens: z.number().int().positive().optional(),
  /** Top-p 采样参数（0-1，控制文本多样性） */
  topP: z.number().min(0).max(1).optional(),
  /** 停止序列，遇到这些字符串时停止生成 */
  stopSequences: z.array(z.string()).optional(),
  /** 频率惩罚（-2.0 到 2.0，降低重复词汇的概率） */
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  /** 存在惩罚（-2.0 到 2.0，鼓励谈论新话题） */
  presencePenalty: z.number().min(-2).max(2).optional(),
  /** 请求超时时间（毫秒） */
  timeout: z.number().int().positive().optional(),
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
// 角色定义 Schema
// ============================================

/**
 * 角色定义 Schema
 * 定义单个角色的配置，可以覆盖全局默认配置
 */
export const AgentDefinitionSchema = z.object({
  /** 角色唯一标识符（必填） */
  id: z.string(),
  /** 角色显示名称（可选，默认使用 id） */
  name: z.string().optional(),
  /** 角色描述 */
  description: z.string().optional(),
  /** 是否为默认角色 */
  default: z.boolean().default(false),
  /** 工作区目录 */
  workspaceDir: z.string().optional(),
  /** Agent 配置覆盖 */
  agent: AgentConfigSchema.partial().optional(),
  /** 提供商配置覆盖 */
  providers: z.record(z.string(), ProviderConfigSchema.partial()).optional(),
  /** 渠道配置覆盖（完全替换） */
  channels: z.array(ChannelConfigSchema).optional(),
  /** 定时任务配置覆盖（完全替换） */
  cronTasks: z.array(CronTaskConfigSchema).optional(),
  /** 调试模式覆盖 */
  debug: z.boolean().optional(),
  /** 日志级别覆盖 */
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).optional(),
})

export type AgentDefinition = z.infer<typeof AgentDefinitionSchema>

// ============================================
// 多角色配置 Schema
// ============================================

/**
 * 多角色配置 Schema
 * 定义全局默认配置和角色列表
 */
export const AgentsConfigSchema = z.object({
  /** Agent 默认配置 */
  defaults: AgentConfigSchema.default({
    progressMode: 'normal',
    showReasoning: false,
    showToolDuration: true,
    memoryWindow: 50,
    maxRetries: 4,
    retryBaseDelay: 1000,
  }),
  /** 角色列表 */
  list: z.array(AgentDefinitionSchema).default([]),
})

export type AgentsConfig = z.infer<typeof AgentsConfigSchema>

// ============================================
// 环境变量解析选项接口
// ============================================

/**
 * 环境变量解析选项
 */
export interface EnvVarResolverOptions {
  /** 是否严格模式（未知环境变量报错） */
  strict?: boolean
  /** 自定义环境变量（可选，会与系统环境变量合并） */
  env?: Record<string, string>
}

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
  /** 多角色配置 */
  agents: AgentsConfigSchema.default({
    defaults: {
      progressMode: 'normal',
      showReasoning: false,
      showToolDuration: true,
      memoryWindow: 50,
      maxRetries: 4,
      retryBaseDelay: 1000,
    },
    list: [],
  }),
})

export type NiumaConfig = z.infer<typeof NiumaConfigSchema>

// ============================================
// 严格配置验证 Schema
// ============================================

/**
 * 严格配置验证 Schema
 * 使用 strict 模式，拒绝未知字段
 */
export const StrictNiumaConfigSchema = NiumaConfigSchema.strict()