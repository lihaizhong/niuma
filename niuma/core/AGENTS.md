# Core - Agent 核心模块

**Scope:** `niuma/core/` — DeepAgent 架构核心实现

## OVERVIEW

Agent 核心模块实现 DeepAgent 模式：纯函数 + 依赖注入 + 组合优于继承。核心仅 2 个文件 + 类型定义。

**Key Files:**
- `agent.ts` (67 lines) — Agent 工厂函数
- `loop.ts` (84 lines) — LLM ↔ Tool 循环
- `types.ts` (257 lines) — 核心类型定义

## STRUCTURE

```
core/
├── index.ts              # Barrel 导出
├── agent.ts              # createAgent() 工厂
├── loop.ts               # runLoop() 核心循环
├── types.ts              # AgentContext, AgentState, LLMProvider 等
├── slash-handler.ts      # 斜杠命令处理
└── provider-manager.ts   # Provider 管理
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| 创建 Agent | `agent.ts:17` | `createAgent(options)` 工厂 |
| Agent 循环 | `loop.ts:6` | `runLoop(ctx, state)` 纯函数 |
| 状态定义 | `types.ts:11` | `AgentState` 接口 |
| 上下文定义 | `types.ts:56` | `AgentContext` 依赖注入 |
| Provider 接口 | `types.ts:94` | `LLMProvider` 抽象 |
| 进度回调 | `types.ts:39` | `ProgressEvent` 类型 |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| createAgent | function | `agent.ts:17` | Agent 工厂，返回 Agent 对象 |
| Agent | interface | `agent.ts:11` | Agent 公共接口 |
| runLoop | function | `loop.ts:6` | 核心循环：LLM 调用 → Tool 执行 |
| AgentContext | interface | `types.ts:56` | 依赖注入上下文 |
| AgentState | interface | `types.ts:11` | 状态快照（messages, iteration, halted） |
| LLMProvider | interface | `types.ts:94` | LLM 提供商抽象 |
| ToolRegistry | interface | `types.ts:204` | 工具注册表接口 |

## CONVENTIONS

### Agent 创建模式
```typescript
const agent = createAgent({
  provider: new OpenAIProvider({ model: "gpt-4o" }),
  tools: new ToolRegistry(),
  maxIterations: 40,
  temperature: 0.7,
  onProgress: (event) => console.log(event.type),
});
```

### 循环执行流程
1. **iteration** — 迭代开始事件
2. **llm_call** — 调用 LLM
3. **llm_response** — 接收响应
4. **tool_start** — 开始执行工具（如果有 toolCalls）
5. **tool_result** — 工具执行完成
6. **complete** — 循环结束

### 状态管理
- `AgentState` 是可变对象，但每次 `chat()` 调用会重置
- 状态在 `runLoop` 中直接修改（性能优化）
- 通过 `agent.getState()` 获取状态快照

## ANTI-PATTERNS

| Pattern | Status | Rule |
|---------|--------|------|
| 修改 loop.ts 添加新事件类型 | ⚠️ WARNING | 需同步更新 `ProgressEvent` 类型 |
| 在 loop 中使用 console.log | 🚫 FORBIDDEN | 使用 `onProgress` 回调 |
| 直接修改 state.messages | ⚠️ WARNING | 通过 `chat()` 重置更安全 |

## PATTERNS

### 添加新进度事件类型
1. 在 `types.ts:27` 添加新的 `ProgressEventType`
2. 在 `types.ts:39` 扩展 `ProgressEvent` 接口
3. 在 `loop.ts` 中触发事件

### 自定义 Provider
实现 `LLMProvider` 接口：
```typescript
class MyProvider implements LLMProvider {
  readonly name = "my-provider";
  async chat(options: ChatOptions): Promise<LLMResponse> { ... }
  getDefaultModel(): string { return "my-model"; }
}
```

## NOTES

- **文件大小:** 单文件最大 84 行（loop.ts），极致简洁
- **测试覆盖:** 8 个集成测试在 `__tests__/agent.test.ts`
- **流式支持:** `chatStream()` 已预留接口（未实现）
