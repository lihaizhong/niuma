# Agent 核心模块

**Parent:** [../../AGENTS.md](../../AGENTS.md)

## OVERVIEW

Agent 核心模块 - 对话循环、上下文构建、记忆管理、技能系统、子 Agent、工具执行、审批流程、验证循环。

## STRUCTURE

```
niuma/agent/
├── loop.ts                 # AgentLoop - 核心对话循环
├── context.ts              # ContextBuilder - 上下文构建器
├── memory.ts               # MemoryManager - 双层记忆系统
├── skills.ts               # 技能系统加载器
├── tools/                  # 工具集
│   ├── index.ts            #   工具注册表
│   ├── file-system.ts      #   文件操作工具
│   ├── shell.ts            #   Shell 命令工具
│   ├── web.ts              #   Web 搜索/获取工具
│   ├── git.ts              #   Git 操作工具
│   ├── crypto.ts           #   加密解密工具
│   ├── network.ts          #   网络工具
│   ├── data.ts             #   数据处理工具
│   ├── system.ts           #   系统工具
│   └── spawn.ts            #   子 Agent 工具
├── subagent/               # 子 Agent 管理
│   ├── manager.ts          #   SubagentManager
│   ├── executor.ts         #   子 Agent 执行器
│   └── types.ts            #   类型定义
├── sandbox/                # 沙箱执行
│   ├── manager.ts          #   SandboxManager
│   ├── container.ts        #   容器管理
│   ├── providers/          #   沙箱提供商
│   └── types.ts            #   类型定义
├── approval/               # 审批系统
│   ├── detector.ts         #   危险操作检测
│   └── request.ts          #   审批请求管理
├── verification/           # 验证循环
│   └── loop.ts             #   自验证循环
├── ralph/                  # Ralph Loop (自引用开发)
│   ├── index.ts            #   Ralph 控制器
│   └── checkpoint.ts       #   检查点管理
├── init-exec/              # 初始化执行
│   ├── initializer.ts      #   项目初始化
│   └── executor.ts         #   执行器
├── task-tracker/           # 任务跟踪
│   ├── store.ts            #   任务存储
│   └── index.ts            #   任务管理
├── compaction/             # 上下文压缩
├── rules/                  # 规则系统
└── AGENTS.md               # 本文件
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Agent 启动 | `loop.ts` | AgentLoop.run() |
| 上下文构建 | `context.ts` | build() 方法 |
| 记忆管理 | `memory.ts` | load/save 记忆 |
| 技能加载 | `skills.ts` | 动态 SKILL.md 加载 |
| 工具注册 | `tools/index.ts` | ToolRegistry |
| 子 Agent | `subagent/` | spawn 工具 |
| 沙箱执行 | `sandbox/` | Docker 容器 |
| 审批流程 | `approval/` | 危险操作确认 |
| 自验证 | `verification/` | 错误注入验证 |
| Ralph Loop | `ralph/` | 自引用开发 |

## CORE PATTERNS

### Agent Loop
```typescript
// LLM ↔ Tool 循环
while (iterations < maxIterations) {
  const response = await llm.call(context);
  if (hasToolCalls(response)) {
    const results = await executeTools(response.tools);
    context.addResults(results);
  } else {
    return response.content;
  }
}
```

### Tool Registration
```typescript
// 1. 定义 ToolSpec
// 2. 实现 BaseTool 子类
// 3. ToolRegistry.register(tool)
```

### Memory System
```
HISTORY.md  →  近期对话历史（可搜索）
MEMORY.md   →  长期记忆（自动整合）
```

### Subagent Spawn
```typescript
// spawn 工具创建子 Agent
{
  category: "deep",
  load_skills: [],
  description: "...",
  prompt: "..."
}
```

## ANTI-PATTERNS

| Pattern | Rule |
|---------|------|
| 直接操作文件系统 | 使用 file-system 工具 |
| 同步执行长时间任务 | 使用 subagent 异步执行 |
| 忽略 tool_call 错误 | 必须处理并报告 |
| 在 loop 中修改上下文 | 通过 context.addXXX 方法 |

## NOTES

- **上下文限制:** 由 compaction/ 模块管理压缩
- **安全检查:** approval/ 在危险操作前拦截
- **调试:** showReasoning 参数显示思考过程
- **隔离:** 每个 Agent 工作区完全独立