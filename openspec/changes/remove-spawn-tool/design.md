## Context

项目中存在两个子智能体实现：

1. **SpawnTool** (`agent/tools/agent.ts`) - LLM 可调用的工具类
   - 只创建配置和会话，没有真正的任务执行逻辑
   - 无事件通知机制
   - 无并发控制
   - 无工具隔离

2. **SubagentManager** (`agent/subagent.ts`) - 服务类
   - 完整的后台任务执行逻辑
   - EventBus 事件通知
   - 并发限制 (最大 5 个)
   - 工具隔离 (排除 message/spawn)

当前 SpawnTool 已注册到 ToolRegistry，LLM 可能会调用它，但实际上无法完成预期功能，会造成误导。

## Goals / Non-Goals

**Goals:**
- 删除 SpawnTool 相关代码，消除代码冗余和潜在误导
- 保持 SubagentManager 作为唯一的子智能体管理实现
- 更新测试和文档以反映删除

**Non-Goals:**
- 不创建新的 LLM 可调用子智能体工具（如需要，应作为独立变更）
- 不修改 SubagentManager 的现有功能

## Decisions

### D1: 删除而非修复 SpawnTool

**理由**: SpawnTool 当前的架构问题：
- 作为工具类，无法访问 AgentLoop 执行上下文
- 缺少 LLM Provider 调用能力
- 缺少 EventBus 连接

修复成本 > 重写成本，而 SubagentManager 已有完整实现。

**替代方案**: 将 SpawnTool 重构为 SubagentManager 的包装器
- 弃用：增加维护复杂度，且功能与 SubagentManager 重复

### D2: 保留 CronTool

**理由**: CronTool 是独立的定时任务功能，与 SpawnTool 在同一个文件但功能完整，应保留。

## Risks / Trade-offs

- **风险**: 如果有外部代码依赖 SpawnTool，会破坏兼容性
  - 缓解: 这是内部 API，无外部依赖风险

- **风险**: LLM 可能期望调用 spawn 工具
  - 缓解: 当前实现本就不工作，删除后行为一致（返回工具不存在）
