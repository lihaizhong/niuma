# Niuma（牛马）- AI 助手行为指南

**Generated:** 2026-03-25T03:45:00Z  
**Commit:** a4411c0  
**Branch:** main

## OVERVIEW

Niuma（牛马）- 企业级多角色 AI 助手 CLI 工具，TypeScript + Node.js 构建。基于 DeepAgent 模式重写，代码量减少 93%（34,036 → 2,518 行）。

**Inspiration:** [nanobot](https://github.com/HKUDS/nanobot)  
**Tech Stack:** TypeScript 5.9+, Node.js >=22, LangChain, Zod, Vitest

## STRUCTURE

```
niuma/                          # 新 DeepAgent 架构（~2.5k LOC）
├── index.ts                    # 主入口 - Barrel 导出
├── core/                       # Agent 核心（loop, types）
├── providers/                  # LLM 提供商（8 个）
├── tools/                      # 内置工具（11 个）
├── types/                      # 统一类型定义
├── channels/                   # 多渠道接入
├── config/                     # 配置管理
└── __tests__/                  # 测试（Vitest）

niuma-backup/                   # 旧架构备份（~88k LOC）
└── [已归档，不再维护]
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Agent 创建 | `niuma/core/agent.ts` | `createAgent()` 工厂函数 |
| Agent 循环 | `niuma/core/loop.ts` | `runLoop()` 核心循环，84 行 |
| 工具注册 | `niuma/tools/registry.ts` | `ToolRegistry` 类 |
| 提供商注册 | `niuma/providers/registry.ts` | `ProviderRegistry` 类 |
| 类型定义 | `niuma/types/*.ts` | 统一导出 |
| 配置文件 | `niuma/config/manager.ts` | `ConfigManager` 类 |
| 测试 | `niuma/__tests__/*.ts` | 集成测试 |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| createAgent | function | `core/agent.ts` | Agent 工厂 |
| runLoop | function | `core/loop.ts` | LLM ↔ Tool 循环 |
| ToolRegistry | class | `tools/registry.ts` | 工具注册表 |
| ProviderRegistry | class | `providers/registry.ts` | 提供商注册表 |
| LLMProvider | interface | `providers/base.ts` | 提供商抽象 |
| ConfigManager | class | `config/manager.ts` | 配置管理 |

## CONVENTIONS

### Code Style
- **ES Modules** only (`"type": "module"`)
- **TypeScript** strict mode, ES2022
- **Comments:** Chinese | **Identifiers:** English
- **Async/await** over Promise chains
- Prefer **composition** over inheritance
- **Type imports** must use `import type` syntax

### Import Order
```typescript
// 1. Node.js 内置
import { readFile } from "fs";

// 2. 第三方库
import { z } from "zod";

// 3. 父级相对导入
import type { LLMProvider } from "../providers/base";

// 4. 同级相对导入
import { runLoop } from "./loop";
```

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
| 跳过 Red 阶段（新功能） | 🚫 FORBIDDEN | TDD 强制要求 |
| 使用 `as any` | ⚠️ WARNING | 必须添加注释说明原因 |
| 未使用下划线前缀 | ⚠️ WARNING | 未使用参数必须以 `_` 开头 |

## UNIQUE STYLES

### DeepAgent 架构
- **纯函数设计** - `createAgent()`, `runLoop()` 无类继承
- **依赖注入** - 通过 `AgentContext` 注入依赖
- **函数式组合** - 无全局状态，易于测试

### Tool Pattern
```typescript
export const myTool: ToolSpec<{ param: string }> = {
  name: "my_tool",
  description: "Tool description",
  parameters: z.object({ param: z.string() }),
  async execute({ param }) {
    return result;
  },
};
```

### OpenSpec Workflow
- `/opsx:explore` → `/opsx:propose` → `/opsx:apply` → `/opsx:archive`
- 禁止手动 mv/cp openspec 文件

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

## SUBDIRECTORY KNOWLEDGE BASES

- [core/](niuma/core/AGENTS.md) - Agent 核心模块（DeepAgent 架构）
- [providers/](niuma/providers/AGENTS.md) - LLM 提供商（8 个实现）
- [tools/](niuma/tools/AGENTS.md) - 内置工具系统（11 个工具）

## NOTES

- **新架构特点:** 单文件最大 258 行（原 1,605 行），更易维护
- **测试覆盖:** 32 个测试通过（Vitest）
- **类型安全:** 0 TypeScript 错误
- **代码风格:** 0 ESLint 错误（16 个 any 警告在测试中）

---

> 完整技术规范详见 `openspec/config.yaml`
