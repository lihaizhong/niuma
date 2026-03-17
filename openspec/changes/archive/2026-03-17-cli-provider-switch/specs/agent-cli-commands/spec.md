# Agent CLI Commands 规格（修改）

## ADDED Requirements

### Requirement: AgentLoop 支持 provider 切换方法
系统 SHALL 在 AgentLoop 中提供 provider 切换相关方法。

#### Scenario: AgentLoopOptions 新增参数
- **WHEN** 创建 AgentLoop 实例
- **THEN** AgentLoopOptions SHALL 包含 `providerRegistry` 参数
- **AND** AgentLoopOptions SHALL 包含 `configManager` 参数

#### Scenario: AgentLoop 持有 registry 引用
- **WHEN** AgentLoop 初始化
- **THEN** AgentLoop SHALL 存储 providerRegistry 引用
- **AND** AgentLoop SHALL 存储 configManager 引用

### Requirement: 斜杠命令帮助信息更新
系统 SHALL 更新 `/help` 命令输出以包含 provider 相关命令。

#### Scenario: /help 显示 provider 命令
- **WHEN** 用户输入 `/help`
- **THEN** 系统显示帮助信息包含 `/provider` 命令说明
- **AND** 系统显示帮助信息包含 `/model` 命令说明

### Requirement: AgentLoop 构造函数选项扩展
系统 SHALL 扩展 AgentLoopOptions 接口以支持 provider 切换。

#### Scenario: AgentLoopOptions 接口定义
- **WHEN** 定义 AgentLoopOptions 接口
- **THEN** 接口 SHALL 包含 `providerRegistry: ProviderRegistry` 字段
- **AND** 接口 SHALL 包含 `configManager: ConfigManager` 字段

## TypeScript Interface Definitions

```typescript
/**
 * AgentLoop 扩展选项
 */
interface AgentLoopOptions {
  // ... 现有字段

  /** Provider 注册表（用于 provider 切换） */
  providerRegistry: ProviderRegistry;

  /** 配置管理器（用于获取 provider 列表） */
  configManager: ConfigManager;
}

/**
 * AgentLoop 斜杠命令处理扩展
 */
interface AgentLoopSlashCommands {
  /**
   * 处理 /provider 命令
   * @param args 命令参数
   * @returns 命令输出文本
   */
  handleProviderCommand(args: string): Promise<string>;

  /**
   * 处理 /model 命令
   * @param args 命令参数（模型名）
   * @returns 命令输出文本
   */
  handleModelCommand(modelName: string): Promise<string>;
}
```

## Dependencies

- `cli-provider-commands`: 依赖此 spec 定义的 provider 切换功能
- `agent-loop`: 修改 AgentLoop 类实现
