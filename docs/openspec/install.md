# OpenSpec Harness 安装指南

> AI 助手读取此文件，引导用户完成 Harness 环境搭建

## 前置要求

**必须全局安装 openspec CLI**，否则无法继续：

```bash
npm install -g @openspec/cli

# 验证安装
openspec --version
```

如果未安装，AI 将退出并提示用户先安装。

---

## 安装流程概览

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

AI 将通过对话询问以下信息：

### Q1：新项目 or 老项目？

```
你好！我来帮你搭建 OpenSpec Harness 环境。

请告诉我你的情况：
A) 从零创建新项目
B) 已有项目，想引入 Harness
```

### Q2：项目类型

**如果选 A（新项目）：**

```
请选择项目类型：
1) Web 前端项目（React/Vue/Angular 等）
2) 客户端项目（Electron/Tauri/React Native 等）
3) 服务端项目（Node.js/Go/Java 等）
4) 全栈项目（Next.js/Nuxt 等）
```

**如果选 B（老项目）：**

AI 自动检测技术栈 → 展示检测报告 → 用户确认/修改

---

## 阶段 2：项目类型专属问题

根据项目类型询问关键信息：

| 项目类型     | 必问问题                                                                     |
| ------------ | ---------------------------------------------------------------------------- |
| **Web 前端** | 框架(React/Vue/Angular)、构建工具、包管理器、测试框架、TypeScript?、项目名称 |
| **客户端**   | 平台(桌面/移动/跨平台)、框架(Electron/Tauri/Flutter)、包管理器、项目名称     |
| **服务端**   | 语言/运行时、Web框架、数据库、ORM、认证方案、部署目标、项目名称              |
| **全栈**     | 全栈框架(Next.js/Nuxt等)、渲染模式、数据库、ORM、认证、部署平台、项目名称    |

---

## 阶段 3：老项目自动检测

对于老项目，AI 将自动检测技术栈：

### 检测逻辑

```
1. 检查 package.json 是否存在 → Node.js 项目
2. 解析 dependencies：
   - next → Next.js
   - react → React
   - vue → Vue
   - @angular/core → Angular
3. 解析 devDependencies：
   - vitest → Vitest
   - jest → Jest
   - cypress → Cypress
4. 检查 lock 文件：
   - pnpm-lock.yaml → pnpm
   - yarn.lock → yarn
   - package-lock.json → npm
5. 检查配置文件：
   - next.config.js → Next.js 确认
   - tailwind.config.js → Tailwind CSS
   - vite.config.ts → Vite
```

### 检测报告示例

```
🔍 技术栈检测报告

检测依据：
• package.json 存在 → Node.js 项目
• dependencies 中发现 next → Next.js 框架
• devDependencies 中发现 vitest → Vitest 测试框架
• 存在 tailwind.config.js → Tailwind CSS
• 存在 pnpm-lock.yaml → pnpm 包管理器

📋 检测结果：
├─ 项目类型: Web 前端（Next.js 全栈）
├─ 框架: Next.js 15
├─ 渲染模式: [未检测，请确认]
├─ 语言: TypeScript
├─ 包管理器: pnpm
├─ 测试框架: Vitest
├─ UI: Tailwind CSS
└─ 运行时: Node.js >=18.0.0

⚠️ 以下项需要确认：
  • 渲染模式 (SSR/SSG/SPA)
  • 数据库 (如果有使用)

[确认无误] [修改配置]
```

---

## 阶段 3.5：AI 配置目录检测与选择

### 3.5.1 检测已存在的 AI 配置目录

扫描项目根目录，检测以下 AI 工具配置：

| AI 工具     | 配置目录           | 检测标志                |
| ----------- | ------------------ | ----------------------- |
| OpenCode    | `.opencode/`       | `opencode.json`         |
| Claude Code | `.claude/`         | `.claude/settings.json` |
| Cursor      | `.cursor/`         | `.cursor/rules/`        |
| Copilot     | `.github/copilot/` | `instructions.md`       |
| VS Code     | `.vscode/`         | `settings.json`         |

**处理逻辑：**

- 0 个目录 → 检测当前运行的 AI 工具
- 1 个目录 → 询问是否使用
- 2+ 个目录 → 多选更新

### 3.5.2 检测当前运行的 AI 工具

通过环境变量和进程检测当前 AI：

- `OPENCODE_SESSION_ID` → OpenCode
- `CLAUDE_CODE_VERSION` → Claude Code
- `CURSOR_VERSION` → Cursor

检测到新工具时，询问是否创建配置目录。

### 3.5.3 目标配置目录确认

显示目标路径和将创建的文件结构，用户确认后继续。

---

## 阶段 4：执行安装

### 4.1 创建目录结构

AI 执行 `openspec init` 创建基础目录：

```
openspec/
├── schemas/
└── changes/

{{AI_CONFIG_DIR}}/
├── commands/
└── skills/
```

### 4.2 从 .template 拷贝配置

AI 从 `docs/openspec/.template/` 读取模板并填充：

| 源文件                           | 目标文件                       | 操作           |
| -------------------------------- | ------------------------------ | -------------- |
| `.template/openspec/config.yaml` | `openspec/config.yaml`         | 填充变量后写入 |
| `.template/openspec/schemas/*`   | `openspec/schemas/*`           | 直接复制       |
| `.template/AGENTS.md`            | `AGENTS.md`                    | 填充变量后写入 |
| `.template/custom/commands/*`    | `{{AI_CONFIG_DIR}}/commands/*` | 直接复制       |
| `.template/custom/skills/*`      | `{{AI_CONFIG_DIR}}/skills/*`   | 直接复制       |

**重要提示：** Commands 和 Skills 必须从 `.template/custom/` 复制，**不能使用 `openspec init` 生成的默认内容**。

`openspec init` 仅创建基础目录结构，不会生成完整的命令和技能定义。必须使用模板中的预定义内容。

---

#### 4.2.1 Commands 和 Skills 复制详情

##### Commands 文件清单

必须从 `.template/custom/commands/` 复制以下文件到 `{{AI_CONFIG_DIR}}/commands/`：

| 文件              | 用途             | 是否必须 |
| ----------------- | ---------------- | -------- |
| `opsx-explore.md` | 探索模式命令定义 | 是       |
| `opsx-propose.md` | 创建提案命令定义 | 是       |
| `opsx-apply.md`   | 实施变更命令定义 | 是       |
| `opsx-archive.md` | 归档变更命令定义 | 是       |
| `opsx-bugfix.md`  | Bug 修复命令定义 | 是       |
| `opsx-spike.md`   | 技术调研命令定义 | 是       |

**注意：** 命令文件包含特定于 OpenSpec Harness 的执行逻辑，与 `openspec init` 生成的默认命令不同。

##### Skills 文件清单

必须从 `.template/custom/skills/` 复制以下目录到 `{{AI_CONFIG_DIR}}/skills/`：

| 目录                       | 用途             | 是否必须 |
| -------------------------- | ---------------- | -------- |
| `openspec-explore/`        | 探索模式技能实现 | 是       |
| `openspec-propose/`        | 创建提案技能     | 是       |
| `openspec-apply-change/`   | 实施变更技能     | 是       |
| `openspec-archive-change/` | 归档变更技能     | 是       |
| `openspec-bugfix/`         | Bug修复技能      | 是       |
| `openspec-spike/`          | 技术调研技能     | 是       |

**注意：** `openspec init` 生成的默认内容**不能**使用，必须用模板内容覆盖。

---

#### 4.2.3 AGENTS.md 生成逻辑

**生成流程：**

1. 读取模板 `.template/AGENTS.md`
2. 替换变量（PROJECT_NAME, PACKAGE_MANAGER 等）
3. 检查目标文件是否存在 → 冲突处理或直接写入

**冲突处理：**

- 旧版 OpenSpec → 询问是否更新
- 专属 AI 文档（IFLOW.md, CLAUDE.md 等）→ 询问是否同时生成 AGENTS.md 或合并
- 其他配置 → 备份后创建

**专属 AI 文档检测：**

发现 0 个专属文档 → 直接生成 AGENTS.md

发现 1+ 个专属文档 → 提示用户：
"检测到项目中已存在专属 AI 配置文件：
• [IFLOW.md] - iFlow 专属配置
• [CLAUDE.md] - Claude Code 专属配置

AGENTS.md 是通用 AI 行为指南，可被所有 AI 工具读取。
专属 AI 文档仅对特定 AI 工具有效。

请选择操作：
□ 同时生成 AGENTS.md（推荐，作为通用指南）
□ 将专属文档内容合并到 AGENTS.md
□ 跳过，保留现有专属文档（不推荐，其他 AI 工具无法读取）"

```

**处理方式：**

```

用户选择：

[A] 同时生成 AGENTS.md
→ 保留现有专属文档
→ 生成新的 AGENTS.md
→ 在 AGENTS.md 顶部添加注释：
"注意：本项目同时存在 [工具名] 专属配置 [文件名]，
当冲突时，专属配置优先于本通用配置"

[B] 将专属文档内容合并到 AGENTS.md
→ 解析专属文档内容
→ 提取关键配置（角色定义、工作流程、约束等）
→ 合并到 AGENTS.md 模板中
→ 备份原专属文档为 [原文件名].bak
→ 生成合并后的 AGENTS.md

[C] 跳过生成
→ 保留现有专属文档
→ 给出警告：
"警告：未生成 AGENTS.md，其他 AI 工具可能无法正确理解项目规范。
如需通用 AI 支持，可稍后手动运行安装流程。"

````

**注意事项：**

- 始终创建备份（`.bak` 或 `.backup.<timestamp>`）
- 如果用户选择保留现有文件，跳过 AGENTS.md 生成，但给出警告
- 迁移旧格式时，尽可能保留原有配置内容
- 专属文档的优先级高于 AGENTS.md，避免配置冲突

### 4.3 配置变量填充

根据用户回答，填充以下变量：

```yaml
# config.yaml 中的变量
{{PROJECT_NAME}}         → 用户输入的项目名
{{PROJECT_DESCRIPTION}}  → 根据类型自动生成
{{PROJECT_TYPE}}         → web-frontend/client/backend/fullstack
{{LANGUAGE}}             → TypeScript/JavaScript/Go/Java/Python
{{LANGUAGE_VERSION}}     → 根据类型推断
{{RUNTIME}}              → Node.js >=22.0.0/Go 1.21+/等
{{RUNTIME_VERSION}}      → 具体版本
{{PACKAGE_MANAGER}}      → pnpm/npm/yarn/bun
{{TEST_FRAMEWORK}}       → vitest/jest/cypress/playwright
{{WEB_FRAMEWORK}}        → Next.js/Vue/Express/等
{{UI_FRAMEWORK}}         → Tailwind CSS/等
{{BUILD_TOOL}}           → Vite/Webpack/等
{{MODULE_NAME}}          → src/app/lib
{{HAS_DEV_COMMAND}}      → true/false
{{HAS_BUILD_COMMAND}}    → true/false
{{HAS_TEST_COMMAND}}     → true/false
{{HAS_TEST_UNIT_COMMAND}}→ true/false
{{HAS_LINT_COMMAND}}     → true/false
{{HAS_TYPE_CHECK_COMMAND}}→ true/false
````

---

## 阶段 5：合并规则

如果目标目录已存在文件，按以下规则合并：

```
文件是否在现有目录中？
  ├─ 否 → 直接使用模板版本
  └─ 是 → 文件是否与 openspec 相关？
      ├─ 否（用户自定义）→ 保留现有版本
      └─ 是（openspec 相关）→ 使用模板版本

判断 "与 openspec 相关" 的文件：
✓ openspec/ 目录下的所有文件
✓ AGENTS.md
✓ {{AI_CONFIG_DIR}}/commands/opsx-propose.md（标准命令）
✓ {{AI_CONFIG_DIR}}/commands/opsx-apply.md（标准命令）
✓ {{AI_CONFIG_DIR}}/commands/opsx-explore.md（标准命令）
✓ {{AI_CONFIG_DIR}}/commands/opsx-archive.md（标准命令）
✓ {{AI_CONFIG_DIR}}/skills/openspec-propose/（标准技能）
✓ {{AI_CONFIG_DIR}}/skills/openspec-apply-change/（标准技能）
✓ {{AI_CONFIG_DIR}}/skills/openspec-archive-change/（标准技能）
✓ {{AI_CONFIG_DIR}}/skills/openspec-explore/（标准技能）

✗ {{AI_CONFIG_DIR}}/commands/opsx-bugfix.md（自定义命令）
✗ {{AI_CONFIG_DIR}}/commands/opsx-spike.md（自定义命令）
✗ {{AI_CONFIG_DIR}}/skills/openspec-bugfix/（自定义技能）
✗ {{AI_CONFIG_DIR}}/skills/openspec-spike/（自定义技能）
✗ 用户自己的其他配置文件
```

---

## 阶段 6：完成验证

安装完成后，AI 验证以下内容：

```
✓ openspec/config.yaml 存在且格式正确
✓ openspec/schemas/ 包含 spec-driven、bugfix、spike
✓ AGENTS.md 存在
✓ {{AI_CONFIG_DIR}}/commands/ 包含必要命令
✓ {{AI_CONFIG_DIR}}/skills/ 包含必要技能
```

并提示用户：

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

## 模板目录结构

```
docs/openspec/.template/
├── README.md                    # 模板使用说明
├── AGENTS.md                    # AI 行为指南（带变量）
├── openspec/
│   ├── config.yaml              # 通用配置模板（带变量）
│   └── schemas/
│       ├── spec-driven/         # 新功能开发工作流
│       ├── bugfix/              # Bug 修复工作流
│       └── spike/               # 技术调研工作流
└── {{AI_CONFIG_DIR}}/                         # AI 助手配置（通用，支持多种 AI 工具）
    ├── commands/                # 斜杠命令
    │   ├── opsx-explore.md      # 标准：探索模式
    │   ├── opsx-propose.md      # 标准：创建提案
    │   ├── opsx-apply.md        # 标准：实施变更
    │   ├── opsx-archive.md      # 标准：归档变更
    │   ├── opsx-bugfix.md       # 自定义：Bug 修复
    │   └── opsx-spike.md        # 自定义：技术调研
    └── skills/                  # 技能定义
        ├── openspec-explore/    # 标准
        ├── openspec-propose/    # 标准
        ├── openspec-apply-change/    # 标准
        ├── openspec-archive-change/  # 标准
        ├── openspec-bugfix/     # 自定义
        └── openspec-spike/      # 自定义
```

**注意**：`.template` 是一个独立的、可复用的配置模板库，与当前工程的实际配置解耦。

---

## 参考文档

| 文档                  | 说明           |
| --------------------- | -------------- |
| `00-quick-start.md`   | 5 分钟快速入门 |
| `01-overview.md`      | 系统概览       |
| `02-config-system.md` | 配置体系详解   |
| `03-workflows.md`     | 工作流详解     |
| `.template/README.md` | 模板使用说明   |
