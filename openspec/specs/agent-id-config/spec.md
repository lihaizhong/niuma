# Agent Id Config Specification

## Purpose

定义 Agent Id Config 的功能规格和行为约束。

## Requirements

### Requirement: Agent ID 配置
AgentLoop SHALL支持从配置中获取 Agent ID，避免硬编码。

#### Scenario: 从配置获取 Agent ID
- **WHEN** 创建 AgentLoop 实例
- **THEN** 系统接收 `agentId` 参数
- **THEN** 系统调用 `this.tools.setAgentId(agentId)`

#### Scenario: 未提供 Agent ID
- **WHEN** 未提供 `agentId` 参数
- **THEN** 系统使用默认值 "default"

#### Scenario: 多角色配置
- **WHEN** 使用不同的角色配置
- **THEN** 系统使用对应的 Agent ID

### Requirement: LLM 提供商创建
系统SHALL支持根据配置创建 LLM 提供商实例。

#### Scenario: 创建 LLM 提供商
- **WHEN** 调用 `createLLMProvider(config)` 方法
- **THEN** 系统解析提供商配置
- **THEN** 系统创建对应的提供商实例
- **THEN** 系统返回提供商实例

#### Scenario: 使用默认提供商
- **WHEN** 配置中未指定提供商
- **THEN** 系统使用默认提供商

#### Scenario: 使用自定义提供商
- **WHEN** 配置中指定自定义提供商
- **THEN** 系统创建自定义提供商实例

### Requirement: AgentLoop 启动
系统SHALL支持完整启动 AgentLoop。

#### Scenario: 启动 AgentLoop
- **WHEN** 调用 `initialize()` 方法
- **THEN** 系统初始化渠道
- **THEN** 系统创建 LLM 提供商
- **THEN** 系统启动事件监听

#### Scenario: 启动失败处理
- **WHEN** 启动过程中发生错误
- **THEN** 系统记录错误日志
- **THEN** 系统抛出异常