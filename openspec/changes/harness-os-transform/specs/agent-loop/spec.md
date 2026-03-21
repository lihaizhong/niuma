# Agent Loop Specification (Delta)

## Purpose

扩展 Agent Loop 支持 Harness 能力。

## MODIFIED Requirements

### Requirement: 迭代控制

**FROM:**
> AgentLoop SHALL 支持多轮 LLM ↔ 工具执行迭代，并设置最大迭代次数。

**TO:**
> AgentLoop SHALL 支持多轮 LLM ↔ 工具执行迭代，并集成自验证循环和 Ralph Loops。

#### Scenario: 自验证循环执行
- **WHEN** 任务配置了验证规则
- **THEN** AgentLoop SHALL 在任务完成后运行验证
- **AND** SHALL 重试如果验证失败

#### Scenario: Ralph Loop 继续
- **WHEN** Agent 尝试在任务未完成时退出
- **THEN** AgentLoop SHALL 拦截退出
- **AND** SHALL 重新注入原始目标

### Requirement: 进度通知

**FROM:**
> AgentLoop SHALL 支持进度通知回调。

**TO:**
> AgentLoop SHALL 支持 Harness 特有的进度事件。

#### Scenario: 任务进度事件
- **WHEN** 任务状态更新
- **THEN** AgentLoop SHALL 发射 `TASK_PROGRESS` 事件
- **AND** SHALL 包含任务 ID 和状态

#### Scenario: 验证结果事件
- **WHEN** 验证循环完成
- **THEN** AgentLoop SHALL 发射 `VERIFICATION_RESULT` 事件
- **AND** SHALL 包含通过/失败状态

## ADDED Requirements

### Requirement: Harness 集成

AgentLoop SHALL 集成 Harness 组件。

```typescript
interface HarnessOptions {
  sandboxManager?: SandboxManager;
  taskTracker?: TaskTracker;
  verificationLoop?: SelfVerification;
  agentsMdRules?: AgentsMdRules;
}
```

#### Scenario: 初始化 Harness 组件
- **WHEN** AgentLoop 创建时提供 Harness 配置
- **THEN** AgentLoop SHALL 初始化 Harness 组件
- **AND** SHALL 注入到执行循环

#### Scenario: 检查点保存
- **WHEN** 检查点间隔到达
- **THEN** AgentLoop SHALL 触发 TaskTracker 保存状态
- **AND** SHALL 发射检查点事件

### Requirement: AGENTS.md 规则注入

AgentLoop SHALL 加载 AGENTS.md 规则到上下文。

#### Scenario: 注入项目规则
- **WHEN** 构建系统提示
- **THEN** AgentLoop SHALL 加载 AGENTS.md
- **AND** SHALL 追加到系统提示末尾

## Dependencies

- Requires: `ralph-loops` for loop control
- Requires: `self-verification-loop` for verification
- Requires: `agents-md-rules` for rule loading
