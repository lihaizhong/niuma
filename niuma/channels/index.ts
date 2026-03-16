/**
 * 多渠道接入模块
 * @description 统一导出所有渠道和相关功能
 */

// 渠道基类
export { BaseChannel, ChannelStatus, ChannelError, ChannelErrorType } from "./base";
export type { MessageHandler } from "./base";

// 渠道类型
export type {
  InboundMessage,
  OutboundMessage,
  MediaContent,
} from "../types/message";
export type { ChannelType } from "../types/message";

// 渠道注册表
export { ChannelRegistry } from "./registry";

// CLI 渠道
export { CLIChannel } from "./cli";
export type { CLIChannelConfig } from "./cli";

// Telegram 渠道
export { TelegramChannel } from "./telegram";
export type { TelegramChannelConfig } from "./telegram";

// Discord 渠道
export { DiscordChannel } from "./discord";
export type { DiscordChannelConfig } from "./discord";

// 飞书渠道
export { FeishuChannel } from "./feishu";
export type { FeishuChannelConfig } from "./feishu";

// 钉钉渠道
export { DingtalkChannel } from "./dingtalk";
export type { DingtalkChannelConfig } from "./dingtalk";

// Slack 渠道
export { SlackChannel } from "./slack";
export type { SlackChannelConfig } from "./slack";

// Email 渠道
export { EmailChannel } from "./email";
export type { EmailChannelConfig } from "./email";

// WhatsApp 渠道
export { WhatsAppChannel } from "./whatsapp";
export type { WhatsAppChannelConfig } from "./whatsapp";

// QQ 渠道
export { QQChannel } from "./qq";
export type { QQChannelConfig } from "./qq";