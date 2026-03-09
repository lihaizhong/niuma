## Context

Niuma 正在复写 nanobot 的核心基础设施。nanobot 是一个约 3500 行 Python 的轻量级 AI 助手，采用以下关键模式：

1. **Tool System**: 抽象基类 + Registry 模式
2. **Provider Registry**: 两步式注册（spec + config field）
3. **Memory System**: 双层记忆（MEMORY.md + HISTORY.md）
4. **Agent Loop**: LLM 调用 ↔ 工具执行循环

当前 `niuma/` 目录为空，需要从零搭建 TypeScript 版本的基础设施。

## Goals / Non-Goals

**Goals:**
- 定义核心类型系统（Message、Tool、LLM 响应等）
- 实现配置系统（Schema 验证 + 多源合并）
- 实现工具框架（基类 + 注册表 + Schema 生成）
- 实现事件总线（EventEmitter + 类型安全）

**Non-Goals:**
- 不实现 Agent 循环逻辑
- 不实现具体工具（filesystem、shell 等）
- 不实现 LLM 提供商
- 不实现会话持久化

## Decisions

### D1: 类型定义按领域模块化

**决定**: `niuma/types/` 下按领域拆分文件，通过 `index.ts` 统一导出

**文件结构**:
```
niuma/types/
├── index.ts      # 统一导出
├── message.ts    # InboundMessage, OutboundMessage, MediaContent
├── tool.ts       # ToolCall, ToolResult, ToolDefinition
├── llm.ts        # LLMResponse, LLMConfig, ChatMessage
├── events.ts     # EventType, EventMap
└── error.ts      # NiumaError, ToolExecutionError, ConfigError
```

**理由**:
- 每个文件职责单一，便于维护
- 按领域组织，查找直观
- index.ts 统一导出，外部使用无感知
- 便于跨模块引用，避免循环依赖

**替代方案**: 单文件集中定义 → 拒绝，文件会过大且职责混乱

### D2: 配置使用 zod 验证

**决定**: 使用 zod 定义配置 Schema，运行时验证

**理由**:
- nanobot 使用 Pydantic，zod 是 TypeScript 等价物
- 支持类型推导，避免手动维护两份定义
- 支持复杂的条件验证和默认值

### D3: 工具基类使用抽象类模式

**决定**: `BaseTool` 抽象类 + `SimpleTool` 函数式实现

**理由**:
- nanobot 使用 Python 抽象类，TypeScript 可用 abstract class 实现
- 提供默认方法（validateArgs、success、failure）
- SimpleTool 允许函数式定义，更灵活

### D4: 事件系统简单封装

**决定**: 基于 EventEmitter 做简单封装，提供类型定义 + 单例实例 + 辅助函数

**理由**:
- Node.js 原生支持，无需额外依赖
- 模块级单例确保全局唯一
- EventMap 提供类型安全
- 辅助函数简化事件创建

**实现**:
```typescript
// niuma/types/events.ts - 类型定义
export type EventType = 
  | 'MESSAGE_RECEIVED' | 'MESSAGE_SENT' 
  | 'TOOL_CALL_START' | 'TOOL_CALL_END'
  | 'LLM_REQUEST_START' | 'LLM_RESPONSE' 
  | 'ERROR' | 'HEARTBEAT'

export interface EventMap {
  MESSAGE_RECEIVED: { message: InboundMessage }
  MESSAGE_SENT: { message: OutboundMessage }
  TOOL_CALL_START: { toolName: string; args: unknown }
  TOOL_CALL_END: { toolName: string; result: unknown; success: boolean }
  // ...
}

// niuma/bus/events.ts - 单例 + 辅助函数
import { EventEmitter } from 'events'
import type { EventType, EventMap } from '../types/events'

export const bus = new EventEmitter()

export function emit<K extends EventType>(
  type: K, 
  data: EventMap[K]
): void {
  bus.emit(type, { ...data, timestamp: Date.now() })
}

export function on<K extends EventType>(
  type: K, 
  handler: (data: EventMap[K]) => void
): void {
  bus.on(type, handler)
}
```

## Architecture

```
niuma/
├── types/
│   ├── index.ts          # 统一导出
│   ├── message.ts        # InboundMessage, OutboundMessage
│   ├── tool.ts           # ToolCall, ToolResult, ToolDefinition
│   ├── llm.ts            # LLMResponse, LLMConfig, ChatMessage
│   ├── events.ts         # EventType, EventMap
│   └── error.ts          # NiumaError, ToolExecutionError, ConfigError
│
├── config/
│   ├── schema.ts         # zod Schema 定义
│   └── loader.ts         # ConfigLoader 类
│
├── agent/tools/
│   ├── base.ts           # BaseTool + SimpleTool
│   └── registry.ts       # ToolRegistry
│
└── bus/
    ├── index.ts          # 统一导出 events 和 queue
    ├── events.ts         # EventEmitter 单例 + emit/on 辅助函数
    └── queue.ts          # AsyncQueue 消息缓冲
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 类型定义过于复杂 | 只定义核心类型，避免过度设计 |
| zod 验证影响性能 | 配置只在启动时加载一次 |
| EventEmitter 无类型安全 | 类型定义在 types/events.ts，配合泛型使用 |
| 工具 Schema 生成不完整 | 参考 OpenAI/Anthropic 规范，添加测试 |

## Open Questions

- [ ] 是否需要支持配置热重载？→ 暂不需要，启动时加载一次即可
- [ ] 是否需要工具权限控制？→ Phase 3 实现 Shell 工具时再考虑
