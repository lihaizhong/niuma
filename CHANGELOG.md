# Niuma 变更日志

本文档记录 Niuma 项目的所有重要变更。

## [Unreleased]

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