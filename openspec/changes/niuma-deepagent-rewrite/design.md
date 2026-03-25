## Context

当前 niuma 代码库存在严重的架构债务，需要彻底重构：

**当前痛点：**
- AgentLoop 是 1605 行的 God Class，混合了 9+ 职责（消息处理、循环迭代、工具执行、Provider 切换、斜杠命令、渠道管理、心跳服务等）
- 配置 Schema 有 200+ 行重复定义（ProviderConfigSchema 和 LLMProviderConfigSchema 几乎相同）
- Provider 错误处理逻辑在各提供商间复制粘贴 170+ 行（OpenAI 和 Anthropic 的 `_handleError` 方法 90% 相同）
- Tool Base 类过度工程化，40% 是死代码（`toSchema()` 方法生成 OpenAI 格式，但 Anthropic 不使用）

**当前架构：**
```
niuma/
├── agent/
│   ├── loop.ts (1605 行 - God Class)
│   ├── context.ts (673 行)
│   ├── memory.ts (412 行)
│   └── tools/ (18 文件, 3800+ 行)
├── providers/ (6 文件, 2400+ 行, 大量重复)
├── config/ (5 文件, 1400+ 行, 重复 Schema)
└── channels/ (9 渠道, 3400+ 行)
```

## Goals / Non-Goals

**Goals:**
- 将代码量减少 77%（34,036 → 8,000 行）
- 采用函数式架构（纯函数替代类）
- 实现组合优于继承的设计
- 使用依赖注入（无全局状态）
- 扁平模块结构（最大文件 ≤ 500 行）

**Non-Goals:**
- 不保留向后兼容（Clean Break 策略）
- 不迁移现有测试用例（需重新编写）
- 不保留所有渠道（仅保留核心抽象 + CLI 示例）
- 不保留非核心功能（如心跳服务、复杂审批流）

## Decisions

### 1. 函数式 Agent 核心
**决策**: 使用纯函数 `runLoop()` 替代 `AgentLoop` 类

**理由**:
- 消除 God Class，每个函数单一职责
- 更好的可测试性（纯函数，无副作用）
- 状态不可变，避免隐蔽 Bug

**对比**:
```typescript
// Before: 类层次
class AgentLoop { async run() { /* 1605 行 */ } }

// After: 纯函数
export async function runLoop(ctx: AgentContext, state: AgentState): Promise<AgentState>
```

### 2. Tool Spec 接口替代 BaseTool 类
**决策**: 使用 `ToolSpec` 接口 + 函数实现，废弃 `BaseTool` 抽象类

**理由**:
- 消除类继承层次
- 工具只需实现 `execute` 函数
- 集中式错误处理在 ToolRegistry

**对比**:
```typescript
// Before: 类继承
class ReadFileTool extends BaseTool { async execute() { ... } }

// After: 接口 + 函数
const readFile: ToolSpec = { name: "read_file", execute: async (args) => { ... } }
```

### 3. OpenAICompatibleProvider 基类提取
**决策**: 创建共享基类提取 OpenAI/Ollama/DeepSeek 的通用逻辑

**理由**:
- 消除 170+ 行重复的错误处理代码
- 消除重复的 Message 转换逻辑
- DeepSeek 等仅需配置差异（API base、默认模型）

### 4. 可配置搜索引擎抽象
**决策**: 创建 `SearchEngine` 接口，支持 Brave、Tavily 等多个引擎

**理由**:
- 用户可自由选择搜索引擎
- 统一接口，易于扩展新引擎
- 自动检测环境变量配置

### 5. Channels 简化
**决策**: 从 9 个完整渠道实现缩减为核心抽象 + CLI 示例

**理由**:
- 大部分渠道代码重复（连接管理、消息格式化）
- 保持核心抽象，用户可按需实现
- 减少维护负担

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| 功能回归 | 高 | 保留核心功能规格，TDD 测试覆盖 |
| API 不兼容 | 高 | 明确文档化 Breaking Changes，提供迁移指南 |
| 性能下降 | 中 | 基准测试对比，必要时优化热点路径 |
| 学习成本 | 低 | 更简单的 API 设计降低学习成本 |

**Trade-offs:**
- **代码量 vs 灵活性**: 大幅减少代码量，但牺牲了部分扩展点（如复杂的审批流程）
- **函数式 vs 面向对象**: 函数式代码对团队有新要求，但更易于推理和测试

## Migration Plan

**阶段 1: 准备**
1. 创建 openspec 变更提案（当前阶段）
2. 冻结 niuma 功能开发
3. 创建功能分支

**阶段 2: 实施**
1. 清理 niuma/ 目录
2. 按 specs/ 模块逐个实现
3. TDD 红-绿-重构循环

**阶段 3: 验证**
1. 类型检查通过
2. 核心功能测试通过
3. 代码量验证（≤ 10,000 行）

**阶段 4: 交付**
1. 更新文档
2. 创建迁移指南
3. 合并到 main

## Open Questions

1. **Memory 系统**: 是否保留完整的双层记忆系统，还是简化为单一层级？
2. **Subagent**: 是否保留 Subagent 功能，还是作为后续迭代？
3. **MCP 支持**: 是否在初始版本中包含 MCP 工具协议支持？
