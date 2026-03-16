## Why

Niuma 需要主动唤醒机制来执行周期性任务（如检查 HEARTBEAT.md、发送提醒），而不仅仅是被动响应消息。心跳服务可以让 Niuma 定期主动联系用户，提供更好的陪伴感和实用性。

## What Changes

- 新增心跳服务模块（`heartbeat/service.ts`）
- 实现周期性 HEARTBEAT.md 检查机制
- 支持定时任务调度和执行
- 与现有 Agent Loop 和会话系统集成
- 通过最近活跃的渠道发送心跳结果

## Capabilities

### New Capabilities

- `heartbeat-service`: 心跳服务，提供周期性任务检查、HEARTBEAT.md 解析和任务执行功能

### Modified Capabilities

- 无（现有功能的行为级需求未变化）

## Impact

**新增代码：**
- `niuma/heartbeat/` - 新模块目录
  - `service.ts` - 心跳服务主逻辑
  - `types.ts` - 心跳相关类型定义

**受影响模块：**
- `niuma/agent/loop.ts` - 需集成心跳服务启动
- `niuma/session/manager.ts` - 需获取最近活跃渠道信息

**依赖：**
- 使用现有的 `cron` 工具（已实现）
- 使用现有的事件总线（`bus/`）

**配置：**
- 新增 `heartbeat` 配置段（检查间隔、启用状态等）

**无破坏性变更**