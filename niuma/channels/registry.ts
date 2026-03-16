/**
 * 渠道注册表
 * @description 管理所有已注册的渠道，提供统一的渠道管理接口
 */

import { createLogger } from "../log";

import { ChannelStatus } from "./base";
import { CLIChannel } from "./cli";
import { DiscordChannel } from "./discord";
import { EmailChannel } from "./email";
import { FeishuChannel } from "./feishu";
import { QQChannel } from "./qq";
// import { SlackChannel } from "./slack";
// 暂时禁用：减少依赖加载
// import { TelegramChannel } from "./telegram";
// 暂时禁用：减少依赖加载
// import { WhatsAppChannel } from "./whatsapp";
// 暂时禁用：减少依赖加载

import type { BaseChannel } from "./base";
import type { ChannelsConfig, ChannelConfig } from "../config/schema";
// import { DingtalkChannel } from "./dingtalk";
// 暂时禁用：dingtalk-sdk 需要钉钉运行环境，Node.js 中无法正常工作

const logger = createLogger("channel-registry");

/**
 * 渠道注册表
 * @description 管理所有已注册的渠道
 */
export class ChannelRegistry {
  /** 渠道映射表 */
  private channels: Map<string, BaseChannel> = new Map();

  /** 渠道状态映射表 */
  private channelStatuses: Map<string, ChannelStatus> = new Map();

  /**
   * 注册渠道
   * @param channel 渠道实例
   * @description 将渠道注册到注册表中
   */
  public register(channel: BaseChannel): void {
    const channelType = channel.getType();
    if (this.channels.has(channelType)) {
      logger.warn(`渠道 ${channelType} 已存在，将被覆盖`);
    }
    this.channels.set(channelType, channel);
    this.channelStatuses.set(channelType, channel.getStatus());
    logger.info(`渠道 ${channelType} 已注册`);
  }

  /**
   * 注销渠道
   * @param channelType 渠道类型
   * @description 从注册表中移除渠道
   */
  public unregister(channelType: string): void {
    const channel = this.channels.get(channelType);
    if (!channel) {
      logger.warn(`渠道 ${channelType} 不存在`);
      return;
    }

    // 如果渠道正在运行，先停止它
    if (channel.getStatus() === ChannelStatus.RUNNING) {
      logger.info(`停止渠道 ${channelType}...`);
      channel.stop().catch((error) => {
        logger.error({ error }, `停止渠道 ${channelType} 失败`);
      });
    }

    this.channels.delete(channelType);
    this.channelStatuses.delete(channelType);
    logger.info(`渠道 ${channelType} 已注销`);
  }

  /**
   * 获取渠道
   * @param channelType 渠道类型
   * @returns 渠道实例，如果不存在则返回 undefined
   */
  public get(channelType: string): BaseChannel | undefined {
    return this.channels.get(channelType);
  }

  /**
   * 获取所有渠道
   * @returns 所有渠道的映射表
   */
  public getAll(): Map<string, BaseChannel> {
    return new Map(this.channels);
  }

  /**
   * 获取已注册的渠道类型列表
   * @returns 渠道类型数组
   */
  public list(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * 批量启动渠道
   * @param channelTypes 要启动的渠道类型列表，如果不指定则启动所有渠道
   * @description 启动指定的渠道，按顺序启动
   */
  public async startAll(channelTypes?: string[]): Promise<void> {
    const channelsToStart = channelTypes || this.list();

    for (const channelType of channelsToStart) {
      const channel = this.channels.get(channelType);
      if (!channel) {
        logger.warn(`渠道 ${channelType} 不存在，跳过启动`);
        continue;
      }

      if (channel.getStatus() === ChannelStatus.RUNNING) {
        logger.info(`渠道 ${channelType} 已在运行，跳过`);
        continue;
      }

      try {
        logger.info(`启动渠道 ${channelType}...`);
        await channel.start();
        this.channelStatuses.set(channelType, channel.getStatus());
        logger.info(`渠道 ${channelType} 启动成功`);
      } catch (error) {
        logger.error({ error }, `渠道 ${channelType} 启动失败`);
        this.channelStatuses.set(channelType, ChannelStatus.ERROR);
      }
    }
  }

  /**
   * 批量停止渠道
   * @param channelTypes 要停止的渠道类型列表，如果不指定则停止所有渠道
   * @description 停止指定的渠道，按顺序停止
   */
  public async stopAll(channelTypes?: string[]): Promise<void> {
    const channelsToStop = channelTypes || this.list();

    for (const channelType of channelsToStop) {
      const channel = this.channels.get(channelType);
      if (!channel) {
        logger.warn(`渠道 ${channelType} 不存在，跳过停止`);
        continue;
      }

      if (channel.getStatus() === ChannelStatus.STOPPED) {
        logger.info(`渠道 ${channelType} 已停止，跳过`);
        continue;
      }

      try {
        logger.info(`停止渠道 ${channelType}...`);
        await channel.stop();
        this.channelStatuses.set(channelType, channel.getStatus());
        logger.info(`渠道 ${channelType} 停止成功`);
      } catch (error) {
        logger.error({ error }, `渠道 ${channelType} 停止失败`);
        this.channelStatuses.set(channelType, ChannelStatus.ERROR);
      }
    }
  }

  /**
   * 检查渠道健康状态
   * @param channelTypes 要检查的渠道类型列表，如果不指定则检查所有渠道
   * @returns 健康状态映射表
   */
  public async checkHealth(channelTypes?: string[]): Promise<Map<string, boolean>> {
    const channelsToCheck = channelTypes || this.list();
    const healthStatuses: Map<string, boolean> = new Map();

    for (const channelType of channelsToCheck) {
      const channel = this.channels.get(channelType);
      if (!channel) {
        healthStatuses.set(channelType, false);
        continue;
      }

      try {
        const isHealthy = await channel.healthCheck();
        healthStatuses.set(channelType, isHealthy);
      } catch (error) {
        logger.error({ error }, `渠道 ${channelType} 健康检查失败`);
        healthStatuses.set(channelType, false);
      }
    }

    return healthStatuses;
  }

  /**
   * 更新渠道状态
   * @param channelType 渠道类型
   * @param status 新的渠道状态
   * @description 当渠道状态发生变化时调用此方法
   */
  public updateStatus(channelType: string, status: ChannelStatus): void {
    this.channelStatuses.set(channelType, status);
  }

  /**
   * 获取渠道状态
   * @param channelType 渠道类型
   * @returns 渠道状态
   */
  public getStatus(channelType: string): ChannelStatus | undefined {
    return this.channelStatuses.get(channelType);
  }

  /**
   * 获取所有渠道状态
   * @returns 所有渠道状态的映射表
   */
  public getAllStatuses(): Map<string, ChannelStatus> {
    return new Map(this.channelStatuses);
  }

  /**
   * 检查渠道是否已注册
   * @param channelType 渠道类型
   * @returns 是否已注册
   */
  public has(channelType: string): boolean {
    return this.channels.has(channelType);
  }

  /**
   * 获取已注册渠道的数量
   * @returns 渠道数量
   */
  public size(): number {
    return this.channels.size;
  }

  /**
   * 清空所有渠道
   * @description 停止所有渠道并清空注册表
   */
  public async clear(): Promise<void> {
    await this.stopAll();
    this.channels.clear();
    this.channelStatuses.clear();
    logger.info("渠道注册表已清空");
  }

  /**
   * 从配置加载渠道
   * @param config 渠道配置
   * @description 根据配置加载并注册渠道
   */
  public async loadFromConfig(config: ChannelsConfig): Promise<void> {
    logger.info(`从配置加载渠道，启用渠道: ${config.enabled.join(", ")}`);

    // 遍历渠道配置数组
    for (const channelConfig of config.channels) {
      // 检查渠道是否启用
      if (!channelConfig.enabled) {
        logger.info(`渠道 ${channelConfig.type} 已禁用，跳过`);
        continue;
      }

      // 检查渠道是否在启用列表中
      if (!config.enabled.includes(channelConfig.type)) {
        logger.info(`渠道 ${channelConfig.type} 不在启用列表中，跳过`);
        continue;
      }

      try {
        // 根据类型创建渠道实例
        const channel = this._createChannel(channelConfig);
        // 注册渠道
        this.register(channel);
        logger.info(`渠道 ${channelConfig.type} 加载成功`);
      } catch (error) {
        logger.error({ error, channelConfig }, `渠道 ${channelConfig.type} 加载失败`);
      }
    }
  }
  
    /**
   * 创建渠道实例
   * @param config 渠道配置
   * @returns 渠道实例
   * @private
   */
  private _createChannel(config: ChannelConfig): BaseChannel {
    switch (config.type) {
      case "cli":
        return new CLIChannel(config);
      // case "telegram":
      //   return new TelegramChannel(config);
      // 暂时禁用：减少依赖加载
      case "discord":
        return new DiscordChannel(config);
      case "qq":
        return new QQChannel(config);
      // case "whatsapp":
      //   return new WhatsAppChannel(config);
      // 暂时禁用：减少依赖加载
      case "email":
        return new EmailChannel(config);
      case "feishu":
        return new FeishuChannel(config);
      // case "slack":
      //   return new SlackChannel(config);
      // 暂时禁用：减少依赖加载
      // case "dingtalk":
      //   return new DingtalkChannel(config);
      // 暂时禁用：dingtalk-sdk 需要钉钉运行环境，Node.js 中无法正常工作
      default:
        // 理论上不会执行到这里，因为 TypeScript 的类型系统保证所有类型都已处理
        // 但保留 default 用于问题定位和类型安全
        throw new Error(`不支持的渠道类型: ${JSON.stringify(config as unknown)}`);
    }
  }
}