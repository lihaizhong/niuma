# 渠道接入指南

本文档介绍如何配置和使用 Niuma 支持的各种消息渠道。

## 目录

- [CLI 渠道](#cli-渠道)
- [Telegram 渠道](#telegram-渠道)
- [Discord 渠道](#discord-渠道)
- [飞书渠道](#飞书渠道)
- [其他渠道](#其他渠道)

---

## CLI 渠道

CLI 渠道是最简单的交互方式，通过命令行进行对话。

### 特性

- 零配置启动
- 支持斜杠命令
- 适合开发和测试

### 启动方式

```bash
# 基本启动
niuma chat

# 仅使用 CLI 渠道
niuma chat --no-channels

# 使用指定角色
niuma chat --agent developer --no-channels
```

### 内置命令

| 命令 | 描述 |
|------|------|
| `/exit` 或 `/quit` | 退出程序 |
| `/clear` | 清屏 |
| `/status` | 显示当前状态 |

### 配置示例

```json5
{
  channels: {
    enabled: ["cli"],
    channels: [
      {
        type: "cli",
        enabled: true,
        // 可选配置
        // prompt: "You > ",
        // welcomeMessage: "欢迎使用 Niuma"
      }
    ]
  }
}
```

### 代码接入

```typescript
import { CLIChannel } from 'niuma';

const cliChannel = new CLIChannel({
  enabled: true,
  prompt: 'You > ',
  welcomeMessage: 'Niuma 助手已启动',
});

// 设置消息处理器
cliChannel.setMessageHandler(async (message) => {
  // 处理消息
  return { content: '回复内容' };
});

// 启动
await cliChannel.start();
```

---

## Telegram 渠道

通过 Telegram Bot API 接收和发送消息。

### 前置条件

1. 拥有 Telegram 账号
2. 创建 Telegram Bot（通过 [@BotFather](https://t.me/botfather)）

### 创建 Bot

1. 在 Telegram 中搜索 `@BotFather`
2. 发送 `/newbot` 命令
3. 按提示设置 Bot 名称和用户名
4. 保存返回的 **Token**（格式：`123456789:ABCdefGHIjklMNOpqrsTUVwxyz`）

### 配置

```json5
{
  channels: {
    enabled: ["telegram"],
    channels: [
      {
        type: "telegram",
        enabled: true,
        token: "${TELEGRAM_BOT_TOKEN}",  // Bot Token
        webhookUrl: "https://your-domain.com",  // 可选，用于 Webhook 模式
        timeout: 30000  // 可选，超时时间（毫秒）
      }
    ]
  }
}
```

### 环境变量

```bash
# .env 或系统环境变量
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 运行模式

#### Polling 模式（默认）

无需公网地址，Bot 主动轮询新消息。适合开发和测试。

```bash
niuma chat --channels telegram
```

#### Webhook 模式

需要公网可访问的 HTTPS 地址，Telegram 主动推送消息。适合生产环境。

```json5
{
  type: "telegram",
  token: "${TELEGRAM_BOT_TOKEN}",
  webhookUrl: "https://your-domain.com"  // 启用 Webhook
}
```

### 代码接入

```typescript
import { TelegramChannel } from 'niuma';

const telegramChannel = new TelegramChannel({
  enabled: true,
  token: process.env.TELEGRAM_BOT_TOKEN!,
  // webhookUrl: 'https://your-domain.com',  // 可选
});

await telegramChannel.start();

// 发送消息
await telegramChannel.send({
  chatId: 'telegram:123456789',
  content: 'Hello from Niuma!',
});
```

### 支持的消息类型

- 文本消息
- 图片（自动下载并处理）
- 文档（自动下载并处理）

---

## Discord 渠道

通过 Discord Bot API 接收和发送消息。

### 前置条件

1. 拥有 Discord 账号
2. 在 [Discord Developer Portal](https://discord.com/developers/applications) 创建应用

### 创建 Bot

1. 访问 [Discord Developer Portal](https://discord.com/developers/applications)
2. 点击 "New Application" 创建应用
3. 进入 "Bot" 页面，点击 "Add Bot"
4. 保存 **Token**
5. 记录 **Application ID**

### 配置 Intents

在 Bot 页面，启用以下 Privileged Gateway Intents：

- ✅ MESSAGE CONTENT INTENT
- ✅ SERVER MEMBERS INTENT（可选）
- ✅ PRESENCE INTENT（可选）

### 邀请 Bot

生成 OAuth2 链接：

1. 进入 "OAuth2" → "URL Generator"
2. 选择 `bot` scope
3. 选择权限：`Send Messages`、`Read Messages`、`Read Message History`
4. 复制生成的链接，在浏览器中打开邀请 Bot

### 配置

```json5
{
  channels: {
    enabled: ["discord"],
    channels: [
      {
        type: "discord",
        enabled: true,
        token: "${DISCORD_BOT_TOKEN}",
        applicationId: "${DISCORD_APPLICATION_ID}",
        intents: ["GUILDS", "GUILD_MESSAGES", "MESSAGE_CONTENT"]
      }
    ]
  }
}
```

### 环境变量

```bash
# .env 或系统环境变量
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_APPLICATION_ID=123456789012345678
```

### 启动

```bash
niuma chat --channels discord
```

### 代码接入

```typescript
import { DiscordChannel } from 'niuma';

const discordChannel = new DiscordChannel({
  enabled: true,
  token: process.env.DISCORD_BOT_TOKEN!,
  applicationId: process.env.DISCORD_APPLICATION_ID!,
  intents: ['GUILDS', 'GUILD_MESSAGES', 'MESSAGE_CONTENT'],
});

await discordChannel.start();

// 发送消息
await discordChannel.send({
  chatId: 'discord:123456789012345678',  // Discord 频道 ID
  content: 'Hello from Niuma!',
});
```

### 获取频道 ID

1. 在 Discord 设置中启用 "开发者模式"（设置 → 高级 → 开发者模式）
2. 右键点击频道 → "复制 ID"

---

## 飞书渠道

通过飞书开放平台接收和发送消息。

### 前置条件

1. 拥有飞书管理员权限
2. 在 [飞书开放平台](https://open.feishu.cn/) 创建企业自建应用

### 创建应用

1. 访问 [飞书开放平台](https://open.feishu.cn/app)
2. 创建企业自建应用
3. 记录 **App ID** 和 **App Secret**

### 配置权限

在应用的"权限管理"中开通以下权限：

- `im:message` - 获取与发送消息
- `im:message:receive_as_bot` - 接收群聊消息

### 配置事件订阅

1. 在"事件订阅"页面启用事件订阅
2. 设置请求网址：`http://your-server:3000/feishu/events`
3. 订阅事件：`im.message.receive_v1`

### 配置

```json5
{
  channels: {
    enabled: ["feishu"],
    channels: [
      {
        type: "feishu",
        enabled: true,
        appId: "${FEISHU_APP_ID}",
        appSecret: "${FEISHU_APP_SECRET}",
        encryptKey: "${FEISHU_ENCRYPT_KEY}",  // 可选
        verificationToken: "${FEISHU_VERIFICATION_TOKEN}",  // 可选
        serverPort: 3000,
        serverPath: "/feishu/events"
      }
    ]
  }
}
```

### 环境变量

```bash
# .env 或系统环境变量
FEISHU_APP_ID=cli_xxxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
FEISHU_ENCRYPT_KEY=xxxxxx  # 可选
FEISHU_VERIFICATION_TOKEN=xxxxxx  # 可选
```

### 启动

```bash
niuma chat --channels feishu
```

### 代码接入

```typescript
import { FeishuChannel } from 'niuma';

const feishuChannel = new FeishuChannel({
  enabled: true,
  appId: process.env.FEISHU_APP_ID!,
  appSecret: process.env.FEISHU_APP_SECRET!,
  serverPort: 3000,
  serverPath: '/feishu/events',
});

await feishuChannel.start();

// 发送消息
await feishuChannel.send({
  chatId: 'oc_xxxxxxxxxxxxx',  // 飞书群聊 ID
  content: 'Hello from Niuma!',
});
```

### 获取群聊 ID

1. 在飞书群聊中添加机器人
2. 发送消息给机器人
3. 从日志或事件中获取 `chat_id`

---

## 其他渠道

以下渠道已实现基础架构，可按需配置：

### Slack

```json5
{
  type: "slack",
  enabled: true,
  botToken: "xoxb-xxxxxxxxxxxx",
  appToken: "xapp-xxxxxxxxxxxx",  // Socket Mode
  signingSecret: "xxxxxxxxxxxxxxxx",  // Webhook 签名验证
  serverPort: 3000,
  serverPath: "/slack/events"
}
```

### 钉钉

```json5
{
  type: "dingtalk",
  enabled: true,
  appKey: "xxxxxxxxxxxx",
  appSecret: "xxxxxxxxxxxxxxxx",
  serverPort: 3000,
  serverPath: "/dingtalk/events"
}
```

### WhatsApp

```json5
{
  type: "whatsapp",
  enabled: true,
  authStatePath: "./whatsapp-session",  // 会话存储路径
  browser: ["Niuma", "Chrome", "120.0"]  // 浏览器标识
}
```

### 邮件

```json5
{
  type: "email",
  enabled: true,
  imap: {
    host: "imap.gmail.com",
    port: 993,
    user: "your-email@gmail.com",
    password: "app-password",
    secure: true,
    inbox: "INBOX"
  },
  smtp: {
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    user: "your-email@gmail.com",
    password: "app-password",
    from: "Niuma <your-email@gmail.com>"
  },
  checkInterval: 60000  // 检查间隔（毫秒）
}
```

### QQ

```json5
{
  type: "qq",
  enabled: true,
  account: 123456789,
  password: "your-password",
  platform: 5,  // 平台类型
  useSlider: false,
  deviceFilePath: "./qq-device"
}
```

---

## 多渠道同时运行

可以同时启用多个渠道：

```json5
{
  channels: {
    enabled: ["cli", "telegram", "discord"],
    channels: [
      { type: "cli", enabled: true },
      { type: "telegram", enabled: true, token: "${TELEGRAM_BOT_TOKEN}" },
      { type: "discord", enabled: true, token: "${DISCORD_BOT_TOKEN}", applicationId: "${DISCORD_APP_ID}" }
    ]
  }
}
```

启动命令：

```bash
niuma chat --channels cli,telegram,discord
```

---

## 渠道状态检查

```bash
# 查看所有渠道状态
niuma channels status

# 列出所有渠道
niuma channels list

# 启动指定渠道
niuma channels start telegram discord

# 停止指定渠道
niuma channels stop telegram
```

---

## 故障排查

### CLI 渠道

- **问题**：无法输入
- **解决**：检查终端是否支持交互模式

### Telegram 渠道

- **问题**：Bot 无响应
- **解决**：
  1. 检查 Token 是否正确
  2. 确认 Bot 已被添加到群组（群聊场景）
  3. 检查网络连接（Polling 模式）

### Discord 渠道

- **问题**：Bot 无法读取消息内容
- **解决**：在 Developer Portal 中启用 "MESSAGE CONTENT INTENT"

### 飞书渠道

- **问题**：无法接收消息
- **解决**：
  1. 确认事件订阅已配置
  2. 检查服务器是否可从公网访问
  3. 验证 IP 白名单设置

---

> 更多问题请参考 [API 文档](./api.md) 或提交 Issue。
