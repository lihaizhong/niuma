# Niuma (牛马) - 项目上下文

## 项目概述

**Niuma（牛马）** 是一个智能生活助手 CLI 应用，已进入 MVP 开发阶段。项目的核心理念是打造一个不仅具备工具属性，更能提供"陪伴感"和"情绪价值"的智能精灵。

### 核心定位

| 维度 | 描述 |
|------|------|
| **名称** | Niuma（牛马） |
| **角色** | 智能精灵 + 陪伴者 |
| **当前形态** | CLI（命令行界面） ✅ 已实现 |
| **当前版本** | 0.1.0 |
| **未来扩展** | 桌面端 / Web 端 |
| **技术栈** | TypeScript / Node.js |
| **LLM 接口** | iFlow SDK / OpenAI 兼容 API |
| **向量存储** | SQLite + sqlite-vec ✅ 已集成 |
| **性格特质** | 温暖、懂你、适时出现、提供情绪价值 |

### 技术决策记录

| 日期 | 决策 | 理由 |
|------|------|------|
| 2026-03-01 | 采用 sqlite-vec 作为向量存储 | TypeScript 原生支持，架构精简，无需 Python 桥接 |
| 2026-03-01 | 放弃 Zvec/OpenViking | 虽功能强大，但需 Python 桥接，增加架构复杂度 |
| 2026-03-03 | 使用高德 API 天气服务 | 国内定位准确，免费额度充足 |
| 2026-03-03 | 采用 node-cron 定时调度 | 简洁可靠，支持 cron 表达式 |

---

## 目录结构

```
niuma/
├── .iflow/                    # iFlow CLI 配置目录
│   ├── commands/              # 自定义命令
│   │   ├── opsx-apply.md
│   │   ├── opsx-archive.md
│   │   ├── opsx-explore.md
│   │   └── opsx-propose.md
│   └── skills/                # 自定义技能
│       ├── openspec-apply-change/
│       ├── openspec-archive-change/
│       ├── openspec-explore/
│       └── openspec-propose/
├── docs/                      # 项目文档
│   ├── brainstorming-session.md     # 产品设计头脑风暴
│   ├── ai-tools-research-report.md  # AI 工具生态研究报告
│   ├── sqlite-vec-research.md       # sqlite-vec 研究 ✅ 已采纳
│   ├── openviking-research.md       # OpenViking 研究
│   └── zvec-research.md             # Zvec 研究
├── openspec/                  # OpenSpec 变更管理
│   ├── config.yaml            # OpenSpec 配置
│   ├── changes/               # 变更记录
│   │   └── archive/           # 已归档变更
│   └── specs/                 # 规格文档
├── src/                       # 源代码
│   ├── index.ts               # CLI 入口
│   ├── commands/              # 命令模块（预留）
│   ├── core/                  # 核心模块
│   │   ├── daemon.ts          # 守护进程
│   │   ├── memory-store.ts    # 记忆存储
│   │   ├── repl.ts            # 交互式命令行
│   │   └── scheduler.ts       # 定时调度器
│   ├── services/              # 服务模块
│   │   ├── llm-service.ts     # 大模型服务
│   │   ├── todo-service.ts    # 待办服务
│   │   └── weather-service.ts # 天气服务
│   ├── types/                 # 类型定义
│   │   ├── memory.ts          # 记忆类型
│   │   └── todo.ts            # 待办类型
│   └── utils/                 # 工具函数
├── memory_data/               # 记忆数据存储（待使用）
├── dist/                      # 编译输出
├── package.json               # 项目配置
├── tsconfig.json              # TypeScript 配置
└── AGENTS.md                  # 本文件 - 项目上下文
```

---

## 技术架构

### 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLI 入口 (index.ts)                        │
│                    使用 cac 解析命令行参数                         │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NiumaDaemon (daemon.ts)                     │
│                         后台守护进程                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Scheduler  │  │    REPL     │  │      Services          │  │
│  │ (定时调度)  │  │ (交互界面)  │  │ LLM / Todo / Weather   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      数据存储层                                   │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │   SQLite (better-sqlite3)  │  │   sqlite-vec (向量检索)     │ │
│  │   ├── todos.db       │  │   └── memory_embeddings      │ │
│  │   └── memory.db      │  │                               │ │
│  └──────────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 核心模块

| 模块 | 文件 | 职责 |
|------|------|------|
| **CLI 入口** | `src/index.ts` | 命令行参数解析、程序启动 |
| **守护进程** | `src/core/daemon.ts` | 服务初始化、生命周期管理 |
| **交互界面** | `src/core/repl.ts` | REPL 命令处理、用户交互 |
| **定时调度** | `src/core/scheduler.ts` | 早安/晚间流程、定时提醒 |
| **记忆存储** | `src/core/memory-store.ts` | 记忆 CRUD、向量检索 |
| **大模型服务** | `src/services/llm-service.ts` | LLM API 调用、对话管理 |
| **待办服务** | `src/services/todo-service.ts` | Todo CRUD、统计查询 |
| **天气服务** | `src/services/weather-service.ts` | 高德天气 API、问候生成 |

### 数据模型

#### Todo（待办事项）

```typescript
interface Todo {
  id: string;              // nanoid 生成
  title: string;           // 标题
  description?: string;    // 描述
  status: TodoStatus;      // pending | in_progress | completed | cancelled
  priority: TodoPriority;  // low | medium | high
  dueDate?: Date;          // 截止日期
  tags?: string[];         // 标签
  createdAt: Date;         // 创建时间
  updatedAt?: Date;        // 更新时间
  completedAt?: Date;      // 完成时间
}
```

#### Memory（记忆）

```typescript
interface Memory {
  id: string;              // nanoid 生成
  content: string;         // 记忆内容
  embedding?: Float32Array; // 向量嵌入
  metadata: MemoryMetadata; // 元数据
  createdAt: Date;         // 创建时间
  updatedAt?: Date;        // 更新时间
}

interface MemoryMetadata {
  type: MemoryType;        // preference | experience | knowledge | task | conversation | short_term | long_term
  agent?: string;          // 来源 Agent
  tags?: string[];         // 标签
  importance?: number;     // 重要度 1-10
  source?: string;         // 来源
}
```

---

## CLI 使用指南

### 安装与构建

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build

# 运行生产版本
npm start
```

### 命令行命令

```bash
# 启动守护进程（默认命令）
niuma

# 启动守护进程（可配置定时任务）
niuma start --morning "0 7 * * *" --evening "0 22 * * *"

# 显示帮助
niuma help
niuma -h
niuma --help

# 显示版本
niuma -v
niuma --version
```

### 交互式命令

启动后可在 REPL 中使用以下命令：

#### 任务管理

| 命令 | 说明 |
|------|------|
| `/add <title> [-p high\|medium\|low]` | 添加待办任务 |
| `/done <id\|index>` | 完成任务 |
| `/rm <id\|index>` | 删除任务 |
| `/todos [-a]` | 查看任务列表（-a 显示所有） |

#### 记忆管理

| 命令 | 说明 |
|------|------|
| `/remember <content>` | 保存记忆 |
| `/recall <keyword>` | 搜索记忆（需向量嵌入支持） |

#### 日常流程

| 命令 | 说明 |
|------|------|
| `/morning` | 手动触发早安流程 |
| `/evening` | 手动触发晚间复盘 |
| `/weather` | 查看天气 |

#### 系统命令

| 命令 | 说明 |
|------|------|
| `/status` | 查看当前状态 |
| `/clear` | 清除对话历史 |
| `/help` | 显示帮助信息 |
| `/exit` `/quit` | 退出程序 |

#### 聊天功能

直接输入任意内容即可与大模型对话。

### 环境变量配置

| 变量名 | 说明 | 优先级 |
|--------|------|--------|
| `IFLOW_API_KEY` | iFlow API Key | 优先 |
| `IFLOW_BASE_URL` | iFlow API 地址 | 可选 |
| `IFLOW_MODEL` | 模型名称（默认 glm-4-flash） | 可选 |
| `LLM_API_KEY` | 通用 LLM API Key | 备选 |
| `LLM_BASE_URL` | 通用 LLM API 地址 | 可选 |
| `LLM_MODEL` | 模型名称 | 可选 |
| `AMAP_API_KEY` | 高德地图 API Key（天气服务） | 可选 |

### 数据存储位置

所有数据存储在用户目录下的 `.niuma` 文件夹：

```
~/.niuma/
├── memory.db    # 记忆数据库
└── todos.db     # 待办数据库
```

---

## 依赖项

### 生产依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `@clack/prompts` | ^1.0.1 | 终端交互提示 |
| `better-sqlite3` | ^12.6.2 | SQLite 数据库 |
| `boxen` | ^8.0.1 | 终端框线输出 |
| `cac` | ^7.0.0 | CLI 参数解析 |
| `chalk` | ^5.6.2 | 终端颜色输出 |
| `date-fns` | ^4.1.0 | 日期处理 |
| `dotenv` | ^17.3.1 | 环境变量加载 |
| `nanoid` | ^5.1.6 | ID 生成 |
| `node-cron` | ^4.2.1 | 定时任务调度 |
| `node-notifier` | ^10.0.1 | 系统通知 |
| `ora` | ^9.3.0 | 终端加载动画 |
| `sqlite-vec` | 0.1.7-alpha.10 | 向量检索扩展 |
| `zod` | ^4.3.6 | 数据验证 |

### 开发依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `@types/better-sqlite3` | ^7.6.13 | SQLite 类型定义 |
| `@types/node` | ^25.3.3 | Node.js 类型定义 |
| `@types/node-cron` | ^3.0.11 | node-cron 类型定义 |
| `tsx` | ^4.21.0 | TypeScript 执行器 |
| `typescript` | ^5.9.3 | TypeScript 编译器 |
| `vitest` | ^4.0.18 | 测试框架 |

---

## 日循环陪伴机制

### 定时任务

| 任务 | 默认时间 | 说明 |
|------|----------|------|
| 早安问候 | 07:00 | 天气 + 待办 + 提醒 |
| 晚间复盘 | 22:00 | 成果回顾 + 计划制定 |
| 定时提醒 | 每2小时 | 高优先级任务提醒 |

### 早安流程内容

1. 时间问候语
2. 天气预报与建议
3. 今日待办统计
4. 优先任务展示

### 晚间流程内容

1. 今日成果统计
2. 已完成任务展示
3. 剩余任务提醒
4. 休息建议

---

## 安全边界策略

| 区域 | 自主性 | 说明 |
|------|--------|------|
| ✅ 用户目录 | 完全自动 | 整理文件、归档项目、清理缓存 |
| ⚠️ 系统文件 | 必须确认 | 修改系统配置、访问系统目录 |
| ⚠️ 敏感信息 | 必须确认 | 访问密码管理器、处理账号密码 |

---

## 开发路线

### ✅ MVP 阶段（Q1-Q2 2026）- 已完成基础功能

- [x] CLI 基础框架搭建
- [x] OpenAI 兼容 API 集成（LLM 服务）
- [x] 早安/晚间流程实现
- [x] 基础 TodoList 管理
- [x] 天气查询集成（高德 API）
- [x] 记忆系统基础（sqlite-vec）
- [x] REPL 交互界面
- [x] 定时任务调度

### 🚧 MVP 阶段 - 进行中

- [ ] 向量嵌入集成（记忆语义搜索）
- [ ] 系统通知提醒
- [ ] 测试用例编写
- [ ] 文档完善

### 近期规划（Q3-Q4 2026）

- [ ] Obsidian 笔记库联动
- [ ] 目标追踪系统
- [ ] 学习路径规划
- [ ] 多 Agent 架构
- [ ] 桌面端原型

### 未来规划（2027+）

- [ ] Web 端扩展
- [ ] 多端同步
- [ ] 情绪识别与响应
- [ ] 多模态交互（语音、图像）

---

## 关键文档

### 设计文档

| 文档 | 说明 |
|------|------|
| [产品设计头脑风暴](docs/brainstorming-session.md) | 完整的产品设计头脑风暴记录 |
| [AI 工具生态研究报告](docs/ai-tools-research-report.md) | AI 辅助工具生态全景研究成果 |

### 技术研究

| 文档 | 说明 |
|------|------|
| [sqlite-vec 研究](docs/sqlite-vec-research.md) | 向量存储方案选型研究 ✅ 已采纳 |
| [OpenViking 研究](docs/openviking-research.md) | 上下文数据库调研 |
| [Zvec 研究](docs/zvec-research.md) | 嵌入式向量数据库调研 |

---

## 开发规范

### 代码风格

- 使用 TypeScript 严格模式
- 使用 ES Modules（type: "module"）
- 文件使用 `.js` 扩展名的 import 语句
- 异步操作使用 async/await
- 错误处理使用 try-catch

### 命名约定

- 文件名：kebab-case（如 `memory-store.ts`）
- 类名：PascalCase（如 `NiumaDaemon`）
- 函数/变量：camelCase（如 `generateMorningMessage`）
- 常量：UPPER_SNAKE_CASE 或 camelCase
- 私有方法：前缀 `_` 或 `private` 修饰符

### 提交规范

使用 Conventional Commits：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具相关

---

## 许可证

本项目采用 [Apache License 2.0](LICENSE) 许可证。

---

*最后更新：2026-03-03*
