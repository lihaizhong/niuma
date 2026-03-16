## Context

当前 Niuma 仅支持 CLI 渠道，用户通过命令行交互。消息类型定义（`types/message.ts`）已经包含了 9 个渠道类型（cli、telegram、discord、feishu、dingtalk、slack、whatsapp、email、qq）和消息接口（InboundMessage、OutboundMessage），但缺少具体的渠道实现。

现有的基础设施：
- `niuma/agent/loop.ts` - Agent 主循环，处理消息和工具调用
- `niuma/session/manager.ts` - 会话管理，支持会话隔离和持久化
- `niuma/bus/` - 事件总线，支持模块间异步通信
- `niuma/types/message.ts` - 消息类型定义（已完成）
- `niuma/channels/` - 空目录，待实现

## Goals / Non-Goals

**Goals:**
- 提供统一的渠道抽象接口，支持多种消息平台
- 实现 9 个渠道（CLI、Telegram、Discord、飞书、钉钉、Slack、WhatsApp、Email、QQ）
- 支持渠道注册、启动、停止和消息路由
- 与 Agent Loop 无缝集成，支持多渠道并发处理
- 支持渠道会话隔离和独立配置
- 提供渠道健康检查和错误恢复机制

**Non-Goals:**
- 复杂的消息格式转换（仅支持文本和基础媒体）
- 渠道间的消息转发和同步
- 渠道权限管理和访问控制
- 渠道消息的持久化和历史记录重放
- 实时协作功能（如多用户同时会话）

## Decisions

### 1. 渠道抽象接口设计
**决策：** 使用抽象类 + 生命周期方法模式

```typescript
export abstract class BaseChannel {
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract send(message: OutboundMessage): Promise<void>;
  abstract onMessage(handler: (message: InboundMessage) => Promise<void>): void;
  abstract healthCheck(): Promise<boolean>;
}
```

**理由：**
- 抽象类强制实现核心方法，保证接口一致性
- 生命周期方法（start/stop）便于资源管理和优雅关闭
- 事件驱动模式（onMessage）适合异步消息处理
- 健康检查方法便于监控和故障恢复

**替代方案：**
- 接口（Interface）→ 无法提供默认实现，灵活性不足
- 组合模式（Composition）→ 增加复杂性，不如继承直观

### 2. 渠道注册表设计
**决策：** 使用 Map 存储 + 事件总线通知

```typescript
export class ChannelRegistry {
  private channels: Map<string, BaseChannel> = new Map();
  private bus: EventBus;

  register(channelId: string, channel: BaseChannel): void;
  unregister(channelId: string): void;
  get(channelId: string): BaseChannel | undefined;
  startAll(): Promise<void>;
  stopAll(): Promise<void>;
}
```

**理由：**
- Map 提供快速查找和迭代
- 事件总线通知渠道状态变化
- 批量启动/停止便于生命周期管理

**替代方案：**
- 数组存储 → 查找效率低（O(n)）
- 单例模式 → 无法支持多实例（如多个 Telegram Bot）

### 3. 消息路由策略
**决策：** 基于 ChannelType 和 SessionKey 的两级路由

```typescript
// Agent Loop 处理流程
async processMessage(message: InboundMessage) {
  const sessionKey = `${message.channel}:${message.chatId}`;
  const session = sessionManager.getOrCreate(sessionKey);
  // ... 处理消息
}
```

**理由：**
- ChannelType 区分渠道来源
- ChatId 区分同一渠道的不同会话
- SessionKey 保证会话隔离

**替代方案：**
- 全局会话 → 会话冲突，不支持多用户
- 单一 SessionKey → 无法区分渠道和会话

### 4. 渠道配置管理
**决策：** 分层配置 + 环境变量支持

```json5
{
  "channels": {
    "enabled": ["cli", "telegram", "discord"],
    "defaults": {
      "timeout": 30000,
      "retryAttempts": 3
    },
    "telegram": {
      "token": "${TELEGRAM_BOT_TOKEN}",
      "webhook": {
        "enabled": true,
        "url": "https://example.com/webhook/telegram"
      }
    },
    "discord": {
      "token": "${DISCORD_BOT_TOKEN}",
      "intents": ["GUILDS", "GUILD_MESSAGES"]
    }
  }
}
```

**理由：**
- 分层配置（defaults + channel-specific）灵活且简洁
- 环境变量支持便于安全部署
- 启用列表便于选择性启动渠道

**替代方案：**
- 单一配置文件 → 配置冗长，难以管理
- 硬编码配置 → 无法动态调整

### 5. 错误处理和重试机制
**决策：** 渠道级错误处理 + 指数退避重试

```typescript
async sendWithRetry(message: OutboundMessage, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await this.send(message);
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await this.sleep(Math.pow(2, i) * 1000); // 指数退避
    }
  }
}
```

**理由：**
- 指数退避避免雪崩效应
- 限制重试次数防止无限重试
- 渠道级错误处理不影响其他渠道

**替代方案：**
- 立即失败 → 用户体验差
- 固定间隔重试 → 可能加重服务器负担

### 6. 渠道实现优先级
**决策：** 分阶段实现，优先简单渠道

**Phase 1（核心功能）：**
1. CLI 渠道（现有功能重构）
2. 渠道抽象层
3. 渠道注册表
4. Agent Loop 集成

**Phase 2（简单渠道）：**
5. Telegram（HTTP Bot API）
6. Discord（WebSocket Gateway）
7. QQ（WebSocket）

**Phase 3（复杂渠道）：**
8. 飞书（WebSocket 长连接）
9. 钉钉（Stream Mode）
10. Slack（Socket Mode）
11. Email（IMAP/SMTP）
12. WhatsApp（WebSocket Bridge）

**理由：**
- 渠道复杂度和依赖库成熟度不同
- 分阶段实现降低风险，便于迭代
- 简单渠道作为复杂渠道的参考实现

## Risks / Trade-offs

### 风险 1：渠道依赖库兼容性
**风险：** 不同渠道的依赖库可能存在版本冲突或 API 变更

**缓解措施：**
- 使用稳定的依赖版本（锁定在 package.json）
- 定期更新依赖并测试兼容性
- 封装依赖库，隔离 API 变更影响

### 风险 2：渠道资源消耗
**风险：** 多渠道并发运行可能占用大量内存和连接

**缓解措施：**
- 提供渠道启用/禁用配置
- 实现连接池和资源限制
- 监控渠道健康状态，自动重启失败渠道

### 风险 3：消息丢失
**风险：** 渠道故障或网络问题导致消息丢失

**缓解措施：**
- 实现消息确认机制（ACK）
- 本地消息队列缓存（可选）
- 日志记录所有消息，便于审计和恢复

### 风险 4：会话管理复杂性
**风险：** 多渠道会话管理可能导致会话混乱或内存泄漏

**缓解措施：**
- 使用 SessionKey 严格隔离会话
- 实现会话清理机制（TTL）
- 定期检查和释放空闲会话

### 风险 5：配置安全性
**风险：** 渠道配置（如 Token）可能泄露

**缓解措施：**
- 优先使用环境变量存储敏感信息
- 配置文件添加到 .gitignore
- 提供配置验证和加密选项

## Migration Plan

**部署步骤：**

1. **基础设施准备**
   - 创建 `niuma/channels/` 目录结构
   - 安装渠道依赖包（telegraf、discord.js 等）
   - 更新配置 Schema 添加 channels 段

2. **核心功能实现**
   - 实现渠道抽象层（`channels/base.ts`）
   - 实现渠道注册表（`channels/registry.ts`）
   - 重构 CLI 渠道（`channels/cli/`）
   - 集成到 Agent Loop

3. **Phase 2 渠道实现**
   - 实现 Telegram 渠道
   - 实现 Discord 渠道
   - 实现 QQ 渠道
   - 添加单元测试和集成测试

4. **Phase 3 渠道实现**
   - 实现飞书、钉钉、Slack、Email、WhatsApp 渠道
   - 添加高级功能（Webhook、长连接等）
   - 完善文档和示例配置

5. **验证和部署**
   - 运行所有测试
   - 手动测试各个渠道
   - 性能测试和压力测试
   - 更新文档和 CHANGELOG

**回滚策略：**
- 通过配置禁用所有渠道（`channels.enabled: []`）
- 恢复到仅 CLI 渠道模式
- 移除新增的依赖包（`pnpm remove`）
- 删除 `channels/` 目录

## Open Questions

1. **渠道消息格式转换：** 是否需要统一不同渠道的消息格式（如 Markdown、富文本）？
   - **建议：** 初期仅支持纯文本，后续按需扩展

2. **渠道间消息同步：** 是否支持用户在不同渠道查看同一会话？
   - **建议：** 不支持，保持会话隔离，避免复杂性

3. **渠道优先级：** 如何处理同一用户在多个渠道同时发送消息？
   - **建议：** 按时间戳顺序处理，使用 SessionKey 隔离

4. **渠道性能监控：** 是否需要记录每个渠道的消息吞吐量和延迟？
   - **建议：** 基础监控（消息计数），高级指标按需添加

5. **渠道热重载：** 是否支持运行时启用/禁用渠道？
   - **建议：** 初期不支持，需要重启 Agent；后续可添加热重载功能