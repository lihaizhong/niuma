## Why

Niuma 项目中存在多个未完成的 TODO，这些 TODO 阻碍了工具的完整功能实现，特别是子智能体管理、消息发送、用户确认机制等核心功能。现在需要补全这些 TODO 以提升系统的完整性和可用性。

## What Changes

- **agent.ts 中的 6 个 TODO**：
  - 从上下文获取父智能体 ID（不再硬编码 "default"）
  - 实现子智能体会话管理
  - 实现实际的消息发送到子智能体
  - 实现资源清理机制
  - 实现任务处理器执行逻辑
  - 实现更精确的 Cron 下次执行时间计算

- **message.ts 中的 1 个 TODO**：
  - 从上下文获取 Agent ID（不再硬编码 "default"）

- **shell.ts 中的 1 个 TODO**：
  - 实现用户确认机制（当前版本直接拒绝危险命令）

## Capabilities

### New Capabilities

- **subagent-context**: 子智能体上下文管理，支持从运行时上下文获取父智能体 ID 和 Agent ID
- **subagent-session**: 子智能体会话管理，支持独立会话和消息传递
- **subagent-cleanup**: 子智能体资源清理，支持优雅关闭和资源释放
- **task-handler-execution**: 任务处理器执行，支持动态任务调度和执行
- **cron-next-run**: Cron 下次执行时间计算，支持精确的时间预测
- **user-confirmation**: 用户确认机制，支持危险命令的交互式确认

### Modified Capabilities

- **agent-tools-spawn**: Spawn 工具的增强，支持完整的子智能体生命周期管理
- **agent-tools-cron**: Cron 工具的增强，支持任务处理器执行和精确时间计算
- **agent-tools-message**: Message 工具的增强，支持上下文感知的 Agent ID
- **agent-tools-shell**: Shell 工具的增强，支持用户确认机制

## Impact

**受影响的代码：**
- `niuma/agent/tools/agent.ts` - SpawnTool 和 CronTool 类
- `niuma/agent/tools/message.ts` - MessageTool 类
- `niuma/agent/tools/shell.ts` - ShellTool 类

**新增依赖：**
- 可能需要添加 `node-cron` 的精确时间计算库（如 `cron-parser`）

**系统影响：**
- 子智能体功能将完整可用
- Cron 任务将支持实际的处理器执行
- Shell 工具将支持交互式确认
- 消息系统将支持正确的 Agent 上下文