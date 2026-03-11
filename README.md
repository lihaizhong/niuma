# Niuma（牛马）- 智能生活助手

> 打造属于你的企业级 AI 团队，每个角色独立工作，完全隔离

## 简介

Niuma 是一个智能生活助手 CLI 工具，支持多角色架构，可以创建多个独立的 AI 角色（如项目经理、开发工程师、测试工程师等），每个角色拥有自己的配置、工作区和数据，完全隔离，避免污染。

## 核心特性

### 🎭 多角色架构
- 支持定义多个独立的 AI 角色
- 每个角色有独立的配置和工作区
- 完全隔离：会话、记忆、日志互不干扰
- defaults-with-overrides 模式：全局默认配置 + 角色特定配置覆盖

### ⚙️ JSON5 配置
- 支持 JSON5 格式（注释、尾随逗号）
- 环境变量引用：`${VAR}` 和 `${VAR:default}` 语法
- 严格的 Zod 验证，拒绝未知字段
- 配置文件位置：`~/.niuma/niuma.json`

### 🔧 环境变量集成
- 从 `.env` 文件加载环境变量
- 支持环境变量引用和默认值
- 优先级：`.env` 文件 > 系统环境变量

### 🚀 快速开始

#### 安装

```bash
# 克隆项目
git clone git@github.com:lihaizhong/niuma.git
cd niuma

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 运行
pnpm start
```

#### 配置

1. 复制示例配置文件：

```bash
cp niuma/niuma.json.example ~/.niuma/niuma.json
cp niuma/.env.example ~/.niuma/.env
```

2. 编辑 `~/.niuma/.env`，填入你的 API 密钥：

```bash
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
```

3. 编辑 `~/.niuma/niuma.json`，配置你的角色：

```json5
{
  "agents": {
    "list": [
      {
        "id": "manager",
        "name": "项目经理",
        "default": true,
        "workspaceDir": "~/.niuma/agents/manager/workspace"
      },
      {
        "id": "developer",
        "name": "开发工程师",
        "workspaceDir": "~/.niuma/agents/developer/workspace"
      }
    ]
  }
}
```

#### 使用

```bash
# 使用默认角色
niuma chat

# 使用指定角色
niuma chat --agent developer

# 查看所有角色
niuma agents list

# 查看角色详情
niuma agents get --id manager
```

## 目录结构

```
~/.niuma/
├── niuma.json          # 全局配置
├── .env               # 环境变量
├── sessions/          # 会话存储
│   ├── manager/
│   ├── developer/
│   └── qa/
├── logs/              # 日志文件
│   ├── manager.log
│   ├── developer.log
│   └── qa.log
└── agents/            # 角色工作区
    ├── manager/
    │   └── workspace/
    ├── developer/
    │   └── workspace/
    └── qa/
        └── workspace/
```

## 技术栈

- **TypeScript 5.9+** - 主要开发语言
- **Node.js >=18.0.0** - 运行时环境
- **LangChain** - AI/LLM 应用框架
- **Zod** - 运行时类型验证
- **JSON5** - 配置文件格式
- **better-sqlite3** - 本地 SQLite 数据库
- **sqlite-vec** - 向量存储扩展

## 开发

```bash
# 开发模式
pnpm dev

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 类型检查
pnpm type-check

# 构建
pnpm build
```

## 许可证

Apache-2.0