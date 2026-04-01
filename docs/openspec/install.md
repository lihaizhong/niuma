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

根据项目类型，询问以下必要问题：

### Web 前端项目

| 问题                    | 选项                                                                              |
| ----------------------- | --------------------------------------------------------------------------------- |
| **2.1 框架**            | □ React<br>□ Vue<br>□ Angular<br>□ Svelte<br>□ Solid<br>□ 其他                    |
| **2.2 如果选 React**    | □ Next.js<br>□ Remix<br>□ 纯 React + Vite<br>□ 纯 React + CRA                     |
| **2.3 构建工具**        | □ Vite<br>□ Webpack<br>□ Parcel<br>□ 框架自带                                     |
| **2.4 包管理器**        | □ pnpm<br>□ npm<br>□ yarn<br>□ bun                                                |
| **2.5 测试框架**        | □ Vitest<br>□ Jest<br>□ Cypress<br>□ Playwright<br>□ 无                           |
| **2.6 UI 方案**         | □ Tailwind CSS<br>□ CSS Modules<br>□ Styled Components<br>□ UI 库 (AntD/Material) |
| **2.7 使用 TypeScript** | □ 是<br>□ 否                                                                      |
| **2.8 项目名称**        | 输入：**\_\_\_\_**（. 或空 = 当前目录）                                           |

### 客户端项目

| 问题                 | 选项                                            |
| -------------------- | ----------------------------------------------- |
| **2.1 平台类型**     | □ 桌面端<br>□ 移动端<br>□ 跨平台                |
| **2.2 桌面端框架**   | □ Electron<br>□ Tauri<br>□ Flutter Desktop      |
| **2.3 移动端框架**   | □ React Native<br>□ Flutter<br>□ 原生           |
| **2.4 如果选 Tauri** | □ Rust（默认）<br>□ Go                          |
| **2.5 状态管理**     | □ Redux/Zustand<br>□ MobX<br>□ Context/Provider |
| **2.6 包管理器**     | □ pnpm<br>□ npm<br>□ yarn<br>□ bun              |
| **2.7 项目名称**     | 输入：**\_\_\_\_**                              |

### 服务端项目

| 问题                   | 选项                                                                |
| ---------------------- | ------------------------------------------------------------------- |
| **2.1 语言/运行时**    | □ Node.js<br>□ Go<br>□ Java<br>□ Python<br>□ Rust<br>□ 其他         |
| **2.2 如果选 Node.js** | □ Express<br>□ Fastify<br>□ NestJS<br>□ Koa                         |
| **2.3 API 类型**       | □ REST<br>□ GraphQL<br>□ gRPC<br>□ tRPC                             |
| **2.4 数据库**         | □ PostgreSQL<br>□ MySQL<br>□ MongoDB<br>□ Redis<br>□ SQLite<br>□ 无 |
| **2.5 ORM/数据层**     | □ Prisma<br>□ TypeORM<br>□ Drizzle<br>□ 原生 SQL<br>□ 无            |
| **2.6 认证方案**       | □ JWT<br>□ Session<br>□ OAuth2<br>□ 无                              |
| **2.7 部署目标**       | □ Docker<br>□ Serverless<br>□ K8s<br>□ 传统服务器                   |
| **2.8 项目名称**       | 输入：**\_\_\_\_**                                                  |

### 全栈项目

| 问题                   | 选项                                                      |
| ---------------------- | --------------------------------------------------------- |
| **2.1 全栈框架**       | □ Next.js<br>□ Nuxt<br>□ SvelteKit<br>□ Remix<br>□ Django |
| **2.2 如果选 Next.js** | □ App Router<br>□ Pages Router                            |
| **2.3 渲染模式**       | □ SSR<br>□ SSG<br>□ ISR<br>□ 混合                         |
| **2.4 数据库位置**     | □ Serverless/云<br>□ 自托管<br>□ SQLite                   |
| **2.5 ORM**            | □ Drizzle<br>□ Prisma<br>□ TypeORM<br>□ 原生 SQL          |
| **2.6 认证方案**       | □ NextAuth.js/Auth.js<br>□ Clerk<br>□ Lucia<br>□ 自建 JWT |
| **2.7 部署平台**       | □ Vercel<br>□ Netlify<br>□ Railway<br>□ 自托管            |
| **2.8 包管理器**       | □ pnpm<br>□ npm<br>□ yarn<br>□ bun                        |
| **2.9 项目名称**       | 输入：**\_\_\_\_**                                        |

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
```

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
