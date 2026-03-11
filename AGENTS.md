# Niuma（牛马）- 项目上下文

## 项目概述

Niuma（牛马）是一个智能生活助手 CLI 工具，支持多角色架构，可创建多个独立的 AI 角色（项目经理、开发工程师、测试工程师等），每个角色拥有独立的配置、工作区和数据，完全隔离。

**核心特性：** 多角色架构、JSON5 配置、环境变量引用、完全隔离  
**当前状态：** v0.1.0 - 多角色配置系统已实现，Phase 2 Agent Core 核心模块已完成

## 技术栈

### 核心技术
- TypeScript 5.9.3
- Node.js >=18.0.0
- pnpm

### 主要依赖
| 依赖 | 用途 |
|------|------|
| langchain | AI/LLM 应用框架 |
| zod | 运行时类型验证 |
| json5 | JSON5 配置文件格式 |
| better-sqlite3 | 本地 SQLite 数据库 |
| sqlite-vec | 向量存储扩展 |
| @clack/prompts | CLI 交互界面 |
| cac | 命令行参数解析 |

### 开发依赖
- tsx、vitest、eslint

## 项目结构

```
niuma/
├── niuma/
│   ├── agent/          # Agent 核心模块
│   ├── config/         # 配置系统
│   ├── providers/      # LLM 提供商
│   ├── session/        # 会话管理
│   ├── bus/            # 事件总线
│   ├── channels/       # 多渠道接入
│   ├── types/          # 类型定义
│   └── utils/          # 工具函数
├── openspec/           # OpenSpec 规范文件
├── .iflow/             # iFlow CLI 配置
└── package.json
```

**配置目录：** `~/.niuma/` (niuma.json、.env、sessions/、logs/、agents/)

## 构建与运行

```bash
pnpm install      # 安装依赖
pnpm dev          # 开发模式
pnpm build        # 构建
pnpm start        # 运行
pnpm lint         # 代码检查
pnpm test         # 运行测试
```

## 配置系统

### 多角色架构

```json5
{
  "agents": {
    "defaults": { "progressMode": "normal" },
    "list": [
      { "id": "manager", "name": "项目经理", "default": true },
      { "id": "developer", "name": "开发工程师" }
    ]
  }
}
```

### 环境变量引用

```json5
{ "apiKey": "${OPENAI_API_KEY}" }
```

### 配置优先级
1. 命令行参数
2. 工作区 profile
3. 全局 `~/.niuma/niuma.json`
4. 环境变量
5. 默认值

## 架构设计

### 核心模块
- **Agent** - 智能体核心，处理对话循环、记忆管理、技能调用
- **Tools** - 工具集（文件系统、Shell、Web 请求、MCP 协议）
- **Bus** - 事件总线
- **Channels** - 多渠道接入
- **Providers** - LLM 提供商抽象层
- **Session** - 会话管理
- **Skills** - 可扩展技能系统
- **Cron** - 定时任务

### 数据存储
- SQLite 本地数据库
- sqlite-vec 向量检索

## 开发规范

### 代码风格
- ESLint 检查，TypeScript 严格模式
- ES Module
- **注释使用中文**，代码标识符使用英文
- **图表使用 mermaid 语法**

### 提交规范
- Conventional Commits: `type: description`

### 分支策略
- `main` - 主分支
- `feat/*` - 功能分支

## 工作流约束（强制）

### 1. 必须触发 fullstack-workflow skill
```bash
Skill(skill: "fullstack-workflow")
```

**Subagent 映射：**
| 任务类型 | Subagent |
|----------|----------|
| 规划分析 | plan-agent |
| 代码探索 | explore-agent |
| 代码审查 | code-reviewer |
| 前端测试 | frontend-tester |
| 深度研究 | search-specialist |
| 复杂任务 | general-purpose |

### 2. 必须使用 OpenSpec CLI 命令
```bash
/opsx:explore   # 探索模式
/opsx:propose   # 创建提案
/opsx:apply     # 实施变更
/opsx:archive   # 归档变更
```

**工作流：** `/opsx:explore` → `/opsx:propose` → `/opsx:apply` → `/opsx:archive`

## CLI 命令

```bash
niuma chat                      # 默认角色对话
niuma chat --agent developer    # 指定角色
niuma agents list               # 列出角色
niuma agents get --id manager   # 角色详情
niuma config get                # 查看配置
```

## 环境变量

**`~/.niuma/.env`：**
```env
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
DEBUG=false
LOG_LEVEL=info
```

## 快速开始

```bash
git clone git@github.com:lihaizhong/niuma.git
cd niuma
pnpm install
cp niuma/niuma.json.example ~/.niuma/niuma.json
cp niuma/.env.example ~/.niuma/.env
pnpm build && pnpm start
```

## 相关资源

- [LangChain](https://js.langchain.com/)
- [SQLite Vec](https://github.com/asg017/sqlite-vec)
- [Zod](https://zod.dev/)
- [JSON5](https://json5.org/)

## 最近变更

### v0.1.0 (2026-03-10)

**新增：企业级多角色配置系统**
- JSON5 配置文件格式支持
- 多角色架构，支持独立 AI 角色
- 环境变量引用 `${VAR}` 和 `${VAR:default}`
- defaults-with-overrides 配置模式
- 角色完全隔离（工作区、会话、日志）
- 严格 Zod 配置验证
- 配置缓存机制

**新增文件：** json5-loader.ts、env-resolver.ts、merger.ts、manager.ts、配置示例  
**测试：** 74 个测试用例全部通过

---

> 本文件由 iFlow CLI 自动生成，用于为 AI 助手提供项目上下文。