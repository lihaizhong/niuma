# Proposal: Harness OS Transformation

## Why

Niuma 当前是单代理对话系统，无法可靠地完成长周期复杂任务（如自主代码开发）。问题根因：**缺少 Harness（操作系统级基础设施）**。

根据 2026 年 Agent Harness 最佳实践：
- 模型 = CPU，Harness = 操作系统
- Agent 可靠性 80% 取决于 Harness，而非模型
- LangChain 实验证明：同模型仅改 Harness 得分从 52.8 提升到 66.5

**核心差距：**
- 无沙箱环境（安全执行）
- 无上下文压缩（长任务性能衰减）
- 无自验证机制（无法确保正确性）
- 无 Human-in-the-Loop（敏感操作无审批）

## What Changes

本次改造为 Niuma 添加完整的 Harness 操作系统能力：

1. **沙箱执行环境** - Docker 隔离的代码执行
2. **任务进度追踪** - PROGRESS.json 持久化任务状态
3. **AGENTS.md 渐进规则** - 从失败中学习积累规则
4. **自验证循环** - 测试驱动确保正确性
5. **Human-in-the-Loop** - 敏感操作审批机制
6. **上下文压缩** - 对抗 Context Rot
7. **Ralph Loops** - 长周期任务持续工作
8. **架构升级** - Initializer-Executor 模式

## Capabilities

### New Capabilities

- `sandbox-environment`: Docker 隔离执行环境，支持按需创建销毁、工具拦截、资源限制
- `task-progress-tracker`: PROGRESS.json 持久化任务追踪，支持断点续执行
- `agents-md-rules`: AGENTS.md 渐进规则系统，从失败中学习积累规则
- `self-verification-loop`: 自验证循环，测试驱动验证任务正确性
- `human-in-the-loop`: Human-in-the-Loop 审批机制，敏感操作需人工确认
- `context-compaction`: 上下文压缩机制，对抗 Context Rot
- `ralph-loops`: Ralph Loops 长周期任务持续工作循环
- `initializer-executor-mode`: Initializer-Executor 架构模式，支持长期项目开发

### Modified Capabilities

- `shell-tool`: 安全增强，从黑名单防护升级为沙箱隔离执行
- `agent-memory`: 增强为三层记忆+RAG 检索
- `agent-loop`: 支持自验证循环和 Ralph Loops

## Impact

**新增模块:**
- `niuma/agent/sandbox/` - 沙箱环境管理

**修改模块:**
- `niuma/agent/loop.ts` - 自验证循环集成
- `niuma/agent/memory.ts` - 三层记忆架构
- `niuma/agent/tools/shell.ts` - 沙箱执行

**新增配置:**
- `sandbox` 配置项（Docker 连接、资源限制）
- `verification` 配置项（重试次数、超时）
- `humanApproval` 配置项（敏感操作列表）

**依赖:**
- Docker Engine API (`dockerode`)
- 备选: E2B SDK / Modal Labs SDK

## Non-goals

- 不改变现有的单代理对话模式（保持向后兼容）
- 不实现完整的多代理协调系统（Phase 2）
- 不修改现有的 Provider 抽象层
- 不改变现有的 Channel 系统
