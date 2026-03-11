# Niuma（牛马）- 智能生活助手

> 🐄 打造属于你的企业级 AI 团队，每个角色独立工作，完全隔离

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.0.0-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Apache--2.0-yellow.svg)](LICENSE)

## ✨ 简介

[Niuma（牛马）](https://github.com/lihaizhong/niuma) 是一个企业级多角色 AI 助手 CLI 工具，基于 TypeScript + Node.js 构建，借鉴 [nanobot](https://github.com/HKUDS/nanobot) 设计理念。

**核心价值：**
- 🎭 **多角色架构** - 为团队中的不同角色（项目经理、开发工程师、测试工程师等）创建专属的 AI 助手
- 🔒 **完全隔离** - 每个角色拥有独立的配置、工作区、会话、记忆和日志，互不干扰
- ⚙️ **灵活配置** - 支持 JSON5 格式，可使用注释和环境变量引用
- 🧠 **智能记忆** - 双层记忆系统（MEMORY.md + HISTORY.md），自动整合长期记忆
- 🎯 **可扩展** - 支持自定义技能和工具，轻松扩展功能

## 🚀 快速开始

### 安装

```bash
# 克隆项目
git clone git@github.com:lihaizhong/niuma.git
cd niuma

# 安装依赖
pnpm install

# 构建项目
pnpm build
```

### 配置

#### 1. 创建配置目录

```bash
# 创建配置目录
mkdir -p ~/.niuma
```

#### 2. 复制示例配置文件

```bash
# 复制配置文件
cp niuma/niuma.json.example ~/.niuma/niuma.json
cp niuma/.env.example ~/.niuma/.env
```

#### 3. 编辑环境变量

编辑 `~/.niuma/.env`，填入你的 API 密钥：

```bash
# OpenAI 配置
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1

# Anthropic 配置（可选）
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# 其他配置
DEBUG=false
LOG_LEVEL=info
```

#### 4. 配置角色

编辑 `~/.niuma/niuma.json`，配置你的角色：

```json5
{
  // 全局默认配置
  "maxIterations": 40,
  "workspaceDir": ".niuma",
  
  // LLM 提供商配置
  "providers": {
    "openai": {
      "type": "openai",
      "model": "gpt-4o",
      "apiKey": "${OPENAI_API_KEY}",
      "apiBase": "${OPENAI_BASE_URL:https://api.openai.com/v1}"
    }
  },
  
  // 多角色配置
  "agents": {
    "defaults": {
      "progressMode": "normal",
      "showReasoning": false
    },
    "list": [
      {
        "id": "manager",
        "name": "项目经理",
        "description": "负责项目规划和进度管理",
        "default": true,
        "workspaceDir": "~/.niuma/agents/manager/workspace",
        "agent": {
          "progressMode": "verbose",
          "showReasoning": true
        }
      },
      {
        "id": "developer",
        "name": "开发工程师",
        "description": "负责代码开发和问题解决",
        "workspaceDir": "~/.niuma/agents/developer/workspace"
      },
      {
        "id": "tester",
        "name": "测试工程师",
        "description": "负责测试和质量保证",
        "workspaceDir": "~/.niuma/agents/tester/workspace"
      }
    ]
  }
}
```

### 运行

```bash
# 使用默认角色（项目经理）
niuma chat

# 使用指定角色
niuma chat --agent developer

# 列出所有角色
niuma agents list

# 查看角色详情
niuma agents get --id manager
```

## 💡 功能特性

### 🎭 多角色架构

为团队中的不同角色创建专属的 AI 助手：

```bash
# 项目经理 - 负责项目规划和进度管理
niuma chat --agent manager

# 开发工程师 - 负责代码开发和问题解决
niuma chat --agent developer

# 测试工程师 - 负责测试和质量保证
niuma chat --agent tester
```

每个角色拥有：
- ✅ 独立的配置和工作区
- ✅ 独立的会话历史
- ✅ 独立的长期记忆（MEMORY.md）
- ✅ 独立的日志文件

### ⚙️ JSON5 配置

支持 JSON5 格式，可使用注释和环境变量引用：

```json5
{
  // 这是一个注释
  "apiKey": "${OPENAI_API_KEY}",  // 环境变量引用
  "apiBase": "${OPENAI_BASE_URL:https://api.openai.com/v1}",  // 带默认值
  "features": [  // 尾随逗号
    "chat",
    "code",
  ]
}
```

### 🔧 环境变量集成

支持 `${VAR}` 和 `${VAR:default}` 语法：

```json5
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "apiBase": "${OPENAI_BASE_URL:https://api.openai.com/v1}",
      "model": "${MODEL:gpt-4o}"
    }
  }
}
```

配置优先级：
1. 命令行参数
2. 角色特定配置覆盖
3. 全局 `~/.niuma/niuma.json`
4. `.env` 文件中的环境变量
5. 默认值

### 🧠 智能记忆系统

双层记忆系统，自动整合长期记忆：

- **MEMORY.md** - 长期记忆，自动整合和存储重要信息
- **HISTORY.md** - 历史日志，可搜索的对话历史

记忆整合会自动触发，当消息数量超过阈值时，LLM 会整合重要信息到长期记忆中。

### 🎯 可扩展技能系统

支持自定义技能，通过 SKILL.md 定义：

```bash
~/.niuma/agents/developer/workspace/
├── skills/
│   ├── github/
│   │   └── SKILL.md
│   ├── weather/
│   │   └── SKILL.md
│   └── ...
```

## 📁 目录结构

```
~/.niuma/                      # 配置根目录
├── niuma.json                 # 全局配置文件
├── .env                       # 环境变量
├── sessions/                  # 会话存储
│   ├── manager/              #   项目经理会话
│   ├── developer/            #   开发工程师会话
│   └── tester/               #   测试工程师会话
├── logs/                      # 日志文件
│   ├── manager.log
│   ├── developer.log
│   └── tester.log
└── agents/                    # 角色工作区
    ├── manager/              #   项目经理工作区
    │   ├── workspace/       #     工作目录
    │   │   ├── memory/     #       记忆存储
    │   │   │   ├── MEMORY.md
    │   │   │   └── HISTORY.md
    │   │   └── skills/     #       自定义技能
    │   └── skills/         #     技能定义
    ├── developer/            #   开发工程师工作区
    │   ├── workspace/
    │   │   ├── memory/
    │   │   └── skills/
    │   └── skills/
    └── tester/               #   测试工程师工作区
        ├── workspace/
        │   ├── memory/
        │   └── skills/
        └── skills/
```

## 🔨 开发

### 开发环境设置

```bash
# 安装依赖
pnpm install

# 开发模式运行
pnpm dev

# 构建项目
pnpm build

# 运行生产版本
pnpm start
```

### 测试

```bash
# 运行所有测试
pnpm test

# 运行测试 UI
pnpm test:ui

# 测试覆盖率
pnpm test:coverage
```

### 代码质量

```bash
# 代码检查
pnpm lint

# 自动修复
pnpm lint:fix

# 类型检查
pnpm type-check
```

## 🏗️ 技术架构

### 核心模块

```mermaid
graph TB
    User[用户] --> CLI[CLI 接口]
    CLI --> Config[配置管理器]
    Config --> Agent[Agent 核心]
    Agent --> Context[上下文构建器]
    Agent --> Memory[记忆系统]
    Agent --> Skills[技能系统]
    Agent --> Provider[LLM 提供商]
    Agent --> Tools[工具集]
    Agent --> Session[会话管理]
    Agent --> Bus[事件总线]
    
    Provider --> OpenAI[OpenAI]
    Provider --> Anthropic[Anthropic]
    Provider --> Custom[自定义端点]
    
    Tools --> File[文件操作]
    Tools --> Shell[Shell 命令]
    Tools --> Web[Web 请求]
    Tools --> MCP[MCP 协议]
```

### Agent 循环流程

```mermaid
flowchart TD
    A[接收消息] --> B[构建上下文<br/>history + memory + skills]
    B --> C[LLM 调用]
    C --> D{有工具调用？}
    D -->|Yes| E[执行工具]
    D -->|No| F[返回响应]
    E --> G{迭代次数 < max？}
    G -->|Yes| C
    G -->|No| F
    F --> H[更新记忆]
    H --> I[返回结果]
```

## 📊 项目状态

### ✅ 已完成功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 核心基础设施 | ✅ 完成 | 类型系统、配置管理、工具框架、事件总线 |
| Agent 核心 | ✅ 完成 | 上下文构建、记忆系统、技能系统、Agent 循环 |
| 多角色配置系统 | ✅ 完成 | JSON5 配置、环境变量引用、角色隔离 |
| OpenAI 提供商 | ✅ 完成 | GPT 系列模型支持 |
| 会话管理 | ✅ 完成 | 会话状态、历史记录、持久化 |

### 🔄 待开发功能

- **内置工具**（read_file, write_file, edit_file, exec, web_search 等）
- **LLM 提供商扩展**（Anthropic, OpenRouter, DeepSeek 等）
- **多渠道接入**（Telegram, Discord, 飞书, 钉钉等）
- **定时任务与心跳**
- **MCP 协议支持**

详细开发计划请参考：[项目开发计划](docs/niuma-development-plan.md)

## 🛠️ 技术栈

| 技术 | 用途 | 版本 |
|------|------|------|
| TypeScript | 主要开发语言 | 5.9.3 |
| Node.js | 运行时环境 | >=22.0.0 |
| LangChain | AI/LLM 应用框架 | ^1.2.30 |
| Zod | 运行时类型验证 | ^4.3.6 |
| JSON5 | 配置文件格式 | ^2.2.3 |
| better-sqlite3 | 本地 SQLite 数据库 | ^12.6.2 |
| sqlite-vec | 向量存储扩展 | 0.1.7-alpha.10 |
| pino | 日志记录 | ^10.3.1 |
| vitest | 单元测试框架 | ^4.0.18 |

## 📖 示例

### 示例 1：创建项目经理角色

```bash
# 编辑 ~/.niuma/niuma.json
{
  "agents": {
    "list": [
      {
        "id": "manager",
        "name": "项目经理",
        "description": "负责项目规划和进度管理",
        "default": true,
        "agent": {
          "progressMode": "verbose",
          "showReasoning": true
        }
      }
    ]
  }
}

# 启动对话
niuma chat --agent manager
```

### 示例 2：使用环境变量

```bash
# 编辑 ~/.niuma/.env
OPENAI_API_KEY=sk-xxx
MODEL=gpt-4o

# 编辑 ~/.niuma/niuma.json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "model": "${MODEL:gpt-4o}"
    }
  }
}
```

### 示例 3：角色配置覆盖

```json5
{
  // 全局默认配置
  "agent": {
    "progressMode": "normal",
    "showReasoning": false
  },
  
  "agents": {
    "list": [
      {
        "id": "manager",
        // 覆盖全局配置
        "agent": {
          "progressMode": "verbose",  // 覆盖为 verbose
          "showReasoning": true      // 覆盖为 true
        }
      }
    ]
  }
}
```

## ❓ 常见问题

### Q: 如何切换角色？

```bash
# 列出所有角色
niuma agents list

# 使用指定角色
niuma chat --agent <角色ID>
```

### Q: 角色数据存储在哪里？

每个角色的数据存储在独立的工作区：

```
~/.niuma/agents/<角色ID>/
├── workspace/
│   ├── memory/
│   │   ├── MEMORY.md
│   │   └── HISTORY.md
│   └── skills/
└── skills/
```

### Q: 如何配置不同的 LLM 提供商？

在 `~/.niuma/niuma.json` 中配置：

```json5
{
  "providers": {
    "openai": {
      "type": "openai",
      "model": "gpt-4o",
      "apiKey": "${OPENAI_API_KEY}"
    },
    "anthropic": {
      "type": "anthropic",
      "model": "claude-3-opus-20240229",
      "apiKey": "${ANTHROPIC_API_KEY}"
    }
  }
}
```

### Q: 如何自定义技能？

在角色工作区创建 `SKILL.md` 文件：

```bash
mkdir -p ~/.niuma/agents/developer/skills/my-skill
cat > ~/.niuma/agents/developer/skills/my-skill/SKILL.md << 'EOF'
# My Custom Skill

## 功能描述
这是一个自定义技能示例。

## 使用场景
当需要执行特定任务时使用。

## 示例
用户：帮我执行自定义任务
AI：[使用自定义技能完成任务]
EOF
```

## 🤝 贡献

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feat/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feat/amazing-feature`)
5. 提交 Pull Request

### 开发规范

- 遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范
- 提交信息格式：`type: description`
- 使用 ESLint 进行代码检查
- 添加适当的测试用例

## 📄 许可证

[Apache-2.0](LICENSE)

## 🔗 相关资源

- [项目开发计划](docs/niuma-development-plan.md)
- [项目上下文](AGENTS.md)
- [LangChain.js 文档](https://js.langchain.com/)
- [Zod 文档](https://zod.dev/)
- [nanobot 参考](https://github.com/HKUDS/nanobot)
- [OpenSpec 规范](https://github.com/openspec-io)

## ⭐ Star History

如果这个项目对你有帮助，请给个 Star 支持！

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/lihaizhong">lihaizhong</a></sub>
</div>