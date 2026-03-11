## ADDED Requirements

### Requirement: 工具抽象基类

系统 SHALL 提供 BaseTool 抽象类用于工具实现。

#### Scenario: BaseTool 定义工具接口
- **WHEN** 实现新工具
- **THEN** 它 SHALL 扩展 BaseTool 并实现 name、description、parameters、execute()

#### Scenario: BaseTool 验证参数
- **WHEN** 带参数执行工具
- **THEN** 参数 SHALL 根据 zod parameters schema 进行验证

#### Scenario: BaseTool 提供辅助方法
- **WHEN** 工具执行完成
- **THEN** success() 或 failure() 方法 SHALL 创建适当的 ToolExecutionResult

### Requirement: 工具注册表用于工具管理

系统 SHALL 提供 ToolRegistry 用于注册和执行工具。

#### Scenario: 注册工具
- **WHEN** 注册工具
- **THEN** 它 SHALL 可通过名称执行

#### Scenario: 执行工具调用
- **WHEN** LLM 返回工具调用
- **THEN** ToolRegistry.execute() SHALL 执行每个工具并返回 ToolResult

#### Scenario: 生成 OpenAI 兼容的 schemas
- **WHEN** 为 LLM 生成工具定义
- **THEN** generateOpenAISchema() SHALL 生成有效的 OpenAI 函数调用 schema

#### Scenario: 生成 Anthropic 兼容的 schemas
- **WHEN** 为 Claude 生成工具定义
- **THEN** generateAnthropicSchema() SHALL 生成有效的 Anthropic 工具 schema

### Requirement: SimpleTool 用于基于函数的工具

系统 SHALL 提供 SimpleTool 类用于通过函数定义工具。

#### Scenario: 从函数创建工具
- **WHEN** 使用 SimpleTool
- **THEN** SHALL 从 name、description、parameters schema 和 handler 函数创建工具

### Requirement: 危险工具标记

系统 SHALL 支持将工具标记为危险。

#### Scenario: 将工具标记为危险
- **WHEN** 工具具有 dangerous: true
- **THEN** ToolRegistry.getDangerousTools() SHALL 包含它