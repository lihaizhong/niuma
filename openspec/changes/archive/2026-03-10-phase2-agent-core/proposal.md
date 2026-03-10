## Why

当前 Niuma 项目已完成 Phase 1 核心基础设施（类型系统、配置管理、工具框架、事件总线），但缺乏智能体核心逻辑。无法进行 LLM 对话、记忆管理、技能加载等核心功能。Phase 2 将实现 Agent 核心，使 Niuma 真正具备 AI 助手能力。

## What Changes

### 新增模块

- **agent/context.ts** - 上下文构建器，组装 System Prompt 和消息历史
- **agent/memory.ts** - 双层记忆系统（MEMORY.md + HISTORY.md），支持 LLM 整合
- **agent/skills.ts** - 技能系统，解析 SKILL.md 并按需加载
- **agent/loop.ts** - Agent 循环，LLM ↔ 工具执行核心流程
- **agent/subagent.ts** - 子智能体管理，后台任务执行
- **session/manager.ts** - 会话管理，历史记录与状态持久化（从 Phase 5 提前）
- **providers/base.ts** - LLM 提供商抽象接口
- **providers/openai.ts** - OpenAI 提供商实现（从 Phase 4 提前最小化实现）

### 功能特性

- 流式响应支持
- LLM 调用失败指数退避重试（最多 4 次）
- 工具执行失败继续循环策略
- 推理内容（reasoning_content）支持，可配置展示/隐藏
- 混合进度通知策略（CLI 分组批量优先）
- MCP 协议接口预留

## Capabilities

### New Capabilities

- `agent-context`: System Prompt 构建、消息历史组装、媒体内容处理
- `agent-memory`: 双层记忆系统、LLM 驱动的记忆整合
- `agent-skills`: 技能加载器、依赖检查、按需加载
- `agent-loop`: Agent 循环、工具执行、迭代控制
- `agent-subagent`: 子智能体管理、后台任务执行
- `session-manager`: 会话状态管理、历史记录持久化
- `llm-provider`: LLM 提供商抽象层、OpenAI 实现

### Modified Capabilities

（无 - Phase 2 为全新模块，不影响现有 spec）

## Impact

### 代码影响

- 新增 8 个核心模块文件
- `types/index.ts` 可能需要扩展（reasoning_content 支持）
- `types/llm.ts` 需要补充 Provider 相关类型

### 依赖影响

- 新增 `@langchain/openai` 依赖（OpenAI Provider 实现）
- 可能需要 `@langchain/anthropic`（如需 Anthropic 支持）

### API 影响

- 暂无公开 API 变更（内部模块）

### 兼容性

- 与 Phase 1 实现完全兼容
- 为 Phase 3（内置工具）和后续 Phase 打下基础

## Non-goals

- 本 Phase 不实现多渠道接入（Phase 6）
- 不实现完整 Provider 系统（仅 OpenAI 最小化实现）
- 不实现向量检索记忆（后续扩展）
- 不实现 Web UI

## Acceptance Criteria

- [ ] Agent 可接收消息并调用 LLM
- [ ] Agent 可执行工具调用并返回结果
- [ ] 记忆整合功能正常工作
- [ ] 技能系统可加载并检查依赖
- [ ] 子智能体可在后台执行任务
- [ ] 会话历史可持久化
- [ ] 流式响应正常工作
- [ ] LLM 调用失败重试机制正常
