# 多渠道集成

**Parent:** [../../AGENTS.md](../../AGENTS.md)

## OVERVIEW

多渠道接入系统 - 统一接口支持多种消息渠道（CLI、Discord、飞书、Email、QQ、Telegram、钉钉、Slack、WhatsApp）。

## STRUCTURE

```
niuma/channels/
├── base.ts                 # BaseChannel 抽象基类
├── registry.ts             # ChannelRegistry 注册表
├── types.ts                # 共享类型定义
├── index.ts                # 导出
├── cli/                    # CLI 渠道
│   └── index.ts
├── discord/                # Discord WebSocket
│   └── index.ts
├── feishu/                 # 飞书 WebSocket
│   └── index.ts
├── email/                  # IMAP/SMTP 渠道
│   └── index.ts
├── qq/                     # QQ 渠道 (oicq)
│   └── index.ts
├── telegram/               # Telegram Bot API (暂停)
│   └── index.ts
├── dingtalk/               # 钉钉 Stream (暂停)
│   └── index.ts
├── slack/                  # Slack Socket (暂停)
│   └── index.ts
├── whatsapp/               # WhatsApp (暂停)
│   └── index.ts
└── AGENTS.md               # 本文件
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| 渠道基类 | `base.ts` | BaseChannel 抽象类 |
| 渠道注册 | `registry.ts` | register/unregister |
| CLI 渠道 | `cli/` | stdin/stdout |
| Discord | `discord/` | WebSocket Gateway |
| 飞书 | `feishu/` | WebSocket 长连接 |
| Email | `email/` | IMAP/SMTP |
| QQ | `qq/` | oicq 库 |

## CHANNEL STATUS

| Channel | Protocol | Status |
|---------|----------|--------|
| CLI | stdin/stdout | ✅ Active |
| Discord | WebSocket | ✅ Active |
| Feishu | WebSocket | ✅ Active |
| Email | IMAP/SMTP | ✅ Active |
| QQ | WebSocket | ✅ Active |
| Telegram | HTTP Bot | ⏸️ Paused |
| DingTalk | Stream | ⏸️ Paused |
| Slack | Socket | ⏸️ Paused |
| WhatsApp | WebSocket | ⏸️ Paused |

## CORE PATTERNS

### BaseChannel Interface
```typescript
abstract class BaseChannel {
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract send(message: Message): Promise<void>;
}
```

### Channel Registration
```typescript
const registry = new ChannelRegistry();
registry.register(new DiscordChannel(config));
registry.register(new FeishuChannel(config));
```

### Message Format
```typescript
interface Message {
  channel: string;
  userId: string;
  content: string;
  metadata?: Record<string, unknown>;
}
```

## ANTI-PATTERNS

| Pattern | Rule |
|---------|------|
| 直接发送原始消息 | 使用统一 Message 格式 |
| 渠道间共享状态 | 每个渠道独立实例 |
| 忽略渠道错误 | 必须处理连接错误 |

## NOTES

- **多实例:** 支持同时运行多个渠道
- **消息路由:** 通过 EventBus 分发到 Agent
- **暂停渠道:** Telegram/DingTalk/Slack/WhatsApp 暂时禁用