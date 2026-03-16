# Niuma 变更日志

本文档记录 Niuma 项目的所有重要变更。

## [Unreleased]

### v0.2.2 (2026-03-16)

**Phase 5：多渠道接入**
- ✅ 新增渠道抽象层：BaseChannel、ChannelStatus、ChannelError
- ✅ 新增渠道注册表：ChannelRegistry（注册、注销、启动、停止、健康检查）
- ✅ 实现 CLI 渠道：stdin/stdout 交互、斜杠命令（/help、/exit、/clear、/status）
- ✅ 实现 Telegram 渠道：Webhook 和 Polling 模式、媒体消息支持
- ✅ 实现 Discord 渠道：WebSocket Gateway、Embed 消息支持
- ✅ 实现基础框架：飞书、钉钉、Slack、WhatsApp、Email、QQ
- ✅ 集成 Agent Loop：多渠道消息接收、消息路由、渠道生命周期管理
- ✅ 扩展 SessionManager：SessionKey 生成、渠道会话查询、会话统计
- ✅ 实现 CLI 命令：channels status、channels list、channels start、channels stop
- ✅ 完整测试覆盖：渠道系统测试（16 个测试用例，100% 通过）

**核心特性：**
- 统一渠道接口：所有渠道继承 BaseChannel，实现标准化生命周期
- 消息路由机制：ChannelRegistry 提供消息路由和健康检查
- 会话隔离：使用 SessionKey 格式（channel:chatId:userId）实现会话隔离
- 错误处理：指数退避重试、错误分类、详细日志记录
- 类型安全：完整的 TypeScript 类型定义和 Zod 验证

**依赖更新**
- ✅ 新增依赖：telegraf ^4.16.3（Telegram Bot API）
- ✅ 新增依赖：discord.js ^14.18.0（Discord Bot API）
- ✅ 新增依赖：@slack/bolt ^4.0.0（Slack Bolt API）
- ✅ 新增依赖：nodemailer ^6.10.1（Email SMTP）
- ✅ 新增依赖：imapflow ^1.0.170（Email IMAP）

**Bug 修复**
- ✅ 修复 AgentLoop require 错误：使用 import 替代动态 require
- ✅ 修复 Promise 回调警告：使用非异步回调包装异步逻辑
- ✅ 修复 Discord 类型错误：使用 any 类型绕过联合类型限制
- ✅ 修复 config/merger 类型错误：正确处理 ChannelsConfig 结构

**OpenSpec 变更**
- ✅ phase-5-multi-channel-access：完整提案、设计、规格和任务

### v0.2.1 (2026-03-16)

**Phase 6：Heartbeat 服务 + TODO 补全**
- ✅ 新增 HeartbeatService：主动唤醒服务，支持定时任务执行
- ✅ 实现任务执行：通过 Agent.processDirect 执行定时任务
- ✅ 实现结果发送：将执行结果发送到活跃渠道
- ✅ 实现渠道获取：通过 Agent.sessions 获取活跃渠道
- ✅ 实现 Agent ID 上下文：全局 ToolRegistry 存储 Agent ID
- ✅ 实现 SessionManager 上下文：支持子智能体会话管理
- ✅ 实现子智能体会话：使用 SessionManager 管理独立会话
- ✅ 实现消息发送：通过 SessionManager 添加消息
- ✅ 实现资源清理：子智能体工作区和会话清理
- ✅ 实现 Cron 精确计算：使用 cron-parser 计算下次执行时间
- ✅ 实现用户确认：使用 clack/prompts 实现危险命令确认
- ✅ 实现 --yes/-y 参数：支持非交互环境跳过确认
- ✅ 实现非交互环境检测：支持 CI、Docker 等环境自动检测

**核心特性：**
- 全局上下文模式：ToolRegistry 和 SessionManager 全局引用
- 子智能体完整生命周期：创建、会话管理、消息发送、资源清理
- Shell 工具安全增强：危险命令确认机制、非交互环境支持
- Cron 时间计算：精确的下次执行时间计算

**依赖更新**
- ✅ 新增依赖：cron-parser ^5.5.0

**Bug 修复**
- ✅ 修复 HeartbeatAgent 类型错误：创建专用接口
- ✅ 修复 CronJob 导入错误：使用 ScheduledTask 类型
- ✅ 修复 cron-parser 使用错误：使用 CronParser.parse() 方法

**OpenSpec 变更**
- ✅ phase-6-heartbeat-service：完整提案、设计、规格和任务
- ✅ complete-pending-todos：补全所有代码 TODO

### v0.2.0 (2026-03-16)

**Phase 4：LLM 提供商扩展**
- ✅ 新增 Anthropic 提供商：支持 Claude 3.5 Sonnet、3 Opus 等模型
- ✅ 新增 OpenRouter 提供商：多模型网关，兼容 OpenAI API
- ✅ 新增 DeepSeek 提供商：支持 DeepSeek Chat 和 Coder 模型
- ✅ 新增自定义提供商：支持任意 OpenAI 兼容端点（Azure OpenAI、Ollama、vLLM）
- ✅ 实现智能匹配机制：显式指定 > 关键词匹配 > 网关回退 > 默认提供商
- ✅ 提供商注册表：支持两步式注册（spec + config field）、批量注册和动态查询

**核心特性：**
- 多提供商架构：统一的提供商抽象接口
- 智能模型匹配：支持多种匹配策略
- 配置扩展：支持多提供商配置和环境变量引用
- 向后兼容：保持对旧配置格式的支持

**依赖更新**
- ✅ 新增依赖：@anthropic-ai/sdk ^0.78.0

**OpenSpec 变更**
- ✅ 完整的提案、设计、规格和任务文档
- ✅ 6 个规格文件定义了详细的 REQUIREMENTS

### v0.1.4 (2026-03-15)

**Phase 3.7：环境变量与进程管理工具**
- ✅ 新增 env_get 工具：读取环境变量
- ✅ 新增 env_set 工具：设置环境变量（仅当前进程）
- ✅ 新增 process_list 工具：列出系统进程
- ✅ 新增 process_kill 工具：终止指定进程
- ✅ 使用 Node.js 内置 process.env 和 ps-tree 库

**核心特性：**
- 环境变量管理：支持读取和设置当前进程的环境变量
- 进程列表查询：支持按名称过滤和限制返回数量
- 进程终止：支持 SIGTERM 和 SIGKILL 信号，以及终止进程树
- 安全防护：受保护进程列表（PID 1、自身进程）、确认机制
- 完整的参数验证（环境变量名称格式、进程 ID 验证）

**依赖更新**
- ✅ 新增依赖：ps-tree、@types/ps-tree

**测试覆盖**
- ✅ 新增 28 个测试用例，覆盖所有场景
- ✅ 所有测试通过（73/73）
- ✅ 更新工具注册测试，工具数量从 26 增加到 30

### v0.1.3 (2026-03-15)

**Phase 3.6：加密与解密工具**
- ✅ 新增 encrypt 工具：使用 AES-256-GCM 算法加密数据
- ✅ 新增 decrypt 工具：使用 AES-256-GCM 算法解密数据
- ✅ 新增 hash 工具：计算 SHA-256、SHA-512、MD5 哈希值
- ✅ 使用 Node.js 内置 crypto 模块，无额外依赖
- ✅ 完整的错误处理和中文错误消息

**核心特性：**
- AES-256-GCM 认证加密，同时保证机密性和完整性
- 自动生成随机 IV，避免 IV 重用攻击
- 完整的参数验证（密钥长度、IV 长度、认证标签长度）
- 支持空字符串和大文件内容（10MB+）

**测试覆盖**
- ✅ 新增 25 个测试用例，覆盖所有场景
- ✅ 所有测试通过（333/333）
- ✅ 更新工具注册测试，工具数量从 23 增加到 26

**BREAKING CHANGE: 删除 archive 工具**
- ✅ 移除 archive 和 extract 工具（压缩与解压）
- ✅ 删除依赖：adm-zip、archiver、tar
- ✅ 删除类型定义：@types/adm-zip、@types/archiver、@types/tar

**理由**：Archive 工具对本地资源消耗大，处理大文件时占用大量 CPU 和内存。根据 MCP 优先架构，此类资源密集型功能应通过 MCP Server 提供，以保持 Niuma 核心轻量级。

**迁移建议**：用户可通过 MCP 对接专业的压缩工具。配置示例：

```json5
{
  "mcp": {
    "servers": {
      "filesystem": {
        "transport": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem"],
        "args": ["/path/to/allowed/directory"],
        "enabled": true
      }
    }
  }
}
```

### v0.1.2 (2026-03-15)

**Phase 3.3-3.5：新增工具实现**
- ✅ 压缩与解压工具（archive、extract），支持 zip、tar、tar.gz 等格式
- ✅ 网络工具（ping、dns_lookup、http_request），支持网络连通性测试、DNS 查询和 HTTP 请求
- ✅ JSON/YAML 处理工具（json_parse、json_stringify、yaml_parse、yaml_stringify），支持数据格式转换和解析

**依赖更新**
- ✅ 新增依赖：archiver、adm-zip、tar、ping、js-yaml
- ✅ 新增类型定义：@types/archiver、@types/adm-zip

**测试覆盖**
- ✅ 更新工具注册测试，工具数量从 16 增加到 25
- ✅ 所有测试通过（205/205）

### v0.1.1 (2026-03-15)

**文档优化**
- ✅ 统一 OpenSpec specs 为中文（主 specs 和归档 delta specs）
- ✅ 添加 OpenSpec specs 中文规范到 AGENTS.md
- ✅ 优化文档结构，创建 CHANGELOG.md

**代码质量改进**
- ✅ 统一代码风格使用双引号
- ✅ 定义 ModelConfig 类型替代 agent.ts 中的 any
- ✅ 删除 agent.ts 中重复的 CronTask 接口定义
- ✅ 统一工具文件的代码结构，增强可读性
- ✅ 消除 web.ts 中的 any 类型，使用类型定义

### v0.1.0 (2026-03-11)

**企业级多角色配置系统**
- ✅ JSON5 配置文件格式支持
- ✅ 多角色架构，支持独立 AI 角色
- ✅ 环境变量引用 `${VAR}` 和 `${VAR:default}`
- ✅ defaults-with-overrides 配置模式
- ✅ 角色完全隔离（工作区、会话、日志）
- ✅ 严格 Zod 配置验证

**代码质量改进**
- ✅ 删除未使用的变量和导入
- ✅ 添加完整的测试用例注释

### v0.1.0-beta (2026-03-10)

**Phase 2：Agent 核心**
- ✅ 上下文构建器（支持媒体、技能、记忆）
- ✅ 双层记忆系统
- ✅ 技能系统
- ✅ Agent 循环（LLM ↔ 工具执行）

**Phase 1：核心基础设施**
- ✅ 核心类型系统
- ✅ 配置管理
- ✅ 工具框架
- ✅ 事件总线

## 版本历史

### 已完成功能

| Phase | 名称 | 完成日期 | 状态 |
|-------|------|----------|------|
| Phase 1 | 核心基础设施 | 2026-03-10 | ✅ 已完成 |
| Phase 2 | Agent 核心 | 2026-03-10 | ✅ 已完成 |
| 企业扩展 | 多角色配置系统 | 2026-03-11 | ✅ 已完成 |

### 待开发功能

- **Phase 3：** 内置工具（read_file, write_file, edit_file, exec, web_search 等）
- **Phase 4：** LLM 提供商扩展（Anthropic, OpenRouter, DeepSeek 等）
- **Phase 5：** 多渠道接入（Telegram, Discord, 飞书, 钉钉等）
- **Phase 6：** 定时任务与心跳
- **Phase 7：** MCP 协议支持

详细开发计划请参考：[docs/niuma-development-plan.md](docs/niuma-development-plan.md)