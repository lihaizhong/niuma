# 05 - 目录结构

> 理解 OpenSpec Harness 项目的文件组织方式

## 顶层目录

```
project-root/
├── openspec/                   # OpenSpec 配置和变更
├── .opencode/                  # AI 助手配置
├── docs/                       # 文档
├── src/                        # 源代码
├── AGENTS.md                   # AI 行为指南
└── README.md                   # 项目说明
```

## openspec/ 目录

存放所有 OpenSpec 相关配置和变更。

```
openspec/
├── config.yaml                 # 项目基础配置
├── SCHEMA-USAGE-GUIDE.md       # Schema 使用指南
├── schemas/                    # 工作流定义
│   ├── spec-driven/            # 新功能开发
│   │   ├── schema.yaml         # 工作流配置
│   │   └── templates/           # 产物模板
│   ├── bugfix/                 # Bug 修复
│   │   ├── schema.yaml
│   │   └── templates/
│   └── spike/                  # 技术调研（可选）
│       ├── schema.yaml
│       └── templates/
├── changes/                    # Spec-Driven 变更
│   ├── <change-name>/          # 单个变更
│   │   ├── .openspec.yaml      # 变更配置
│   │   ├── proposal.md         # 提案
│   │   ├── design.md           # 设计
│   │   ├── specs/              # 规格
│   │   │   └── <capability>/
│   │   │       └── spec.md
│   │   └── tasks.md            # 任务
│   └── archive/                # 归档变更
│       └── <change-name>/
└── bugs/                       # Bugfix 变更
    ├── <bug-id>/               # 单个 Bug
    │   ├── .openspec.yaml      # Bug 配置
    │   ├── bug-report.md       # 问题描述
    │   └── fix.md              # 修复方案
    └── archive/                # 归档 Bug
        └── <bug-id>/
```

### config.yaml

项目基础配置，包含技术栈、模块、命令等。

```yaml
schema: spec-driven

context:
  project:
    name: Niuma
    description: Multi-agent AI assistant system
    language: TypeScript
    runtime: Node.js >=22.0.0

  tech_stack:
    language: TypeScript 5.9+
    test_framework: vitest
    web_framework: Next.js 15

  modules:
    niuma-engine:
      purpose: Agent core implementation
      tests: src/niuma-engine/tests/
    src:
      purpose: Next.js web service
      tests: src/tests/

  commands:
    install: pnpm install
    dev: pnpm dev
    test: pnpm test
    lint: pnpm lint
```

### schemas/

定义工作流的详细规则。每个 schema 是一个目录，包含配置文件和模板。

#### 目录结构

```
schemas/
├── spec-driven/              # 新功能开发工作流
│   ├── schema.yaml           # 工作流配置
│   └── templates/            # 产物模板
│       ├── proposal.md.tpl
│       ├── design.md.tpl
│       ├── spec.md.tpl
│       └── tasks.md.tpl
├── bugfix/                   # Bug 修复工作流
│   ├── schema.yaml
│   └── templates/
│       ├── bug-report.md.tpl
│       └── fix.md.tpl
└── spike/                    # 技术调研工作流
    ├── schema.yaml
    └── templates/
        ├── research-question.md.tpl
        ├── exploration-log.md.tpl
        └── decision.md.tpl
```

#### spec-driven/schema.yaml

```yaml
schema:
  name: spec-driven
  version: "1.0"

artifacts:
  - id: proposal
    generates: proposal.md
    template: templates/proposal.md.tpl
    required_sections: [Non-goals, Acceptance Criteria]

  - id: design
    generates: design.md
    template: templates/design.md.tpl
    requires: [proposal]

  - id: specs
    generates: specs/
    template: templates/spec.md.tpl
    requires: [design]

  - id: tasks
    generates: tasks.md
    template: templates/tasks.md.tpl
    requires: [specs]

phases:
  - id: explore
    name: Explore
    command: /opsx-explore

  - id: propose
    name: Propose
    produces: [proposal, design, specs, tasks]

  - id: apply
    name: Apply
    gates: [test:unit, lint, type-check]

  - id: archive
    name: Archive
    trigger: post-merge
```

#### bugfix/schema.yaml

```yaml
schema:
  name: bugfix
  version: "1.0"

artifacts:
  - id: bug_report
    generates: bug-report.md
    template: templates/bug-report.md.tpl
    required_sections: [Symptom, Steps_to_Reproduce]

  - id: fix
    generates: fix.md
    template: templates/fix.md.tpl
    requires: [bug_report]
    required_sections: [Root_Cause, Fix_Description]

phases:
  - id: report
    name: Report
    produces: [bug_report]

  - id: fix
    name: Fix
    produces: [fix]
    gates: [regression-test, test:all]

  - id: archive
    name: Archive
    trigger: post-merge
```

### changes/ 目录

存放 Spec-Driven 变更。

#### 激活的变更

```
changes/
├── add-user-auth/              # Spec-Driven 变更
│   ├── .openspec.yaml          # 变更元数据
│   ├── proposal.md             # 提案文档
│   ├── design.md               # 设计文档
│   ├── specs/                  # 规格目录
│   │   └── auth/
│   │       ├── login.md
│   │       └── register.md
│   └── tasks.md                # 任务列表
│
└── evaluate-state-management/  # Spike 变更
    ├── .openspec.yaml          # 调研配置
    ├── research-question.md    # 研究问题
    ├── exploration-log.md      # 探索日志
    └── decision.md             # 决策文档
```

##### .openspec.yaml

变更的配置文件：

```yaml
schema: spec-driven
name: add-user-auth
status: active

created: 2024-03-15
updated: 2024-03-20
```

##### proposal.md

为什么要做这个变更：

```markdown
# Proposal: 添加用户认证

## 问题

当前系统没有用户管理，无法区分用户权限

## 目标

实现完整的用户认证系统

## 成功标准

- [ ] 支持邮箱/密码登录
- [ ] 支持 JWT Token
- [ ] 支持 Token 刷新
```

##### design.md

技术设计方案：

```markdown
# Design: 用户认证

## 技术选型

- JWT 用于 Token 管理
- bcrypt 用于密码加密
- Redis 用于 Token 黑名单

## 架构
```

Client → API → AuthService → Database

```

## API 设计
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/refresh
```

##### specs/

详细功能规格：

```markdown
# Spec: 用户登录

## 场景 1: 成功登录

WHEN 用户提交正确的邮箱和密码
THEN 返回 JWT Token
AND 设置 Refresh Token cookie

## 场景 2: 密码错误

WHEN 用户提交错误的密码
THEN 返回 401 错误
AND 提示"邮箱或密码错误"
```

##### tasks.md

实施任务列表：

```markdown
# Tasks: 用户认证

## Red Phase

- [x] 编写登录 API 测试
- [x] 编写注册 API 测试

## Green Phase

- [x] 实现登录 API
- [ ] 实现注册 API

## Refactor Phase

- [ ] 提取公共验证逻辑
```

#### 归档目录

```
changes/
├── add-user-auth/              # 激活的变更
└── archive/                    # 归档目录
    ├── add-dark-mode/          # 已完成的变更
    │   ├── .openspec.yaml
    │   ├── proposal.md
    │   ├── design.md
    │   ├── specs/
    │   └── tasks.md
    └── refactor-api/           # 另一个归档
```

### bugs/ 目录

存放 Bugfix 变更，结构与 changes/ 类似。

```
bugs/
├── login-button-error/         # 激活的 Bug
│   ├── .openspec.yaml
│   ├── bug-report.md
│   └── fix.md
└── archive/                    # 归档 Bug
    ├── api-timeout/
    └── data-loss/
```

#### bug-report.md

```markdown
# Bug Report: 登录按钮错误

## Symptom

点击登录按钮无反应

## Steps to Reproduce

1. 打开首页
2. 点击登录按钮

## Expected

显示登录框

## Actual

无任何反应

## Environment

- Browser: Chrome 120
- OS: macOS 14
```

#### fix.md

```markdown
# Fix: 登录按钮错误

## Root Cause

事件监听器未正确绑定

## Fix

将 onClick={this.handleClick} 改为 onClick={() => this.handleClick()}

## Files Changed

- src/components/LoginButton.tsx

## Testing

添加了回归测试
```

## .opencode/ 目录

AI 助手的配置目录。

```
.opencode/
├── opencode.json               # 插件配置
├── command/                    # 斜杠命令定义
│   ├── opsx-explore.md
│   ├── opsx-spike.md
│   ├── opsx-propose.md
│   ├── opsx-bugfix.md
│   ├── opsx-apply.md
│   └── opsx-archive.md
└── skills/                     # 技能定义
    ├── openspec-explore/
    │   └── SKILL.md
    ├── openspec-spike/
    │   └── SKILL.md
    ├── openspec-propose/
    │   └── SKILL.md
    ├── openspec-bugfix/
    │   └── SKILL.md
    ├── openspec-apply-change/
    │   └── SKILL.md
    └── openspec-archive-change/
        └── SKILL.md
```

### opencode.json

插件配置：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-vibeguard@latest"]
}
```

### command/

斜杠命令的定义文件。

#### opsx-propose.md

```markdown
---
description: Propose a new change
---

Propose a new change with artifacts.

## Steps

1. Create change directory
2. Generate proposal.md
3. Generate design.md
4. Generate specs/
5. Generate tasks.md
```

### skills/

技能定义目录，包含 AI 执行命令的具体逻辑。

#### SKILL.md 结构

```markdown
---
name: openspec-propose
---

Skill for proposing changes.

## Steps

1. Ask user what to build
2. Run `openspec new change <name>`
3. Create artifacts in order:
   - proposal.md
   - design.md
   - specs/
   - tasks.md
4. Show completion status

## Guardrails

- Always ask before proceeding
- Verify files created
- Follow schema rules
```

## src/ 目录

源代码（根据项目类型不同而异）。

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/                 # 组件
│   └── ui/
├── lib/                        # 工具函数
├── niuma-engine/               # Agent 核心
│   ├── index.ts
│   ├── types.ts
│   └── tests/
└── tests/                      # 测试
    └── unit/
```

## AGENTS.md

AI 助手的操作指南。

```markdown
---
target: AI Assistant
purpose: Operational guidelines
---

# AI Agent Guidelines

## Roles

- SpecWriter: Create specifications
- Developer: Implement code
- Tester: Write tests

## Workflow

Explore → Propose → Apply → Validate → Archive

## Constraints

SHALL:

- Use TDD
- Write tests first
- Follow conventions

SHALL NOT:

- Skip tests
- Ignore type errors
```

## 目录组织原则

### 1. 关注点分离

```
openspec/     → 工作流和变更管理
.opencode/    → AI 助手配置
docs/         → 人类可读文档
src/          → 源代码
```

### 2. 变更隔离

每个变更独立目录：

```
changes/
├── feature-a/      # 独立
├── feature-b/      # 独立
└── feature-c/      # 独立
```

### 3. 归档清理

完成的变更移动到 archive/，保持工作区整洁。

### 4. 配置分层

```
AGENTS.md       → AI 行为（高层）
config.yaml     → 项目信息（中层）
schemas/        → 工作流规则（底层）
```

## 文件命名规范

### 变更名称

```
✅ 正确：
  - add-user-auth
  - fix-login-timeout
  - refactor-payment
  - update-dependencies

❌ 错误：
  - addUserAuth (camelCase)
  - AddUserAuth (PascalCase)
  - feature1 (无意义)
```

### 文档文件

```
✅ 正确：
  - proposal.md
  - design.md
  - bug-report.md
  - fix.md

❌ 错误：
  - Proposal.md (大写)
  - design-doc.md (多余后缀)
```

### 规格文件

```
specs/
└── auth/
    ├── login.md
    ├── register.md
    └── logout.md
```

## 下一步

- **[最佳实践](06-best-practices.md)** - 学习推荐的开发模式和注意事项
- **[命令参考](04-commands.md)** - 查看所有可用命令
