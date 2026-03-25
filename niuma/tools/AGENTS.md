# Tools - 内置工具系统

**Scope:** `niuma/tools/` — 11 个内置工具 + 注册表

## OVERVIEW

Zod-based 工具系统，类型安全 + 运行时验证。基于 nanobot 模式但简化实现。

**Architecture:** ToolSpec 接口 + ToolRegistry 类 + 具体工具实现

## STRUCTURE

```
tools/
├── index.ts              # Barrel 导出（所有工具）
├── registry.ts           # ToolRegistry 类
├── types.ts              # ToolSpec, ToolContext 类型
├── filesystem.ts         # 文件操作工具（3 个）
├── shell.ts              # Shell 执行工具
├── web.ts                # Web 搜索/抓取工具（2 个）
├── git.ts                # Git 操作工具（2 个）
├── crypto.ts             # 加密工具
├── network.ts            # HTTP 请求工具
├── data.ts               # JSON/YAML 处理（2 个）
└── system.ts             # 系统工具（2 个）
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| 工具注册表 | `registry.ts:4` | `ToolRegistry` 类 |
| 工具类型定义 | `types.ts:7` | `ToolSpec<T>` 泛型接口 |
| 添加新工具 | `*.ts` 复制模板 | 实现 `ToolSpec<T>` 接口 |
| 查看所有工具 | `index.ts` | 统一导出 |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| ToolRegistry | class | `registry.ts:4` | 工具注册和执行 |
| ToolSpec | interface | `types.ts:7` | 工具规范接口 |
| ToolContext | interface | `types.ts:14` | 工具执行上下文 |
| readFileTool | ToolSpec | `filesystem.ts` | 读取文件 |
| writeFileTool | ToolSpec | `filesystem.ts` | 写入文件 |
| listDirectoryTool | ToolSpec | `filesystem.ts` | 列出目录 |
| shellTool | ToolSpec | `shell.ts` | Shell 执行 |
| webSearchTool | ToolSpec | `web.ts` | 网页搜索 |
| webFetchTool | ToolSpec | `web.ts` | 网页抓取 |
| gitStatusTool | ToolSpec | `git.ts` | Git 状态 |
| gitLogTool | ToolSpec | `git.ts` | Git 日志 |
| hashTool | ToolSpec | `crypto.ts` | 哈希计算 |
| fetchTool | ToolSpec | `network.ts` | HTTP 请求 |
| parseJsonTool | ToolSpec | `data.ts` | JSON 解析 |
| stringifyJsonTool | ToolSpec | `data.ts` | JSON 序列化 |
| getEnvTool | ToolSpec | `system.ts` | 获取环境变量 |
| getCwdTool | ToolSpec | `system.ts` | 获取当前目录 |

## CONVENTIONS

### 创建新工具

```typescript
import { z } from "zod";
import type { ToolSpec } from "./types";

export const myTool: ToolSpec<{ param: string }> = {
  name: "my_tool",           // snake_case
  description: "工具功能描述", // 清晰描述
  parameters: z.object({
    param: z.string().describe("参数说明"),
  }),
  async execute({ param }, context) {
    // context.cwd, context.env, context.agentId
    return result;  // 必须返回 string
  },
};
```

### 注册工具
```typescript
const tools = new ToolRegistry();
tools.register(myTool);

// LLM 调用时自动获取工具定义
const definitions = tools.getDefinitions();

// 执行工具调用
const result = await tools.execute("my_tool", { param: "value" });
```

### 工具命名
- 使用 `snake_case`
- 以功能域为前缀：`git_*`, `web_*`, `file_*`

## ANTI-PATTERNS

| Pattern | Status | Rule |
|---------|--------|------|
| 返回非字符串 | 🚫 FORBIDDEN | 必须 `return string` |
| 抛出原始错误 | ⚠️ WARNING | 包装为有意义的消息 |
| 忽略 context | ⚠️ WARNING | 使用 `context.cwd` 处理路径 |
| 不添加 describe | ⚠️ WARNING | Zod schema 必须带 describe |

## PATTERNS

### 参数验证
```typescript
parameters: z.object({
  url: z.string().url(),           // URL 验证
  method: z.enum(["GET", "POST"]), // 枚举值
  timeout: z.number().optional(),  // 可选参数
}).describe("工具参数说明");
```

### 错误处理
```typescript
async execute({ input }) {
  try {
    const result = await doSomething(input);
    return JSON.stringify(result);
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}
```

### 使用 Context
```typescript
async execute({ filename }, context) {
  const filepath = path.resolve(context.cwd, filename);
  // 安全的路径解析
}
```

## NOTES

- **工具数量:** 11 个内置工具
- **文件大小:** 单工具平均 15-50 行，简洁实现
- **测试覆盖:** 集成测试在 `__tests__/tools.test.ts`
- **安全:** Shell 工具有危险命令黑名单

## TOOL LIST

| Category | Tools | Files |
|----------|-------|-------|
| Filesystem | read, write, list | `filesystem.ts` |
| Shell | exec | `shell.ts` |
| Web | search, fetch | `web.ts` |
| Git | status, log | `git.ts` |
| Crypto | hash | `crypto.ts` |
| Network | http request | `network.ts` |
| Data | json parse/stringify | `data.ts` |
| System | env, cwd | `system.ts` |
