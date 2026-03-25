/**
 * 渠道类型定义
 */

export interface Channel {
  name: string;
  status: "stopped" | "running";
  send(message: string): Promise<void>;
  onMessage(handler: (message: string) => void): void;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface ChannelConfig {
  type: string;
  enabled: boolean;
  options?: Record<string, unknown>;
}
