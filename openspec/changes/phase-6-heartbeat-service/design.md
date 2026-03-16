## Context

当前 Niuma 已实现 `cron` 工具支持定时任务调度，但缺乏集成的心跳服务来主动执行周期性任务。HEARTBEAT.md 文件用于定义需要周期性执行的任务，但目前只能通过手动调用触发。

项目已有以下基础设施：
- `niuma/agent/tools/agent.ts` - cron 工具实现（使用 node-cron）
- `niuma/session/manager.ts` - 会话管理，记录活跃渠道
- `niuma/bus/` - 事件总线，支持异步通信
- `niuma/agent/loop.ts` - Agent 主循环

## Goals / Non-Goals

**Goals:**
- 提供可配置的心跳服务，定期检查 HEARTBEAT.md
- 解析并执行 HEARTBEAT.md 中定义的任务
- 通过最近活跃的渠道发送执行结果
- 与 Agent Loop 无缝集成，服务随 Agent 启动和停止
- 支持任务执行日志记录

**Non-Goals:**
- 复杂的任务编排（仅支持简单任务列表）
- 多 Agent 心跳协调（单 Agent 实例）
- 持久化任务执行历史（仅内存记录）
- 跨工作区的心跳同步

## Decisions

### 1. 调度引擎选择
**决策：** 复用 node-cron 库（已在 cron 工具中使用）

**理由：**
- 已有依赖，无需新增外部依赖
- API 简单直观（CronJob 类）
- 支持标准 Cron 表达式

**替代方案：**
- `setInterval` + 手动时间管理 → 灵活性差，不支持复杂 Cron 表达式
- `agenda` / `bull` → 过于重量级，不适用于简单的周期性检查

### 2. HEARTBEAT.md 格式设计
**决策：** 使用 Markdown + YAML Frontmatter

```markdown
---
interval: "0 */30 * * * *"  # 每 30 分钟
enabled: true
---

# 心跳任务

- [ ] 检查系统状态
- [ ] 发送每日提醒
```

**理由：**
- 用户友好，易于编辑
- YAML Frontmatter 支持元数据配置
- Markdown 任务列表可使用现有的解析逻辑

**替代方案：**
- 纯 JSON → 不够用户友好
- 纯文本 → 缺乏结构化元数据支持

### 3. 心跳服务集成点
**决策：** 在 Agent Loop 初始化时启动心跳服务

```typescript
// agent/loop.ts
export class AgentLoop {
  private heartbeatService?: HeartbeatService;

  async initialize() {
    // ... existing code
    if (config.heartbeat?.enabled) {
      this.heartbeatService = new HeartbeatService(agent, config.heartbeat);
      await this.heartbeatService.start();
    }
  }

  async shutdown() {
    // ... existing code
    if (this.heartbeatService) {
      await this.heartbeatService.stop();
    }
  }
}
```

**理由：**
- 心跳服务与 Agent 生命周期绑定
- 需要访问 Agent 上下文和工具
- 避免心跳服务在 Agent 停止后继续运行

**替代方案：**
- 独立进程 → 增加复杂性，进程间通信开销
- CLI 命令触发 → 无法持续运行

### 4. 渠道选择策略
**决策：** 使用会话管理器中的最后活跃渠道

**理由：**
- 最符合用户期望（在最近使用的渠道接收通知）
- 已有现成的会话记录
- 用户体验一致

**替代方案：**
- 轮询所有渠道 → 可能造成重复通知
- 固定默认渠道 → 缺乏灵活性

### 5. 错误处理策略
**决策：** 优雅降级，记录日志但不中断心跳服务

```typescript
try {
  await executeHeartbeatTask(task);
} catch (error) {
  logger.error(`心跳任务执行失败: ${task}`, error);
  // 继续执行下一个任务，不中断心跳服务
}
```

**理由：**
- 单个任务失败不应影响整个心跳服务
- 便于问题排查
- 符合容错设计原则

## Risks / Trade-offs

### 风险 1：资源消耗
**风险：** 心跳服务持续运行，占用 CPU 和内存

**缓解措施：**
- 默认检查间隔设置为 30 分钟，避免频繁调度
- 使用轻量级的 Cron 实现
- 提供 `enabled` 配置项，允许用户关闭

### 风险 2：渠道离线
**风险：** 如果最后活跃渠道离线，消息无法送达

**缓解措施：**
- 记录发送失败日志
- 可考虑回退到备用渠道（如 CLI）
- 在文档中说明此限制

### 风险 3：HEARTBEAT.md 解析错误
**风险：** 格式错误导致解析失败，所有任务无法执行

**缓解措施：**
- 使用 Zod 验证 HEARTBEAT.md 格式
- 解析失败时记录详细错误信息
- 提供格式示例和验证工具

### 风险 4：任务执行时间过长
**风险：** 某个任务执行时间过长，阻塞心跳周期

**缓解措施：**
- 设置任务执行超时（如 5 分钟）
- 异步执行任务，不阻塞 Cron 调度器
- 记录任务执行时长

## Migration Plan

**部署步骤：**
1. 实现 `heartbeat/service.ts` 和相关类型
2. 扩展配置 Schema，添加 `heartbeat` 段
3. 修改 `agent/loop.ts`，集成心跳服务
4. 添加单元测试和集成测试
5. 更新文档，提供 HEARTBEAT.md 示例

**回滚策略：**
- 通过配置项 `heartbeat.enabled: false` 禁用心跳服务
- 移除 `agent/loop.ts` 中的集成代码
- 删除 `heartbeat/` 目录

## Open Questions

1. **HEARTBEAT.md 位置：** 是放在 Agent 工作区根目录，还是配置文件指定的路径？
   - **建议：** 默认工作区根目录，可通过配置覆盖

2. **任务执行权限：** 心跳任务是否应该使用 Agent 的完整权限？
   - **建议：** 是，但限制危险操作（如 rm、shutdown）

3. **心跳结果格式：** 应该如何格式化并发送心跳结果？
   - **建议：** 使用 Markdown 格式，包含成功/失败统计

4. **多任务并发：** HEARTBEAT.md 中的多个任务应该串行还是并发执行？
   - **建议：** 串行执行，避免资源竞争

5. **时区处理：** Cron 表达式使用本地时区还是 UTC？
   - **建议：** 使用本地时区，符合用户直觉