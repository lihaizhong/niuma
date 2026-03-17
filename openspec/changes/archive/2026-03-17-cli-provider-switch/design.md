## Context

Niuma 目前支持多 provider 配置（OpenAI、Anthropic、Ollama 等），但运行时无法切换。用户需要在 `niuma.config.json` 中预设 provider，如果想切换必须修改配置并重启服务。

当前架构：
- `AgentLoop` 持有 `provider: LLMProvider` 实例（readonly）
- `ProviderRegistry` 管理所有 provider 实例和配置
- `ConfigManager` 初始化 provider 并设置默认值
- CLI 斜杠命令在 `AgentLoop._handleSlashCommand()` 处理

```
┌─────────────────────────────────────────────────────────────┐
│                        niuma/index.ts                       │
│  ┌─────────────┐    ┌──────────────────┐                   │
│  │ConfigManager│───▶│ProviderRegistry  │                   │
│  └─────────────┘    │  - openai        │                   │
│         │           │  - anthropic     │                   │
│         ▼           │  - ollama        │                   │
│  ┌─────────────┐    └────────┬─────────┘                   │
│  │AgentLoop    │             │                              │
│  │ - provider ◀┼─────────────┘ (readonly)                   │
│  │ - sessions  │                                            │
│  │ - tools     │                                            │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

## Goals / Non-Goals

**Goals:**
- 支持运行时通过 CLI 斜杠命令切换已配置的 provider
- `/provider` 列出所有可用 provider 并切换
- `/model <name>` 根据模型名自动匹配并切换 provider
- 切换后立即生效，后续对话使用新 provider

**Non-Goals:**
- 不支持新增 provider（必须预先配置）
- 不支持修改 provider 参数（temperature、maxTokens 等）
- 不持久化切换结果（重启后恢复配置文件默认值）
- 不支持跨渠道的 provider 状态同步

## Decisions

### Decision 1: Provider 切换入口位置

**选择**: 在 `AgentLoop._handleSlashCommand()` 中添加 `/provider` 和 `/model` 命令

**原因**:
- 现有斜杠命令（`/new`、`/help`）已在此处理
- AgentLoop 持有 provider 实例，便于切换
- 与消息处理流程紧密集成

**备选方案**:
- 在 `CLIChannel.handleSlashCommand()` 中处理 ❌ 渠道层不应直接操作 provider
- 新建 `CommandHandler` 类 ❌ 过度设计，当前命令数量较少

### Decision 2: Provider 可变性设计

**选择**: 将 `provider` 改为可变属性，添加 setter 方法

```typescript
class AgentLoop {
  private _provider: LLMProvider;
  
  get provider(): LLMProvider {
    return this._provider;
  }
  
  setProvider(newProvider: LLMProvider): void {
    this._provider = newProvider;
    logger.info({ provider: newProvider.name }, "Provider 已切换");
  }
}
```

**原因**:
- 简单直接，最小改动
- 保持对现有代码的兼容

**备选方案**:
- 使用 ProviderRegistry 动态获取 ❌ 每次调用都查 registry，性能损失
- 重构为策略模式 ❌ 过度设计

### Decision 3: 传递 Registry 引用

**选择**: 在 `AgentLoopOptions` 中新增 `providerRegistry` 和 `configManager` 参数

```typescript
interface AgentLoopOptions {
  // ... 现有字段
  providerRegistry: ProviderRegistry;
  configManager: ConfigManager;
}
```

**原因**:
- 需要访问所有可用 provider 列表
- 需要根据模型名匹配 provider
- 需要切换默认 provider

### Decision 4: 命令格式

**选择**: 使用 `/provider` 和 `/model` 子命令格式

```
/provider              # 列出所有 provider
/provider <name>       # 切换到指定 provider
/provider current      # 显示当前 provider
/model <model-name>    # 根据模型名切换
```

**原因**:
- 与现有命令风格一致
- 子命令结构清晰

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 切换 provider 后会话状态不一致 | 在切换时记录日志，不清理会话历史（模型上下文兼容） |
| 用户切换到未配置 API Key 的 provider | 在列出时标记可用性，切换时验证 |
| 多渠道场景下状态不同步 | 仅在当前会话生效，不影响其他渠道 |

## Migration Plan

无需迁移，纯新增功能。

部署步骤：
1. 修改 `AgentLoopOptions` 接口
2. 更新 `niuma/index.ts` 传递 registry 引用
3. 在 `AgentLoop` 添加 provider 切换方法
4. 添加 `/provider` 和 `/model` 命令处理

## Open Questions

- 是否需要在切换 provider 时显示模型参数差异？→ 建议暂不实现，保持简洁
- 是否需要支持模型参数临时调整（如 temperature）？→ 建议作为后续功能
