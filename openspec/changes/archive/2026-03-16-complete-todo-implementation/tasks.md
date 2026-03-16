## 1. 基础设施准备

- [ ] 1.1 添加渠道依赖包到 package.json
  - 添加 `oicq` (QQ Bot SDK)
  - 添加 `@whiskeysockets/baileys` (WhatsApp Web API)
  - 添加 `@larksuiteoapi/node-sdk` (飞书官方 SDK)
  - 添加 `dingtalk-sdk` (钉钉官方 SDK)
  - 运行 `pnpm install` 确保依赖安装成功

- [ ] 1.2 更新 ChannelConfigSchema 支持新渠道
  - 添加 QQ 渠道配置类型
  - 添加 WhatsApp 渠道配置类型
  - 添加 Email 渠道配置类型
  - 添加飞书渠道配置类型
  - 添加钉钉渠道配置类型

## 2. SessionManager 文件系统集成

- [ ] 2.1 实现 `_scanSessionFiles()` 私有方法
  - 扫描 `this.sessionsDir` 目录
  - 读取所有 `.json` 文件
  - 解析 SessionKey 提取 channel 和 userId
  - 使用 LRU 缓存策略存储扫描结果

- [ ] 2.2 实现 `getSessionsByChannel()` 方法
  - 遍历缓存中的会话
  - 调用 `_scanSessionFiles()` 加载文件系统中的会话
  - 过滤指定 channel 的会话
  - 返回会话列表

- [ ] 2.3 实现 `getSessionsByUser()` 方法
  - 遍历缓存中的会话
  - 调用 `_scanSessionFiles()` 加载文件系统中的会话
  - 过滤指定 userId 的会话
  - 返回会话列表

- [ ] 2.4 实现 `getSessionStats()` 方法
  - 遍历缓存中的会话
  - 调用 `_scanSessionFiles()` 加载文件系统中的会话
  - 统计总会话数、活跃会话数、各渠道会话数
  - 返回统计信息

- [ ] 2.5 编写 SessionManager 测试
  - 测试文件系统查询功能
  - 测试会话统计功能
  - 测试 LRU 缓存策略

## 3. QQ 渠道实现

- [ ] 3.1 实现 QQChannel 类的 `start()` 方法
  - 初始化 oicq 客户端
  - 登录 QQ Bot
  - 监听消息事件
  - 转换消息格式为 `InboundMessage`
  - 调用 `handleMessage()` 处理消息

- [ ] 3.2 实现 QQChannel 类的 `stop()` 方法
  - 断开 QQ Bot 连接
  - 清理事件监听器
  - 释放资源

- [ ] 3.3 实现 QQChannel 类的 `send()` 方法
  - 将 `OutboundMessage` 转换为 QQ 消息格式
  - 调用 QQ Bot API 发送消息
  - 处理发送失败

- [ ] 3.4 实现 QQChannel 类的 `healthCheck()` 方法
  - 检查 QQ Bot 连接状态
  - 返回健康状态

- [ ] 3.5 编写 QQ 渠道测试
  - 测试消息接收功能
  - 测试消息发送功能
  - 测试健康检查功能

## 4. WhatsApp 渠道实现

- [ ] 4.1 实现 WhatsAppChannel 类的 `start()` 方法
  - 初始化 Baileys 客户端
  - 连接 WhatsApp Web
  - 监听消息事件
  - 转换消息格式为 `InboundMessage`
  - 调用 `handleMessage()` 处理消息

- [ ] 4.2 实现 WhatsAppChannel 类的 `stop()` 方法
  - 断开 WhatsApp 连接
  - 清理事件监听器
  - 释放资源

- [ ] 4.3 实现 WhatsAppChannel 类的 `send()` 方法
  - 将 `OutboundMessage` 转换为 WhatsApp 消息格式
  - 调用 WhatsApp API 发送消息
  - 处理发送失败

- [ ] 4.4 实现 WhatsAppChannel 类的 `healthCheck()` 方法
  - 检查 WhatsApp 连接状态
  - 返回健康状态

- [ ] 4.5 编写 WhatsApp 渠道测试
  - 测试消息接收功能
  - 测试消息发送功能
  - 测试健康检查功能

## 5. Email 渠道完善

- [ ] 5.1 实现 EmailChannel 类的 `start()` 方法
  - 连接 IMAP 服务器
  - 监听新邮件
  - 转换邮件为 `InboundMessage`
  - 调用 `handleMessage()` 处理邮件

- [ ] 5.2 实现 EmailChannel 类的 `stop()` 方法
  - 关闭 IMAP 连接
  - 关闭 SMTP 连接
  - 清理事件监听器

- [ ] 5.3 实现 EmailChannel 类的 `send()` 方法
  - 将 `OutboundMessage` 转换为邮件格式
  - 使用 SMTP 发送邮件
  - 处理发送失败

- [ ] 5.4 实现 EmailChannel 类的 `healthCheck()` 方法
  - 检查 IMAP 和 SMTP 连接状态
  - 返回健康状态

- [ ] 5.5 编写 Email 渠道测试
  - 测试邮件接收功能
  - 测试邮件发送功能
  - 测试健康检查功能

## 6. 飞书渠道实现

- [ ] 6.1 实现 FeishuChannel 类的 `start()` 方法
  - 初始化飞书 SDK 客户端
  - 监听飞书事件
  - 转换消息格式为 `InboundMessage`
  - 调用 `handleMessage()` 处理消息

- [ ] 6.2 实现 FeishuChannel 类的 `stop()` 方法
  - 断开飞书连接
  - 清理事件监听器
  - 释放资源

- [ ] 6.3 实现 FeishuChannel 类的 `send()` 方法
  - 将 `OutboundMessage` 转换为飞书消息格式
  - 调用飞书 API 发送消息
  - 处理发送失败

- [ ] 6.4 实现 FeishuChannel 类的 `healthCheck()` 方法
  - 检查飞书连接状态
  - 返回健康状态

- [ ] 6.5 编写飞书渠道测试
  - 测试消息接收功能
  - 测试消息发送功能
  - 测试健康检查功能

## 7. Slack 渠道完善

- [ ] 7.1 实现 SlackChannel 类的 `start()` 方法
  - 初始化 Slack Bolt 客户端
  - 监听 Slack 事件
  - 转换消息格式为 `InboundMessage`
  - 调用 `handleMessage()` 处理消息

- [ ] 7.2 实现 SlackChannel 类的 `stop()` 方法
  - 断开 Slack 连接
  - 清理事件监听器
  - 释放资源

- [ ] 7.3 实现 SlackChannel 类的 `send()` 方法
  - 将 `OutboundMessage` 转换为 Slack 消息格式
  - 调用 Slack API 发送消息
  - 处理发送失败

- [ ] 7.4 实现 SlackChannel 类的 `healthCheck()` 方法
  - 检查 Slack 连接状态
  - 返回健康状态

- [ ] 7.5 编写 Slack 渠道测试
  - 测试消息接收功能
  - 测试消息发送功能
  - 测试健康检查功能

## 8. 钉钉渠道实现

- [ ] 8.1 实现 DingtalkChannel 类的 `start()` 方法
  - 初始化钉钉 SDK 客户端
  - 监听钉钉事件
  - 转换消息格式为 `InboundMessage`
  - 调用 `handleMessage()` 处理消息

- [ ] 8.2 实现 DingtalkChannel 类的 `stop()` 方法
  - 断开钉钉连接
  - 清理事件监听器
  - 释放资源

- [ ] 8.3 实现 DingtalkChannel 类的 `send()` 方法
  - 将 `OutboundMessage` 转换为钉钉消息格式
  - 调用钉钉 API 发送消息
  - 处理发送失败

- [ ] 8.4 实现 DingtalkChannel 类的 `healthCheck()` 方法
  - 检查钉钉连接状态
  - 返回健康状态

- [ ] 8.5 编写钉钉渠道测试
  - 测试消息接收功能
  - 测试消息发送功能
  - 测试健康检查功能

## 9. Agent ID 配置优化

- [ ] 9.1 更新 `AgentLoopOptions` 接口
  - 添加 `agentId?: string` 字段

- [ ] 9.2 更新 `AgentLoop` 构造函数
  - 接收 `agentId` 参数
  - 使用 `this.tools.setAgentId(agentId)` 替换硬编码

- [ ] 9.3 更新 `index.ts` 的 `chat` 命令
  - 从配置中获取 `agentId`
  - 传递给 `AgentLoop` 构造函数

- [ ] 9.4 编写 Agent ID 配置测试
  - 测试 Agent ID 配置功能
  - 测试多角色配置

## 10. 渠道配置加载实现

- [ ] 10.1 实现 `ChannelRegistry.loadFromConfig()` 方法
  - 遍历 `config.channels` 数组
  - 检查 `channel.enabled` 字段
  - 根据类型创建渠道实例
  - 调用 `register()` 注册渠道

- [ ] 10.2 实现渠道工厂函数
  - 根据类型创建对应的渠道实例
  - 传递配置参数

- [ ] 10.3 实现渠道配置验证
  - 验证必需字段
  - 验证字段类型
  - 验证配置格式

- [ ] 10.4 编写渠道配置加载测试
  - 测试配置加载功能
  - 测试渠道工厂函数
  - 测试配置验证功能

## 11. CLI 入口完善

- [ ] 11.1 完善 `chat` 命令的渠道初始化
  - 创建 LLM 提供商实例
  - 调用 `loadFromConfig()` 加载渠道
  - 启动 AgentLoop

- [ ] 11.2 实现 `channels` 子命令
  - 实现 `channels status` 命令
  - 实现 `channels list` 命令
  - 实现 `channels start` 命令
  - 实现 `channels stop` 命令

- [ ] 11.3 编写 CLI 命令测试
  - 测试 `chat` 命令
  - 测试 `channels` 子命令

## 12. 集成测试

- [ ] 12.1 编写 Agent Loop 与渠道集成测试
  - 测试多渠道消息接收
  - 测试消息路由功能

- [ ] 12.2 编写配置加载集成测试
  - 测试完整配置加载流程
  - 测试多角色配置

- [ ] 12.3 编写端到端测试
  - 测试完整的消息流程
  - 测试各渠道的消息收发

## 13. 文档更新

- [ ] 13.1 更新 CHANGELOG.md
  - 记录新增功能
  - 记录 Bug 修复
  - 更新版本号

- [ ] 13.2 更新 AGENTS.md
  - 添加渠道实现说明
  - 更新依赖列表

- [ ] 13.3 更新 README.md
  - 添加新功能说明
  - 添加配置示例

- [ ] 13.4 更新开发计划文档
  - 更新 TODO 完成状态
  - 更新项目统计

## 14. 验证和清理

- [ ] 14.1 运行所有测试
  - 执行 `pnpm test`
  - 执行 `pnpm type-check`
  - 执行 `pnpm lint`

- [ ] 14.2 手动测试
  - 启动 Agent 并启用多个渠道
  - 测试各渠道的消息收发
  - 测试配置加载功能

- [ ] 14.3 移除所有 TODO 注释
  - 检查所有已完成的 TODO
  - 移除对应的注释

- [ ] 14.4 性能测试
  - 测试 SessionManager 文件系统查询性能
  - 测试多渠道并发性能
  - 测试内存占用

- [ ] 14.5 归档变更
  - 使用 `/opsx:archive` 归档变更
  - 验证规格同步到 `openspec/specs/`
  - 更新开发计划文档