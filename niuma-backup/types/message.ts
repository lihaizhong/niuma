/**
 * 渠道通信消息类型定义
 */

/**
 * 支持的渠道类型
 */
export type ChannelType =
  | "telegram"
  | "discord"
  | "feishu"
  | "dingtalk"
  | "slack"
  | "whatsapp"
  | "email"
  | "qq"
  | "cli"
  | "system"; // 系统内部消息（用于子智能体通知等）

/**
 * 媒体内容类型
 */
export interface MediaContent {
  /** 媒体类型（图片、视频、音频、文档等） */
  type: "image" | "video" | "audio" | "document" | "file";
  /** 媒体 URL 或 base64 数据 */
  url?: string;
  /** Base64 编码数据 */
  data?: string;
  /** MIME 类型 */
  mimeType?: string;
  /** 文件名 */
  filename?: string;
  /** 文件大小（字节） */
  size?: number;
  /** 附加元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 入站消息（从任意渠道接收）
 */
export interface InboundMessage {
  /** 渠道类型 */
  channel: ChannelType;
  /** 发送者标识 */
  senderId: string;
  /** 聊天/会话标识 */
  chatId: string;
  /** 消息内容（文本） */
  content: string;
  /** 媒体附件 */
  media?: MediaContent[];
  /** 渠道附加元数据 */
  metadata?: Record<string, unknown>;
  /** 会话键（用于对话跟踪） */
  sessionKey?: string;
  /** 消息时间戳 */
  timestamp?: number;
  /** 渠道原始消息 ID */
  messageId?: string;
  /** 回复的消息 ID */
  replyTo?: string;
}

/**
 * 出站消息（发送到任意渠道）
 */
export interface OutboundMessage {
  /** 目标渠道类型 */
  channel: ChannelType;
  /** 目标聊天/会话标识 */
  chatId: string;
  /** 消息内容（文本） */
  content: string;
  /** 附加元数据 */
  metadata?: Record<string, unknown>;
  /** 媒体附件 */
  media?: MediaContent[];
  /** 要回复的消息 ID */
  replyTo?: string;
}

/**
 * 消息元数据（用于跟踪）
 */
export interface MessageMetadata {
  /** 消息 ID */
  id: string;
  /** 时间戳 */
  timestamp: number;
  /** 来源渠道 */
  channel: ChannelType;
  /** 是否处理成功 */
  processed?: boolean;
  /** 处理失败的错误信息 */
  error?: string;
}
