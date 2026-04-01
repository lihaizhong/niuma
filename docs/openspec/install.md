# OpenSpec Harness 安装指南

> **AI 指令**：本文档指导你完成 Harness 环境搭建。**逐阶段执行，不要跳过任何步骤。**

---

## ⚠️ 前置要求（必须）

**MUST: 全局安装 openspec CLI**

```bash
npm install -g @openspec/cli
openspec --version  # 验证安装
```

❌ 未安装则**立即停止**并提示用户安装。

---

## 🎯 安装流程速览

```
┌──────────────────────────────────────────────────────────────┐
│  1. 检查 openspec CLI 安装                                   │
├──────────────────────────────────────────────────────────────┤
│  2. 收集项目信息（新项目/老项目 + 项目类型）                  │
├──────────────────────────────────────────────────────────────┤
│  3. 执行 openspec init（仅创建目录结构）                     │
├──────────────────────────────────────────────────────────────┤
│  4. AI 从 .template 拷贝并填充配置                           │
├──────────────────────────────────────────────────────────────┤
│  5. 完成验证                                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 阶段 1：收集项目信息

### Step 1.1 新项目 or 老项目？

向用户展示：

```
你好！我来帮你搭建 OpenSpec Harness 环境。

请告诉我你的情况：
A) 从零创建新项目
B) 已有项目，想引入 Harness
```

### Step 1.2 项目类型

**如果选 A（新项目）：**

```
请选择项目类型：
1) Web 前端项目（React/Vue/Angular 等）
2) 客户端项目（Electron/Tauri/React Native 等）
3) 服务端项目（Node.js/Go/Java 等）
4) 全栈项目（Next.js/Nuxt 等）
```

**如果选 B（老项目）：**

> 🎯 **ACTION**: 自动检测技术栈 → 展示报告 → 用户确认

---

## 阶段 2：项目类型专属问题

根据项目类型询问：

| 项目类型     | 必问问题                                                                     |
| ------------ | ---------------------------------------------------------------------------- |
| **Web 前端** | 框架(React/Vue/Angular)、构建工具、包管理器、测试框架、TypeScript?、项目名称 |
| **客户端**   | 平台(桌面/移动/跨平台)、框架(Electron/Tauri/Flutter)、包管理器、项目名称     |
| **服务端**   | 语言/运行时、Web框架、数据库、ORM、认证方案、部署目标、项目名称              |
| **全栈**     | 全栈框架(Next.js/Nuxt等)、渲染模式、数据库、ORM、认证、部署平台、项目名称    |

---

## 阶段 3：老项目自动检测

> 🎯 **ACTION**: 仅对老项目执行

### 检测清单

```
□ 检查 package.json → Node.js 项目确认
  □ 解析 dependencies: next→Next.js, react→React, vue→Vue
  □ 解析 devDependencies: vitest→Vitest, jest→Jest
□ 检查 lock 文件: pnpm-lock.yaml→pnpm, yarn.lock→yarn
□ 检查配置文件: next.config.js→Next.js, tailwind.config.js→Tailwind
```

### 检测报告模板

```
🔍 技术栈检测报告

📋 检测结果：
├─ 项目类型: Web 前端（Next.js 全栈）
├─ 框架: Next.js 15
├─ 渲染模式: [未检测，请确认]
├─ 语言: TypeScript
├─ 包管理器: pnpm
├─ 测试框架: Vitest
└─ 运行时: Node.js >=18.0.0

⚠️ 需要确认：渲染模式、数据库
[确认无误] [修改配置]
```

---

## 阶段 3.5：AI 配置目录检测与选择

### Step 3.5.1 扫描已存在的 AI 配置

检测以下目录：

| AI 工具     | 配置目录           | 检测标志          |
| ----------- | ------------------ | ----------------- |
| OpenCode    | `.opencode/`       | `opencode.json`   |
| Claude Code | `.claude/`         | `settings.json`   |
| Cursor      | `.cursor/`         | `rules/`          |
| Copilot     | `.github/copilot/` | `instructions.md` |
| VS Code     | `.vscode/`         | `settings.json`   |

**决策分支：**

- **0 个目录** → 进入 Step 3.5.2
- **1 个目录** → 询问："检测到 [工具] 配置，是否在此更新？"
- **2+ 个目录** → 多选界面："选择要更新的目录"

### Step 3.5.2 检测当前运行的 AI

通过以下信号检测：

- `OPENCODE_SESSION_ID` → OpenCode
- `CLAUDE_CODE_VERSION` → Claude Code
- `CURSOR_VERSION` → Cursor

> 🎯 **ACTION**: 如果检测到新工具，询问是否创建配置目录。

### Step 3.5.3 确认目标目录

显示并确认：

```
📁 目标 AI 配置目录：[路径]

将创建：
├── commands/ (6 个命令文件)
└── skills/ (6 个技能目录)

[确认安装] [更换目录] [取消]
```

---

## 阶段 4：执行安装

### Step 4.1 创建目录结构

> ⚠️ **CRITICAL**: 执行 `openspec init` 仅创建空目录结构

```
openspec/
├── schemas/
└── changes/

{{AI_CONFIG_DIR}}/
├── commands/
└── skills/
```

### Step 4.2 从模板拷贝配置

> 🎯 **ACTION**: 从 `docs/openspec/.template/` 复制以下文件：

| 源文件                           | 目标文件                       |
| -------------------------------- | ------------------------------ |
| `.template/openspec/config.yaml` | `openspec/config.yaml`         |
| `.template/openspec/schemas/*`   | `openspec/schemas/*`           |
| `.template/AGENTS.md`            | `AGENTS.md`                    |
| `.template/custom/commands/*`    | `{{AI_CONFIG_DIR}}/commands/*` |
| `.template/custom/skills/*`      | `{{AI_CONFIG_DIR}}/skills/*`   |

> ⚠️ **CRITICAL**: Commands 和 Skills **必须**从 `.template/custom/` 复制，**禁止使用** `openspec init` 生成的默认内容！

#### 4.2.1 Commands 清单（必须全部复制）

```
□ opsx-explore.md
□ opsx-propose.md
□ opsx-apply.md
□ opsx-archive.md
□ opsx-bugfix.md
□ opsx-spike.md
```

#### 4.2.2 Skills 清单（必须全部复制）

```
□ openspec-explore/
□ openspec-propose/
□ openspec-apply-change/
□ openspec-archive-change/
□ openspec-bugfix/
□ openspec-spike/
```

#### 4.2.3 AGENTS.md 生成

**流程：**

1. 读取模板 `.template/AGENTS.md`
2. 替换变量占位符
3. **冲突检测**：检查目标文件是否存在

**冲突处理决策树：**

```
目标文件已存在？
├─ 是 → 有 OpenSpec 标识？
│   ├─ 是 → 询问是否更新
│   └─ 否 → 是专属 AI 文档？(IFLOW.md, CLAUDE.md 等)
│       ├─ 是 → 询问：同时生成 / 合并 / 跳过
│       └─ 否 → 备份后创建
└─ 否 → 直接写入
```

### Step 4.3 配置变量填充

#### AGENTS.md 变量

| 占位符                | 替换为   | 示例                       |
| --------------------- | -------- | -------------------------- |
| `PROJECT_NAME`        | 项目名称 | `MyApp`                    |
| `PROJECT_DESCRIPTION` | 项目描述 | `A web application for...` |
| `TEST_DIR`            | 测试目录 | `src/tests/`               |
| `SRC_DIR`             | 源码目录 | `src/`                     |
| `PACKAGE_MANAGER`     | 包管理器 | `pnpm`                     |

#### config.yaml 变量

**基础变量（直接替换）：**

| 占位符                    | 替换为     | 示例                |
| ------------------------- | ---------- | ------------------- |
| `{{PROJECT_NAME}}`        | 项目名称   | `MyApp`             |
| `{{PROJECT_DESCRIPTION}}` | 项目描述   | `A web application` |
| `{{LANGUAGE}}`            | 编程语言   | `TypeScript`        |
| `{{RUNTIME}}`             | 运行时     | `Node.js >=22.0.0`  |
| `{{PACKAGE_MANAGER}}`     | 包管理器   | `pnpm`              |
| `{{LANGUAGE_VERSION}}`    | 语言版本   | `TypeScript 5.9+`   |
| `{{TEST_FRAMEWORK}}`      | 测试框架   | `vitest`            |
| `{{RUNTIME_VERSION}}`     | 运行时版本 | `Node.js >=22.0.0`  |

**条件变量（根据项目类型生成整行）：**

| 占位符                      | 生成逻辑                                                  | 示例输出                      |
| --------------------------- | --------------------------------------------------------- | ----------------------------- |
| `{{WEB_FRAMEWORK_LINE}}`    | Web项目 → `web_framework: Next.js 15`<br>非Web项目 → 空行 | `web_framework: Next.js 15`   |
| `{{UI_FRAMEWORK_LINE}}`     | 有UI框架 → `ui: React 19 + Tailwind CSS`<br>无 → 空行     | `ui: React 19 + Tailwind CSS` |
| `{{BUILD_TOOL_LINE}}`       | 指定构建工具 → `build_tool: Vite`<br>未指定 → 空行        | `build_tool: Vite`            |
| `{{TYPESCRIPT_CONVENTION}}` | TypeScript项目 → `- Strict TypeScript`<br>非TS → 空行     | `- Strict TypeScript`         |

**模块配置（动态生成多行）：**

`{{MODULES_SECTION}}` 根据项目类型生成：

```yaml
# Web/全栈项目示例
src:
  purpose: Next.js web service
  scope: Web UI, API routes, components
  tests: src/tests/

# 服务端项目示例
src:
  purpose: API service
  scope: Routes, controllers, services
  tests: src/tests/
```

**命令配置（条件生成）：**

| 占位符                        | 生成逻辑                                     | 示例                          |
| ----------------------------- | -------------------------------------------- | ----------------------------- |
| `{{DEV_COMMAND_LINE}}`        | 有dev命令 → `dev: pnpm dev`                  | `dev: pnpm dev`               |
| `{{BUILD_COMMAND_LINE}}`      | 有build命令 → `build: pnpm build`            | `build: pnpm build`           |
| `{{TEST_COMMAND_LINE}}`       | 有test命令 → `test: pnpm test`               | `test: pnpm test`             |
| `{{TEST_UNIT_COMMAND_LINE}}`  | 有unit test → `test_unit: pnpm test:unit`    | `test_unit: pnpm test:unit`   |
| `{{LINT_COMMAND_LINE}}`       | 有lint命令 → `lint: pnpm lint`               | `lint: pnpm lint`             |
| `{{TYPE_CHECK_COMMAND_LINE}}` | 有type-check → `type_check: pnpm type-check` | `type_check: pnpm type-check` |

> ⚠️ **CRITICAL**: 所有占位符**必须**替换，不能原样复制到目标文件！

**验证方法：**

```bash
# 替换完成后检查是否还有未替换的占位符
grep -E '\{\{[A-Z_]+\}\}' openspec/config.yaml AGENTS.md
# 应该无输出
```

---

## 阶段 5：合并规则

> 🎯 **ACTION**: 如果目标文件已存在，按以下规则处理：

### 决策流程

```
文件是否存在？
├─ 否 → 使用模板版本
└─ 是 → 与 openspec 相关？
    ├─ 否 → 保留现有版本（用户自定义）
    └─ 是 → 使用模板版本（覆盖）
```

### "与 openspec 相关" 的文件清单

**必须覆盖（标准组件）：**

```
✓ openspec/ 目录下所有文件
✓ AGENTS.md
✓ {{AI_CONFIG_DIR}}/commands/opsx-{explore,propose,apply,archive}.md
✓ {{AI_CONFIG_DIR}}/skills/openspec-{explore,propose,apply-change,archive-change}/
```

**保留用户自定义：**

```
✗ {{AI_CONFIG_DIR}}/commands/opsx-{bugfix,spike}.md
✗ {{AI_CONFIG_DIR}}/skills/openspec-{bugfix,spike}/
✗ 用户自己的其他配置文件
```

---

## 阶段 6：完成验证

> 🎯 **ACTION**: 安装完成后逐项验证：

```
□ openspec/config.yaml 存在且格式正确
□ openspec/schemas/ 包含 spec-driven、bugfix、spike
□ AGENTS.md 存在
□ {{AI_CONFIG_DIR}}/commands/ 包含 6 个命令文件
□ {{AI_CONFIG_DIR}}/skills/ 包含 6 个技能目录
```

**全部通过 → 提示用户：**

```
🎉 OpenSpec Harness 环境搭建完成！

下一步：
1. 查看 openspec/config.yaml 确认配置
2. 阅读 AGENTS.md 了解 AI 助手的工作方式
3. 创建第一个变更：

   新功能：/opsx-propose my-first-feature
   Bug 修复：/opsx-bugfix some-bug
   技术调研：/opsx-spike evaluate-options
```

---

## 附录：模板目录结构

```
docs/openspec/.template/
├── README.md                    # 模板使用说明
├── AGENTS.md                    # AI 行为指南模板
├── openspec/
│   ├── config.yaml              # 配置模板
│   └── schemas/
│       ├── spec-driven/         # 新功能开发
│       ├── bugfix/              # Bug 修复
│       └── spike/               # 技术调研
└── custom/                      # AI 配置模板
    ├── commands/                # 6 个命令文件
    └── skills/                  # 6 个技能目录
```

---

## 参考文档

| 文档                  | 说明           |
| --------------------- | -------------- |
| `00-quick-start.md`   | 5 分钟快速入门 |
| `01-overview.md`      | 系统概览       |
| `02-config-system.md` | 配置体系详解   |
| `03-workflows.md`     | 工作流详解     |
| `.template/README.md` | 模板使用说明   |
