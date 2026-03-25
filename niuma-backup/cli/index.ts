#!/usr/bin/env node
/**
 * Niuma CLI 入口
 *
 * 支持 chat、channels 等命令
 */

import cac from "cac";

import { AgentLoop } from "../agent/loop";
import { ToolRegistry, registerBuiltinTools } from "../agent/tools/registry";
import { EventBus } from "../bus/events";
import { CLIChannel } from "../channels/cli";
import { DiscordChannel } from "../channels/discord";
import { ChannelRegistry } from "../channels/registry";
import { TelegramChannel } from "../channels/telegram";
import { ConfigManager } from "../config/manager";
import { createLogger } from "../log";
import { providerRegistry } from "../providers/registry";
import { SessionManager } from "../session/manager";

import type { ChannelsConfig } from "../config/schema";

const logger = createLogger("cli");

// ============================================
// 常量定义
// ============================================

const VERSION = "0.2.2";

// ============================================
// 辅助函数
// ============================================

/**
 * 加载配置
 */
async function loadConfig(agentId?: string) {
  const configManager = new ConfigManager();

  if (agentId) {
    return configManager.getAgentConfig(agentId);
  }
  return configManager.load();
}

/**
 * 创建渠道注册表
 */
function createChannelRegistry(config: ChannelsConfig): ChannelRegistry {
  const registry = new ChannelRegistry();

  // 注册启用的渠道
  for (const channelConfig of config.channels) {
    if (!channelConfig.enabled) {
      continue;
    }

    switch (channelConfig.type) {
      case "cli":
        registry.register(new CLIChannel(channelConfig));
        break;
      case "telegram":
        registry.register(new TelegramChannel(channelConfig));
        break;
      case "discord":
        registry.register(new DiscordChannel(channelConfig));
        break;
      default:
        logger.warn({ type: channelConfig.type }, "未实现的渠道类型");
    }
  }

  return registry;
}

/**
 * 格式化渠道状态
 */
function formatChannelStatus(status: Map<string, boolean>): string {
  const lines: string[] = [];
  lines.push("渠道状态:");
  lines.push("-".repeat(50));

  for (const [channelType, isHealthy] of status.entries()) {
    const statusIcon = isHealthy ? "✅" : "❌";
    lines.push(`  ${statusIcon} ${channelType}`);
  }

  lines.push("-".repeat(50));
  const healthyCount = Array.from(status.values()).filter(Boolean).length;
  lines.push(`总计: ${healthyCount}/${status.size} 渠道正常`);

  return lines.join("\n");
}

// ============================================
// CLI 初始化
// ============================================

const cli = cac("niuma");

cli.version(VERSION).help();

// ============================================
// chat 命令
// ============================================

cli
  .command("chat", "启动对话")
  .option("--agent <id>", "使用指定角色")
  .option("--channels [types]", "启用的渠道（逗号分隔）")
  .option("--no-channels", "禁用所有渠道", { default: false })
  .action(async (options) => {
    try {
      logger.info("启动 Niuma...");

      // 加载配置
      const configManager = new ConfigManager();
      const config = options.agent ? configManager.getAgentConfig(options.agent) : configManager.load();
      logger.info({ agentId: options.agent || "default" }, "已加载配置");

      // 创建事件总线
      const bus = new EventBus();

      // 创建工具注册表
      const tools = new ToolRegistry();
      registerBuiltinTools(tools);

      // 创建会话管理器
      const sessions = new SessionManager({
        workspace: config.workspaceDir,
      });

      // 处理渠道配置
      let channelsConfig = config.channels;

      if (options.channels && typeof options.channels === "string") {
        // 覆盖启用的渠道
        const enabledChannels = options.channels.split(",");
        channelsConfig = {
          ...channelsConfig,
          enabled: enabledChannels,
        };
      } else if (options.noChannels) {
        // --no-channels 模式：只保留 CLI 渠道（用于交互）
        channelsConfig = {
          ...channelsConfig,
          enabled: ["cli"],
        };
      }

      // 创建渠道注册表（不启动渠道）
      const channelRegistry = createChannelRegistry(channelsConfig);

      // 初始化提供商配置
      configManager.initializeProviders(options.agent);

      // 获取默认提供商
      const provider = configManager.getDefaultProvider(options.agent);

      if (!provider) {
        logger.error("未找到可用的 LLM 提供商");
        process.exit(1);
      }

      // 打印当前 provider 信息
      const availableProviders = configManager.listAvailableProviders(options.agent);
      logger.info(
        {
          provider: provider.name,
          model: provider.getDefaultModel(),
          availableProviders: availableProviders.map((p) => p.name),
        },
        "当前 Provider 信息"
      );

      // 获取或创建 Agent ID
      const agentId = options.agent || "default";

      // 创建并启动 AgentLoop
      const agentLoop = new AgentLoop({
        bus,
        provider,
        tools,
        sessions,
        workspace: config.workspaceDir,
        agentId,
        channelsConfig,
        channelRegistry,
        providerRegistry,
        configManager,
      });

      logger.info("Agent 已启动，等待消息...");

      // 启动 Agent 消息处理循环（会自动启动渠道）
      // 这是阻塞调用，会一直运行直到程序退出
      await agentLoop.run();

      // 监听退出信号
      const shutdown = () => {
        logger.info("正在关闭...");
        const close = async () => {
          if (channelRegistry) {
            await channelRegistry.stopAll();
          }
          process.exit(0);
        };
        close().catch((error) => {
          logger.error({ error }, "关闭失败");
          process.exit(1);
        });
      };

      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error({ error: err.message, stack: err.stack }, "启动失败");
      console.error("详细错误:", err);
      process.exit(1);
    }
  });

// ============================================
// channels 命令
// ============================================

cli
  .command("channels", "渠道管理")
  .action(() => {
    // 显示渠道帮助
    console.log("渠道管理命令:");
    console.log("  niuma channels status   - 查看渠道状态");
    console.log("  niuma channels list     - 列出所有渠道");
    console.log("  niuma channels start    - 启动指定渠道");
    console.log("  niuma channels stop     - 停止指定渠道");
  });

cli
  .command("channels status", "查看渠道状态")
  .option("--agent <id>", "使用指定角色的配置")
  .action(async (options) => {
    try {
      const config = await loadConfig(options.agent);
      const channelRegistry = createChannelRegistry(config.channels);

      const status = await channelRegistry.checkHealth();
      console.log(formatChannelStatus(status));

    } catch (error) {
      logger.error({ error }, "获取渠道状态失败");
      process.exit(1);
    }
  });

cli
  .command("channels list", "列出所有渠道")
  .option("--agent <id>", "使用指定角色的配置")
  .action(async (options) => {
    try {
      const config = await loadConfig(options.agent);
      const channelRegistry = createChannelRegistry(config.channels);

      const channels = channelRegistry.list();
      console.log("已配置的渠道:");
      console.log("-".repeat(50));

      for (const channelType of channels) {
        const channel = channelRegistry.get(channelType);
        if (channel) {
          const status = channel.getStatus();
          console.log(`  - ${channelType}: ${status}`);
        }
      }

      console.log("-".repeat(50));
      console.log(`总计: ${channels.length} 个渠道`);

    } catch (error) {
      logger.error({ error }, "列出渠道失败");
      process.exit(1);
    }
  });

cli
  .command("channels start [types...]", "启动指定渠道")
  .option("--agent <id>", "使用指定角色的配置")
  .action(async (types, options) => {
    try {
      const config = await loadConfig(options.agent);
      const channelRegistry = createChannelRegistry(config.channels);

      if (types.length === 0) {
        // 启动所有渠道
        await channelRegistry.startAll();
        console.log("所有渠道已启动");
      } else {
        // 启动指定渠道
        await channelRegistry.startAll(types);
        console.log(`已启动渠道: ${types.join(", ")}`);
      }

    } catch (error) {
      logger.error({ error }, "启动渠道失败");
      process.exit(1);
    }
  });

cli
  .command("channels stop [types...]", "停止指定渠道")
  .option("--agent <id>", "使用指定角色的配置")
  .action(async (types, options) => {
    try {
      const config = await loadConfig(options.agent);
      const channelRegistry = createChannelRegistry(config.channels);

      if (types.length === 0) {
        // 停止所有渠道
        await channelRegistry.stopAll();
        console.log("所有渠道已停止");
      } else {
        // 停止指定渠道
        await channelRegistry.stopAll(types);
        console.log(`已停止渠道: ${types.join(", ")}`);
      }

    } catch (error) {
      logger.error({ error }, "停止渠道失败");
      process.exit(1);
    }
  });

// ============================================
// 解析命令行参数
// ============================================

cli.parse();
