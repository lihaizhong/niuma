# Install Guide: 个人 Harness 环境搭建

> AI 助手通过与用户对话，引导完成 OpenSpec Harness 环境搭建

## 概述

本指南用于 AI 引导用户从零搭建个人 Harness 环境。AI 应阅读 `docs/openspec/` 下的文档来理解 Harness 的设计理念和配置方式，然后通过与用户对话，逐步完成环境搭建。

**核心原则：**

- AI 是引导者，用户是决策者
- 每一步都询问用户偏好，而不是强行指定
- 参考 `docs/openspec/` 中的文档来解答用户疑问

---

## 阶段 1：确认项目状态

### 1.1 检查现有项目

首先询问用户是否已有项目：

```
你好！我可以帮你搭建 OpenSpec Harness 环境。

请告诉我你的情况：
A) 从零创建新项目
B) 已有项目，想引入 Harness

如果选 B，请告诉我项目的基本情况：
- 使用什么框架？（Next.js / Node.js / 其他）
- 使用什么包管理器？（pnpm / npm / yarn）
- 主要编程语言？（TypeScript / JavaScript）
```

### 1.2 从零创建项目

如果用户选择 A，继续询问：

```
好的，从零开始！请告诉我：

1. 项目名称是什么？
2. 使用什么框架？
   - Next.js 15 (React 19 + Tailwind CSS)
   - 纯 Node.js (TypeScript)
   - 其他（请说明）

3. 使用什么包管理器？（pnpm / npm / yarn）
4. 是否需要 Next.js Web UI？（是 / 否）
```

---

## 阶段 2：创建核心文件

### 2.1 必要文件清单

根据 `docs/openspec/02-config-system.md` 和 `openspec/config.yaml`，核心文件包括：

| 文件路径                  | 用途            | 必须创建 |
| ------------------------- | --------------- | -------- |
| `openspec/config.yaml`    | 项目配置        | ✓        |
| `AGENTS.md`               | AI 行为指南     | ✓        |
| `.opencode/`              | AI 助手配置目录 | ✓        |
| `.opencode/commands/`     | 斜杠命令        | ✓        |
| `.opencode/skills/`       | 技能定义        | 可选     |
| `.opencode/opencode.json` | OpenCode 配置   | 可选     |

### 2.2 创建 openspec/config.yaml

根据用户选择的技术栈生成配置文件：

```yaml
schema: spec-driven

context:
  project:
    name: <项目名称>
    description: <项目描述>
    language: TypeScript
    runtime: Node.js >=22.0.0
    package_manager: pnpm

  tech_stack:
    language: TypeScript 5.9+
    test_framework: vitest
    web_framework: Next.js 15
    ui: React 19 + Tailwind CSS
    runtime: Node.js >=22.0.0

  modules:
    niuma-engine:
      purpose: Agent core implementation
      scope: Agent base classes, tools, memory, types
    src:
      purpose: Next.js web service
      scope: Web UI, API routes, components

  conventions:
    - ES Module syntax
    - Strict TypeScript
    - Async/await
    - Identifiers in English
    - Comments can be Chinese

  commands:
    install: pnpm install
    dev: pnpm dev
    build: pnpm build
    test: pnpm test
    test_unit: pnpm test:unit
    lint: pnpm lint
    type_check: pnpm type-check
```

### 2.3 创建 AGENTS.md

根据 `docs/openspec/01-overview.md` 创建 AI 行为指南：

```markdown
# AI Agent Guidelines

## Context

<项目名称> - <项目描述>

## Roles

### SpecWriter

创建 OpenSpec artifacts。

### Developer

按照 specs 实现代码。

### Tester

先写测试，再实现。

## Workflow

1. **探索** (`/opsx-explore`) - 自由讨论，澄清需求
2. **提案** (`/opsx-propose`) - 创建完整设计方案
3. **实施** (`/opsx-apply`) - TDD 循环实现
4. **归档** - 完成后归档变更

## TDD Cycle

Red → Green → Refactor

## Commands

| Phase | Command              |
| ----- | -------------------- |
| 探索  | /opsx-explore        |
| 提案  | /opsx-propose <name> |
| 实施  | /opsx-apply          |
```

---

## 阶段 3：配置 AI 助手

### 3.1 询问使用的开发工具

```
你使用什么 AI 代码助手？

A) OpenCode (本项目使用)
B) Cursor
C) Claude (Claude.ai / Claude Desktop)
D) VS Code + Copilot
E) 其他
```

根据用户选择，提供对应的配置方式。

### 3.2 OpenCode 配置

如果是 OpenCode，配置 `.opencode/opencode.json`：

```json
{
  "skills": ["openspec-propose", "openspec-apply", "openspec-explore"],
  "commands": {
    "opsx-propose": "创建新功能提案",
    "opsx-apply": "开始实施当前提案",
    "opsx-explore": "探索需求和技术方案"
  }
}
```

### 3.3 创建斜杠命令

在 `.opencode/commands/` 下创建命令文件：

| 命令文件          | 对应操作 | 参考文档                            |
| ----------------- | -------- | ----------------------------------- |
| `opsx-propose.md` | 创建提案 | `docs/openspec/03-workflows.md`     |
| `opsx-apply.md`   | 开始实施 | `docs/openspec/03-workflows.md`     |
| `opsx-explore.md` | 自由探索 | `docs/openspec/spike-vs-explore.md` |

### 3.4 其他工具的配置提示

**Cursor (Cursor Rules):**

```
在 Cursor 项目设置中添加 .cursorrules 文件，引用 AGENTS.md
```

**Claude (claude.ai):**

```
将 AGENTS.md 内容作为 Project Instructions 或上传为附件
```

**VS Code + Copilot:**

```
将 AGENTS.md 内容添加到 GitHub Copilot Custom Instructions
```

---

## 阶段 4：配置开发和测试环境

### 4.1 询问环境需求

```
你想配置哪些环境？（可多选）

A) 开发环境 (pnpm dev)
B) 测试环境 (pnpm test:unit)
C) CI/CD (GitHub Actions / GitLab CI)
D) 全部配置
```

### 4.2 开发环境配置

如果选择 A 或 D：

```yaml
# .vscode/launch.json (VS Code 调试)
{
  "version": "0.2.0",
  "configurations":
    [
      {
        "name": "Debug Main",
        "type": "node",
        "request": "launch",
        "cwd": "${workspaceFolder}",
        "runtimeExecutable": "pnpm",
        "runtimeArgs": ["dev"],
      },
    ],
}
```

### 4.3 CI/CD 配置

**GitHub Actions** (`.github/workflows/ci.yml`):

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test:unit
```

**GitLab CI** (`.gitlab-ci.yml`):

```yaml
stages:
  - test

test:
  stage: test
  image: node:22-alpine
  before_script:
    - npm install -g pnpm
    - pnpm install
  script:
    - pnpm lint
    - pnpm type-check
    - pnpm test:unit
```

---

## 阶段 5：验证环境

### 5.1 创建第一个变更

引导用户创建第一个变更来验证环境：

```
环境配置完成！现在让我们创建一个示例变更来验证：

请选择一个场景：

A) 添加欢迎消息功能
B) 添加深色模式
C) 其他功能（请描述）

我推荐选择 A"欢迎消息"，这是一个简单的示例，可以快速验证整个流程。
```

### 5.2 验证检查清单

按照 `docs/openspec/00-quick-start.md` 验证：

- [ ] `pnpm install` 成功
- [ ] `pnpm test:unit` 成功
- [ ] `pnpm lint` 成功
- [ ] `pnpm type-check` 成功
- [ ] `/opsx-propose` 命令可用（如果使用 OpenCode）

### 5.3 常见问题处理

**问题：pnpm install 失败**

```
可能原因：
1. Node.js 版本不对 - 需要 >=22.0.0
2. pnpm 版本不对 - 需要 >=8.0.0

解决方案：
node --version  # 确认 Node.js 版本
pnpm --version  # 确认 pnpm 版本
```

**问题：测试失败**

```
可能原因：
1. 依赖未正确安装
2. 测试文件路径问题

解决方案：
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm test:unit
```

**问题：命令找不到**

```
确保 .opencode/commands/ 目录存在且包含对应命令文件
检查 .opencode/opencode.json 配置是否正确
```

---

## AI 交互示例

### 对话示例 1：完全从零开始

```
用户: 我想搭建 Harness 环境

AI: 你好！我可以帮你搭建 OpenSpec Harness 环境。

    请告诉我你的情况：
    A) 从零创建新项目
    B) 已有项目，想引入 Harness

用户: A

AI: 好的，从零开始！

    1. 项目名称是什么？
    2. 使用什么框架？（Next.js / 纯 Node.js / 其他）

用户: 项目叫 my-project，用 Next.js

AI: 好的，正在为你创建 my-project 的 Harness 配置...

    ✓ 创建 openspec/config.yaml
    ✓ 创建 AGENTS.md
    ✓ 创建 .opencode/commands/
    ✓ 创建 .github/workflows/ci.yml

    你使用什么 AI 代码助手？
    A) OpenCode
    B) Cursor
    C) Claude
    D) VS Code + Copilot

用户: A

AI: 正在配置 OpenCode...

    ✓ 创建 .opencode/opencode.json
    ✓ 创建 .opencode/commands/opsx-propose.md
    ✓ 创建 .opencode/commands/opsx-apply.md
    ✓ 创建 .opencode/commands/opsx-explore.md

    现在验证环境：

    请运行 pnpm install 和 pnpm test:unit 确认环境正常。

用户: pnpm install 成功了，但 pnpm test:unit 失败

AI: 让我看看测试失败的原因...

    运行 pnpm test:unit --reporter=verbose 看看具体错误。

    ...

    看起来是 vitest 配置问题。让我帮你修复...

用户: 好的

AI: 已修复！再试一次 pnpm test:unit
```

### 对话示例 2：已有项目引入 Harness

```
用户: 我有个现有项目想引入 Harness

AI: 好的！请告诉我：

    1. 项目使用什么框架？（Next.js / 纯 Node.js / 其他）
    2. 使用什么包管理器？（pnpm / npm / yarn）
    3. 主要使用 TypeScript 还是 JavaScript？

用户: Next.js + pnpm + TypeScript

AI: 好的，正在分析你的项目结构...

    ✓ 检测到 Next.js 15 + TypeScript
    ✓ 检测到使用 pnpm

    接下来我会创建 Harness 配置文件。这些会添加到你的项目中，不会影响现有代码。

    开始创建...

用户: 好

AI: ✓ 创建 openspec/config.yaml
    ✓ 创建 AGENTS.md
    ✓ 创建 .opencode/commands/
    ✓ 创建 .github/workflows/ci.yml

    现在你需要：
    1. 阅读 docs/openspec/00-quick-start.md 了解 Harness
    2. 尝试创建一个提案：/opsx-propose my-first-feature
```

---

## 参考文档

AI 在引导过程中应参考以下文档：

| 文档                                | 用途             |
| ----------------------------------- | ---------------- |
| `docs/openspec/00-quick-start.md`   | 快速开始指南     |
| `docs/openspec/01-overview.md`      | 系统概览         |
| `docs/openspec/02-config-system.md` | 配置体系详解     |
| `docs/openspec/03-workflows.md`     | 工作流详解       |
| `docs/openspec/04-commands.md`      | 命令参考         |
| `docs/openspec/spike-vs-explore.md` | Spike vs Explore |

---

## 附录：完整文件结构

```
<项目根目录>/
├── openspec/
│   ├── config.yaml          # 项目配置 (必须)
│   ├── schemas/             # 工作流定义
│   │   ├── spec-driven.yaml
│   │   └── bugfix.yaml
│   └── changes/             # 变更目录
│
├── .opencode/               # AI 助手配置 (必须)
│   ├── commands/            # 斜杠命令 (必须)
│   │   ├── opsx-propose.md
│   │   ├── opsx-apply.md
│   │   └── opsx-explore.md
│   ├── skills/              # 技能定义 (可选)
│   └── opencode.json        # OpenCode 配置 (可选)
│
├── .github/
│   └── workflows/
│       └── ci.yml           # GitHub CI (可选)
│
├── .gitlab-ci.yml           # GitLab CI (可选)
│
├── AGENTS.md                # AI 行为指南 (必须)
│
└── docs/
    └── openspec/             # Harness 文档
        ├── 00-quick-start.md
        ├── 01-overview.md
        └── ...
```
