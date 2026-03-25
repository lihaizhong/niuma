# Niuma（牛马）- AI 助手行为指南

**Generated:** 2026-03-24T08:02:05Z  
**Commit:** e8ed60c  
**Branch:** refactor-of-deepagent

## OVERVIEW

Niuma（牛马）- 企业级多角色 AI 助手 CLI 工具，TypeScript + Node.js 构建。支持创建多个完全独立的 AI 角色，每个角色拥有独立的配置、工作区、会话和记忆。

**Inspiration:** [nanobot](https://github.com/HKUDS/nanobot)  
**Tech Stack:** TypeScript 5.9+, Node.js >=22, LangChain, Zod, Vitest

## STRUCTURE

```
.
├── niuma/                    # 主源代码（~88k LOC）
│   ├── agent/               #   Agent 核心模块（loop, context, memory, skills, tools, subagent）
│   ├── bus/                 #   事件总线
│   ├── channels/            #   多渠道集成（CLI, Discord, 飞书, Email, QQ）
│   ├── cli/                 #   CLI 入口
│   ├── config/              #   配置管理
│   ├── heartbeat/           #   心跳服务
│   ├── providers/           #   LLM 提供商抽象
│   ├── session/             #   会话管理
│   ├── types/               #   类型定义
│   └── utils/               #   工具函数
├── openspec/                # OpenSpec 规格驱动开发
├── docs/                    # 文档
├── dist/                    # 构建输出
├── __tests__/              # 测试（Vitest）
└── AGENTS.md               # 本项目上下文
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Agent Loop | `niuma/agent/loop.ts` | LLM ↔ Tool 循环 |
| Context | `niuma/agent/context.ts` | 上下文构建器 |
| Memory | `niuma/agent/memory.ts` | 双层记忆系统 |
| Tools | `niuma/agent/tools/*.ts` | 30+ 内置工具 |
| Subagent | `niuma/agent/subagent/` | 子 Agent 管理 |
| Channels | `niuma/channels/` | 多渠道接入 |
| Providers | `niuma/providers/` | OpenAI, Anthropic, DeepSeek 等 |
| Config | `niuma/config/` | JSON5 + 环境变量 |
| Skills | `niuma/agent/skills.ts` | 动态 SKILL.md 加载 |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| AgentLoop | class | `agent/loop.ts` | 核心循环 |
| ContextBuilder | class | `agent/context.ts` | 上下文构建 |
| MemoryManager | class | `agent/memory.ts` | 记忆管理 |
| ToolRegistry | class | `agent/tools/*.ts` | 工具注册表 |
| SubagentManager | class | `agent/subagent/` | 子 Agent |
| ChannelRegistry | class | `channels/registry.ts` | 渠道注册 |
| ConfigManager | class | `config/` | 配置管理 |

## CONVENTIONS

### Code Style
- **ES Modules** only (`"type": "module"`)
- **TypeScript** strict mode, ES2022
- **Comments:** Chinese | **Identifiers:** English
- **Async/await** over Promise chains
- Prefer **composition** over inheritance

### Tool Pattern (from nanobot)
- Abstract `BaseTool` class
- `ToolRegistry` for registration
- Two-step: spec registration → config field

### Configuration
- **JSON5** format with `${VAR}` interpolation
- Support `${VAR:default}` syntax
- Priority: CLI > agent > global > env > default

### Commit Style
```
feat: new feature
fix: bug fix
refactor: restructuring
docs: documentation
test: tests
chore: maintenance
```

## ANTI-PATTERNS

| Pattern | Status | Rule |
|---------|--------|------|
| 手动操作 openspec/ 目录 | 🚫 FORBIDDEN | 必须使用 `openspec` CLI 命令 |
| 修改 .iflow/ 目录 | 🚫 FORBIDDEN | 除非用户明确要求 |
| 跳过 Red 阶段（新功能） | 🚫 FORBIDDEN | TDD 强制要求 |
| 单文件/简单任务使用 fullstack skill | ⚠️ WARNING | 适合 <50 行的直接修复 |
| 遗漏子 Agent 检查 | ⚠️ WARNING | 必须检查 Subagent 优先级表 |

## UNIQUE STYLES

### OpenSpec Workflow
- `/opsx:explore` → `/opsx:propose` → `/opsx:apply` → `/opsx:archive`
- 禁止手动 mv/cp openspec 文件

### Multi-role Isolation
每个 Agent 完全隔离：`~/.niuma/agents/<id>/`
- workspace/memory/ - MEMORY.md + HISTORY.md
- skills/ - 自定义 SKILL.md

### Skill System
动态加载：`SKILL.md` 定义功能、场景、示例
位置：`~/.niuma/agents/<id>/skills/<name>/SKILL.md`

### TDD Roles
- **spec-writer** - 编写测试规格（Red 阶段）
- **tester** - 实现测试用例（Red 阶段）
- **developer** - 实现代码（Green 阶段）
- **code-reviewer** - 代码审查（Refactor 阶段）

## COMMANDS

```bash
# Development
pnpm dev                # tsx 运行
pnpm build              # tsc + esbuild bundle
pnpm start              # 运行生产版本

# Quality
pnpm test               # vitest
pnpm lint               # eslint
pnpm type-check         # tsc --noEmit

# OpenSpec
openspec list           # 查看变更
openspec status <name>  # 查看状态
openspec apply <name>   # 实施变更
openspec archive <name> # 归档变更
```

## NOTES

- **语言要求:** openspec/specs 中 Requirements 必须用 "SHALL"/"MUST" 关键词（英文）
- **图表要求:** 必须使用 mermaid 语法
- **经验管理:** 使用 `OPENEXP=$(find . -name "openexp.sh" -path "*/skills/openexp/*" | head -1)` 查找 CLI

## SUBDIRECTORY KNOWLEDGE BASES

- [agent/](niuma/agent/AGENTS.md) - Agent 核心模块
- [channels/](niuma/channels/AGENTS.md) - 多渠道集成

---

> 完整技术规范详见 `openspec/config.yaml`
