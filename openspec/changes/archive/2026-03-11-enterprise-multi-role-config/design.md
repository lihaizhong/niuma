## Context

当前 Niuma 配置系统使用单一 JSON 配置文件（`~/.niuma/config.json`），所有配置通过 `NiumaConfigSchema` 进行验证。加载器使用 `loadConfig()` 函数读取并解析配置文件，返回 `NiumaConfig` 对象。现有架构不支持多角色配置，所有会话、记忆和日志共享同一工作区。

**当前架构：**
```
~/.niuma/
├── config.json              # 单一配置文件
├── .niuma/                  # 工作目录（默认）
│   ├── MEMORY.md            # 记忆
│   ├── HISTORY.md           # 历史记录
│   └── ...                  # 其他数据
└── logs/                    # 日志目录
```

**约束条件：**
- 必须使用 TypeScript 严格模式
- 必须使用 Zod 进行配置验证
- 必须保持向后兼容（现有单一配置模式仍需支持）
- 角色之间必须完全隔离

## Goals / Non-Goals

**Goals:**
- 支持多角色配置架构，每个角色有独立的配置、工作区、会话和日志
- 使用 JSON5 格式提供更好的配置体验（支持注释和尾随逗号）
- 实现环境变量引用功能，支持 `${VAR}` 和 `${VAR:default}` 语法
- 实现 defaults-with-overrides 模式，角色配置覆盖全局默认配置
- 提供严格的配置验证，未知字段拒绝启动
- 扩展 CLI 支持角色选择和管理

**Non-Goals:**
- 不支持角色配置的热重载（需要重启生效）
- 不支持跨角色的会话共享或记忆迁移
- 不支持角色权限管理或访问控制
- 不支持角色模板的创建和复制

## Decisions

### 1. 使用 JSON5 替代 JSON

**决策：** 使用 `json5` 库替代原生 `JSON.parse()`

**理由：**
- JSON5 支持注释和尾随逗号，提供更好的配置体验
- JSON5 是 JSON 的超集，向后兼容现有 JSON 配置
- 企业级配置通常需要注释说明配置项用途

**替代方案考虑：**
- YAML：语法更简洁，但需要额外依赖，且与现有 JSON 配置不兼容
- TOML：语法友好，但生态相对较小

### 2. 环境变量引用语法

**决策：** 使用 `${VAR}` 和 `${VAR:default}` 语法

**理由：**
- 与 shell 环境变量语法一致，用户熟悉
- 支持默认值，提高配置灵活性
- 在配置解析阶段进行替换，不依赖运行时环境

**实现方式：**
```typescript
// 使用正则表达式匹配并替换环境变量
const envVarPattern = /\$\{([^}:]+)(?::([^}]*))?\}/g
function resolveEnvVars(value: unknown, env: Record<string, string>): unknown {
  // 递归处理对象、数组、字符串
}
```

### 3. Defaults-with-overrides 模式

**决策：** 全局默认配置 + 角色特定配置覆盖

**理由：**
- 减少重复配置，全局默认值适用于所有角色
- 角色只需配置差异部分，简化配置管理
- 符合配置最佳实践（类似 CSS 的继承机制）

**配置结构：**
```json5
{
  // 全局默认配置
  agent: { ... },
  providers: { ... },
  channels: [ ... ],

  // 角色列表
  agents: {
    list: [
      {
        id: "developer",
        name: "开发工程师",
        // 覆盖默认配置
        agent: { progressMode: "verbose" },
        providers: { default: { model: "gpt-4" } }
      },
      {
        id: "manager",
        name: "项目经理",
        // 覆盖默认配置
        agent: { progressMode: "quiet" },
        providers: { default: { model: "gpt-3.5-turbo" } }
      }
    ]
  }
}
```

**合并策略：**
- 使用 Lodash 的 `merge()` 进行深度合并
- 数组字段（如 `channels`、`cronTasks`）完全替换，不合并
- 对象字段（如 `agent`、`providers`）深度合并

### 4. 完全隔离的工作区

**决策：** 每个角色使用独立的工作区、会话存储和日志文件

**理由：**
- 避免会话、记忆和日志相互污染
- 支持角色独立运行，互不干扰
- 便于调试和问题排查

**目录结构：**
```
~/.niuma/
├── niuma.json              # 全局配置（JSON5 格式）
├── .env                    # 环境变量
├── agents/
│   ├── developer/          # 角色工作区
│   │   └── workspace/
│   │       ├── MEMORY.md
│   │       ├── HISTORY.md
│   │       └── ...
│   └── manager/
│       └── workspace/
│           ├── MEMORY.md
│           ├── HISTORY.md
│           └── ...
├── sessions/
│   ├── developer/          # 角色会话存储
│   │   └── session-001.json
│   └── manager/
│       └── session-001.json
└── logs/
    ├── developer.log       # 角色日志
    └── manager.log
```

### 5. 严格配置验证

**决策：** 使用 Zod 的 `strict()` 模式，拒绝未知字段

**理由：**
- 避免配置错误导致的隐式行为
- 提前发现配置问题，减少运行时错误
- 提高配置的可维护性

**实现方式：**
```typescript
// 使用 strict() 模式
const StrictNiumaConfigSchema = NiumaConfigSchema.strict()
const StrictAgentConfigSchema = AgentConfigSchema.strict()
```

### 6. CLI 角色选择

**决策：** 添加 `--agent` 参数支持角色选择，默认使用第一个角色或 `default` 角色

**理由：**
- 保持向后兼容，不指定角色时使用默认行为
- 提供灵活的角色切换机制
- 符合 CLI 工具的用户习惯

**命令示例：**
```bash
# 使用默认角色
niuma chat "你好"

# 使用指定角色
niuma chat --agent developer "帮我实现这个功能"

# 列出所有角色
niuma agents list

# 获取角色详情
niuma agents get --id developer
```

### 7. ConfigManager 类

**决策：** 创建 `ConfigManager` 类封装配置加载、解析、合并和验证逻辑

**理由：**
- 分离配置加载和业务逻辑
- 便于单元测试
- 支持缓存和重载（未来扩展）

**ConfigManager 接口：**
```typescript
class ConfigManager {
  constructor(configPath: string, envPath: string)

  // 加载并解析配置
  load(): NiumaConfig

  // 获取角色配置
  getAgentConfig(agentId: string): AgentConfig

  // 获取角色工作区路径
  getAgentWorkspaceDir(agentId: string): string

  // 获取角色日志路径
  getAgentLogPath(agentId: string): string

  // 列出所有角色
  listAgents(): AgentInfo[]
}
```

## Risks / Trade-offs

### Risk 1: 配置合并复杂度

**风险：** 深度合并配置可能导致意外的配置覆盖行为

**缓解措施：**
- 明确文档说明合并策略
- 提供配置验证工具（`niuma config validate`）
- 单元测试覆盖所有合并场景

### Risk 2: 环境变量安全性

**风险：** 环境变量可能包含敏感信息（如 API 密钥）

**缓解措施：**
- 环境变量文件（`.env`）应设置适当的文件权限（`chmod 600`）
- 文档中明确说明 `.env` 不应提交到版本控制
- 提供示例 `.env.example` 文件

### Risk 3: 向后兼容性

**风险：** 现有用户可能仍在使用旧的 JSON 配置文件

**缓解措施：**
- 同时支持 JSON 和 JSON5 格式
- 提供配置迁移工具（`niuma config migrate`）
- 文档中说明迁移步骤

### Trade-off 1: 数组字段合并 vs 替换

**决策：** 数组字段完全替换，不合并

**理由：**
- 数组合并语义不明确（是否去重？如何排序？）
- 简化实现，减少复杂度
- 避免意外的配置行为

**影响：** 角色需要重新定义所有数组字段（如 `channels`、`cronTasks`）

### Trade-off 2: 默认角色选择

**决策：** 不指定角色时使用第一个角色或 `default` 角色

**理由：**
- 保持向后兼容，不破坏现有使用方式
- 提供合理的默认行为

**影响：** 用户需要配置至少一个角色，否则启动失败

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI Entry                             │
│  (niuma chat --agent developer "message")                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    ConfigManager                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1. Load niuma.json (JSON5)                         │   │
│  │  2. Load .env                                        │   │
│  │  3. Resolve env vars (${VAR}, ${VAR:default})        │   │
│  │  4. Merge global + agent config                      │   │
│  │  5. Validate with Zod (strict mode)                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌───────────┐ ┌─────────────────┐
│  Agent Config   │ │ Workspace │ │    Log Path     │
│  (merged)       │ │   Path    │ │                 │
└─────────────────┘ └───────────┘ └─────────────────┘
```

## Migration Plan

### Phase 1: 准备工作
1. 添加 `json5` 依赖
2. 创建新的配置 Schema 扩展
3. 实现 `ConfigManager` 类

### Phase 2: 配置迁移
1. 更新 `loader.ts` 支持 JSON5 和多角色配置
2. 实现环境变量解析
3. 实现配置合并逻辑

### Phase 3: CLI 更新
1. 添加 `--agent` 参数
2. 实现 `agents list` 和 `agents get` 命令
3. 更新日志和会话管理以支持角色隔离

### Phase 4: 测试和文档
1. 编写单元测试
2. 编写集成测试
3. 更新用户文档
4. 提供配置迁移指南

### Rollback Strategy
- 保留原有 `loadConfig()` 函数作为备份
- 通过功能开关控制是否启用多角色配置
- 如遇问题，可回退到单一配置模式

## Open Questions

1. **默认角色选择策略**：如果未指定角色且没有 `default` 角色，是否使用第一个角色？还是报错？
   - **建议**：使用第一个角色，提供友好提示

2. **环境变量优先级**：如果环境变量在配置文件和 `.env` 中都定义，哪个优先？
   - **建议**：`.env` 文件优先，然后是系统环境变量

3. **配置热重载**：未来是否支持配置热重载？
   - **当前决策**：不支持，需要重启生效（Non-goal）

4. **角色配置继承**：角色之间是否可以继承配置？
   - **当前决策**：不支持，所有角色从全局配置继承（Non-goal）

## Implementation Notes

### 文件修改清单
- `niuma/config/schema.ts`: 扩展 Schema，添加 `agents.list` 结构
- `niuma/config/loader.ts`: 更新加载逻辑，支持 JSON5 和多角色配置
- `niuma/config/manager.ts`: 新增 `ConfigManager` 类
- `src/cli/index.ts` (或类似入口): 添加 `--agent` 参数
- `src/cli/commands/agents.ts`: 新增角色管理命令

### 依赖添加
```bash
pnpm add json5
pnpm add -D @types/json5
```

### 测试策略
- 单元测试：配置解析、环境变量替换、配置合并
- 集成测试：CLI 命令、角色隔离、配置验证
- 边界测试：无效配置、未知字段、环境变量不存在