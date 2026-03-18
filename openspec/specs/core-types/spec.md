# Core Types Specification

## Purpose

定义 Core Types 的功能规格和行为约束。

## Requirements

### Requirement: 模块化类型定义结构

系统 SHALL 按领域将核心类型组织到单独的文件中，并统一导出。

#### Scenario: 按领域组织类型
- **WHEN** 定义核心类型
- **THEN** 类型 SHALL 分割到文件：niuma/types/ 下的 message.ts、tool.ts、llm.ts、events.ts、error.ts

#### Scenario: 通过 index 统一导出
- **WHEN** 从外部导入类型
- **THEN** 所有类型 SHALL 可通过 index.ts 重新导出从 `niuma/types` 获取

### Requirement: 消息类型定义

系统 SHALL 定义渠道通信的消息类型。

#### Scenario: InboundMessage 定义传入消息结构
- **WHEN** 从任何渠道接收消息
- **THEN** 它 SHALL 符合 InboundMessage 接口，包含字段：channel、senderId、chatId、content、media、metadata、sessionKey

#### Scenario: OutboundMessage 定义传出消息结构
- **WHEN** 向任何渠道发送消息
- **THEN** 它 SHALL 符合 OutboundMessage 接口，包含字段：channel、chatId、content、metadata、media、replyTo

#### Scenario: ToolCall 定义工具调用请求
- **WHEN** LLM 请求工具执行
- **THEN** 它 SHALL 具有 id、name 和 arguments 字段

#### Scenario: LLMResponse 定义 LLM 输出结构
- **WHEN** LLM 返回响应
- **THEN** 它 SHALL 具有 content、toolCalls、hasToolCalls 和可选的 reasoningContent、usage 字段

### Requirement: 针对领域错误的错误类型

系统 SHALL 为不同的错误领域定义自定义错误类。

#### Scenario: NiumaError 是基础错误类
- **WHEN** 系统中发生错误
- **THEN** 它 SHALL 扩展 NiumaError 并具有 code 和 details 字段

#### Scenario: ToolExecutionError 用于工具失败
- **WHEN** 工具执行失败
- **THEN** SHALL 抛出 ToolExecutionError 并具有 toolName 和 message

#### Scenario: ConfigError 用于配置问题
- **WHEN** 配置无效
- **THEN** SHALL 抛出 ConfigError 并具有描述性消息