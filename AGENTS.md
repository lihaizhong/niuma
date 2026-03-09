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
- **注释必须使用中文**，代码标识符使用英文
- JSDoc 注释应包含 `@description`、`@param`、`@returns` 等标签，描述内容使用中文

### 提交规范
- 遵循 Conventional Commits 规范
- 提交信息格式：`type: description`

### 分支策略
- `main` - 主分支
- `feat/*` - 功能分支

### 工作流约束（强制）

**重要：以下约束为强制执行，不可跳过！**

1. **必须触发 fullstack-workflow skill**
   - **无论通过任何方式**（如：`/opsx:apply`、手动开发任务等）开始实现代码时，**必须先调用** `Skill` 工具触发 `fullstack-workflow` skill
   - 示例：`Skill(skill: "fullstack-workflow")`
   - fullstack-workflow skill 会协调多个专业 subagent 协作完成任务
   - **每个角色优先使用对应的 subagent 处理**：
     | 角色/任务类型 | 优先使用的 subagent |
     |--------------|-------------------|
     | 规划分析 | `plan-agent` |
     | 代码探索 | `explore-agent` |
     | 代码审查 | `code-reviewer` |
     | 前端测试 | `frontend-tester` |
     | 深度研究 | `search-specialist` |
     | 复杂多步骤任务 | `general-purpose` |
     | 翻译任务 | `translate` |
     | 教程生成 | `tutorial-engineer` |

2. **必须使用 OpenSpec CLI 命令**
   - **禁止手动创建 openspec 文件**，必须通过 CLI 命令生成
   - 使用 `openspec` CLI 命令管理变更生命周期
   - 关键命令：
     ```bash
     # 创建新变更
     openspec new change "<change-name>"
     
     # 查看变更状态
     openspec status --change "<change-name>" --json
     
     # 获取 artifact 构建指令
     openspec instructions <artifact-id> --change "<change-name>" --json
     
     # 应用变更（实施）
     openspec apply --change "<change-name>"
     
     # 归档变更
     openspec archive --change "<change-name>"
     ```

3. **使用斜杠命令触发 Skill**
   - `/opsx:explore` - 探索模式和需求澄清
   - `/opsx:propose` - 创建变更提案（包含 proposal、design、specs、tasks）
   - `/opsx:apply` - 实施变更任务
   - `/opsx:archive` - 归档变更

**正确的工作流顺序：**
```
1. /opsx:explore (可选，复杂任务建议使用)
   ↓
2. /opsx:propose (创建提案，自动生成所有 artifacts)
   ↓
3. /opsx:apply (实施变更)
   ↓
4. /opsx:archive (归档)
```

**注意：**
- 所有 artifacts 文件必须通过 `openspec` CLI 命令生成
- 只有 `openspec status` 显示 `applyReady: true` 时才能执行 `/opsx:apply`
- 文件路径必须使用 `openspec instructions` 返回的 `outputPath`

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
