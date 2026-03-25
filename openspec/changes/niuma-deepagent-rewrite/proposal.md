## Why

当前 niuma 代码库存在严重的架构债务：AgentLoop 是 1605 行的 God Class，配置 Schema 有 200+ 行重复定义，Provider 错误处理逻辑在各提供商间复制粘贴 170+ 行。这些过度工程化的设计导致代码难以维护、测试和扩展。现在需要彻底重构为 DeepAgent 精简架构，采用函数式编程、组合优于继承、依赖注入等现代模式，在保持功能完整的前提下将代码量减少 77%。

## What Changes

**完全重写 niuma 核心架构：**

- **BREAKING**: 清理 niuma/ 目录全部现有代码（34,036 行）
- **BREAKING**: 废弃基于类的 AgentLoop、BaseTool、BaseProvider 层次结构
- 新建函数式架构：core/（Agent 循环）、providers/（LLM 提供商）、tools/（工具系统）、channels/（渠道适配器）
- 引入纯函数设计：`runLoop()`、`createAgent()`、`ToolSpec` 接口
- 实现可配置搜索引擎抽象：支持 Brave、Tavily 等多个引擎
- 简化 Channels：从 9 个完整实现缩减为核心抽象 + CLI 示例
- 合并配置系统：5 个文件合并为 2 个，消除 200+ 行重复 Schema

**非目标（明确排除）：**
- 不保留向后兼容（Clean Break 策略）
- 不迁移测试用例（需重新编写）
- 不保留未使用的工具方法（仅保留核心工具集）

## Capabilities

### New Capabilities
- `agent-core`: Agent 核心功能（循环、状态管理、工具调用）
- `llm-providers`: LLM 提供商抽象与实现（OpenAI、Anthropic、Ollama 等）
- `tool-system`: 工具系统（文件系统、Shell、Web、Git、Crypto 等）
- `search-engines`: 可配置搜索引擎（Brave、Tavily）
- `channel-abstraction`: 渠道抽象与基础实现
- `config-management`: 精简配置管理

### Modified Capabilities
- 无（完全重写，无现有能力修改）

## Impact

- **代码规模**: 34,036 行 → 8,000 行（77% 减少）
- **文件数量**: 144 个 → ~40 个（72% 减少）
- **API 变更**: 全新 API，无向后兼容
- **依赖变更**: 减少冗余依赖，保持核心依赖
- **测试影响**: 需重新编写测试套件
- **文档影响**: 需重写使用文档和 API 文档

## Acceptance Criteria

- [ ] TypeScript 编译零错误
- [ ] LSP 诊断零错误  
- [ ] 核心功能完整：Agent 对话、工具调用、LLM 切换
- [ ] 代码量 ≤ 10,000 行
- [ ] 纯函数占比 ≥ 80%
- [ ] 无 God Class（单文件 ≤ 500 行）
