# Niuma（牛马）- 项目上下文

## 项目概述

Niuma（牛马）是一个智能生活助手 CLI 工具，旨在提供陪伴感和情绪价值的智能精灵。项目使用 TypeScript + Node.js 开发，基于 LangChain 框架构建 AI 能力。

**当前状态：** 早期开发阶段，核心架构正在规划中。

## 技术栈

### 核心技术
- **TypeScript 5.9.3** - 主要开发语言
- **Node.js >=18.0.0** - 运行时环境
- **pnpm** - 包管理器

### 主要依赖
| 依赖 | 用途 |
|------|------|
| langchain | AI/LLM 应用框架 |
| better-sqlite3 | 本地 SQLite 数据库 |
| sqlite-vec | 向量存储扩展 |
| @clack/prompts | CLI 交互界面 |
| cac | 命令行参数解析 |
| chalk / ora / boxen | CLI 输出美化 |
| node-cron | 定时任务调度 |
| node-notifier | 系统通知 |
| dotenv | 环境变量管理 |
| date-fns / dayjs | 日期处理 |

### 开发依赖
- **tsx** - TypeScript 执行器
- **vitest** - 单元测试框架
- **eslint** - 代码规范检查

## 项目结构

```
niuma/
├── src/                # 源代码目录
│   └── app.ts          # 应用入口
├── niuma/              # 核心模块目录（待开发）
├── docs/               # 文档目录
├── public/             # 静态资源
├── openspec/           # OpenSpec 规范文件
│   ├── changes/        # 变更记录
│   ├── specs/          # 规格定义
│   └── config.yaml     # OpenSpec 配置
├── .iflow/             # iFlow CLI 配置
│   ├── commands/       # 自定义命令
│   └── skills/         # 技能定义
├── package.json        # 项目配置
├── tsconfig.json       # TypeScript 配置（构建用，rootDir: niuma/）
├── tsconfig.build.json # TypeScript 构建配置（rootDir: src/）
└── pnpm-workspace.yaml # pnpm 工作区配置
```

## 构建与运行

```bash
# 安装依赖
pnpm install

# 开发模式运行
pnpm dev

# 构建项目
pnpm build

# 生产模式运行
pnpm start

# 代码检查
pnpm lint

# 运行测试
pnpm test
```

## 架构设计（规划）

基于项目依赖和历史代码结构，Niuma 采用以下架构设计：

### 核心模块

- **Agent** - 智能体核心，处理对话循环、记忆管理、技能调用
- **Tools** - 工具集，包括文件系统操作、Shell 命令、Web 请求、MCP 协议等
- **Bus** - 事件总线，模块间通信
- **Channels** - 多渠道接入（钉钉、飞书、邮件等）
- **Providers** - LLM 提供商抽象层
- **Session** - 会话管理
- **Skills** - 可扩展技能系统
- **Cron** - 定时任务服务

### 数据存储

- 使用 SQLite 作为本地数据库
- sqlite-vec 支持向量检索，用于语义记忆

## 开发规范

### 代码风格
- 使用 ESLint 进行代码规范检查
- TypeScript 严格模式开启
- 使用 ES Module (`"type": "module"`)

### 提交规范
- 遵循 Conventional Commits 规范
- 提交信息格式：`type: description`

### 分支策略
- `main` - 主分支
- `feat/*` - 功能分支

## CLI 命令

```bash
# 全局安装后使用
niuma [command] [options]

# 或通过 npx
npx niuma [command] [options]
```

## 环境变量

创建 `.env` 文件配置以下变量：

```env
# LLM 配置（示例）
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.openai.com/v1

# 其他配置
NODE_ENV=development
```

## 相关资源

- [LangChain 文档](https://js.langchain.com/)
- [SQLite Vec](https://github.com/asg017/sqlite-vec)
- [Clack Prompts](https://github.com/natemoo-re/clack)

---

> 本文件由 iFlow CLI 自动生成，用于为 AI 助手提供项目上下文。
