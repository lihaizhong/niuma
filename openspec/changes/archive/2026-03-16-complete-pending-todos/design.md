## Context

当前 Niuma 项目中有 8 个未完成的 TODO，分布在三个工具文件中：

1. **agent.ts** - 6 个 TODO
   - 父智能体 ID 硬编码为 "default"
   - 子智能体会话管理未实现
   - 子智能体消息发送未实现
   - 子智能体资源清理未实现
   - Cron 任务处理器未实现
   - Cron 下次执行时间计算不精确

2. **message.ts** - 1 个 TODO
   - Agent ID 硬编码为 "default"

3. **shell.ts** - 1 个 TODO
   - 用户确认机制未实现（当前直接拒绝危险命令）

这些 TODO 阻碍了核心功能的完整实现，需要补全以提升系统的可用性和完整性。

## Goals / Non-Goals

**Goals:**
- 实现上下文感知的 ID 获取（父智能体 ID、Agent ID）
- 实现子智能体的完整生命周期管理（创建、会话、消息、清理）
- 实现 Cron 任务的实际处理器执行
- 实现精确的 Cron 下次执行时间计算
- 实现用户确认机制以支持安全执行

**Non-Goals:**
- 重构现有工具架构
- 添加新的工具类型
- 改变工具的接口定义
- 实现分布式子智能体系统

## Decisions

### 1. 上下文传递机制

**决策：** 通过 BaseTool 的 execute 方法传递上下文参数

**理由：**
- BaseTool 已经有 execute 方法，可以扩展参数
- 保持向后兼容，新参数可选
- 不需要修改现有的工具调用逻辑

**替代方案：**
- 使用全局上下文变量（❌ 不利于测试和并发）
- 使用依赖注入（❌ 增加复杂度）

### 2. 父智能体 ID 获取

**决策：** 在 ToolRegistry 中维护当前 Agent ID，通过 BaseTool 访问

**理由：**
- ToolRegistry 是工具的注册中心，适合存储上下文信息
- BaseTool 可以访问 ToolRegistry
- 避免在每个工具调用时传递额外参数

**实现：**
```typescript
class BaseTool {
  protected getAgentId(): string {
    return this.registry.getAgentId() || "default";
  }
}
```

### 3. 子智能体会话管理

**决策：** 使用 SessionManager 创建独立会话

**理由：**
- SessionManager 已经存在，支持多会话
- 子智能体可以有独立的历史记录
- 支持会话持久化

**实现：**
```typescript
private async createSubagentSession(agentId: string): Promise<Session> {
  return await sessionManager.getOrCreate(`subagent:${agentId}`);
}
```

### 4. 子智能体消息发送

**决策：** 通过 EventBus 发送消息到子智能体

**理由：**
- EventBus 已经是项目的消息传递机制
- 支持异步通信
- 可以监听子智能体的响应

**实现：**
```typescript
private async sendMessageToSubagent(agentId: string, content: string): Promise<void> {
  bus.emit("SUBAGENT_MESSAGE", {
    fromAgentId: this.getAgentId(),
    toAgentId: agentId,
    content,
  });
}
```

### 5. Cron 下次执行时间计算

**决策：** 使用 `cron-parser` 库

**理由：**
- node-cron 本身不提供计算下次执行时间的功能
- cron-parser 是成熟的 Cron 解析库
- 精确支持标准的 Cron 表达式

**依赖：**
```json
{
  "dependencies": {
    "cron-parser": "^4.0.0"
  }
}
```

### 6. 用户确认机制

**决策：** 使用 clack/prompts 实现交互式确认

**理由：**
- clack/prompts 已经在项目中被使用
- 提供美观的终端交互界面
- 支持 confirm、select 等多种提示类型

**实现：**
```typescript
import { confirm } from "@clack/prompts";

const shouldContinue = await confirm({
  message: "此命令可能危险，是否继续？",
});
```

## Risks / Trade-offs

### 风险 1：上下文传递可能增加工具调用复杂度
**缓解措施：** 使用默认值保持向后兼容，新参数可选

### 风险 2：子智能体消息发送可能导致循环调用
**缓解措施：** 添加消息深度限制，超过阈值自动拒绝

### 风险 3：Cron-parser 增加依赖包体积
**缓解措施：** 库体积小（~10KB），功能价值高

### 风险 4：用户确认机制在非交互环境中可能阻塞
**缓解措施：** 添加 --yes/-y 参数跳过确认，支持 CI/CD 环境

## Migration Plan

### 部署步骤

1. 添加 cron-parser 依赖
2. 更新 BaseTool 添加上下文方法
3. 更新 ToolRegistry 存储 Agent ID
4. 实现各工具的 TODO 功能
5. 编写单元测试
6. 运行集成测试

### 回滚策略

- 所有改动都在工具内部，不影响外部接口
- 可以通过 git revert 回退
- 保持向后兼容，旧代码仍可运行

## Open Questions

1. **子智能体是否需要独立的工作区？**
   - 当前已经有 workspaceDir，但可能需要更多隔离
   - 建议：保持当前设计，后续根据需求调整

2. **Cron 任务处理器是否需要权限控制？**
   - 当前没有实现权限检查
   - 建议：后续添加 handler 白名单

3. **用户确认是否需要记录确认历史？**
   - 当前只是临时确认
   - 建议：添加确认日志，便于审计