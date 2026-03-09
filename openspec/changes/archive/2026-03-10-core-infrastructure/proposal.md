## Why

Niuma 需要建立 TypeScript 版 nanobot 的核心基础设施。当前 `niuma/` 目录为空，需要先搭建项目骨架，包括核心类型定义、配置系统、工具框架和消息总线。这是整个智能体系统的基础，后续 Agent 循环、LLM 提供商、多渠道接入都依赖此基础设施。

## What Changes

- 新增 `types/` - 核心类型定义（message.ts, tool.ts, llm.ts, events.ts, error.ts, index.ts）
- 新增 `config/schema.ts` - 使用 zod 定义配置结构
- 新增 `config/loader.ts` - 配置加载器（文件 + 环境变量 + 默认值合并）
- 新增 `agent/tools/base.ts` - Tool 抽象基类和 SimpleTool 实现
- 新增 `agent/tools/registry.ts` - 工具注册表（注册、执行、Schema 生成）
- 新增 `bus/events.ts` - EventEmitter 单例 + emit/on 辅助函数
- 新增 `bus/queue.ts` - 异步消息队列
- 新增 `bus/index.ts` - 统一导出 events 和 queue

## Capabilities

### New Capabilities

- `core-types`: 核心类型系统，定义 Message、Tool、LLM 响应等基础接口
- `config-system`: 配置管理，支持 Schema 验证、多源合并、环境变量
- `tool-framework`: 工具框架，包括基类、注册表、Schema 生成
- `event-bus`: 事件总线，模块间通信基础设施

### Modified Capabilities

无（这是全新基础设施，无现有规格需要修改）

## Impact

- **代码**: 新增 12 个核心文件到 `niuma/` 目录（types: 6, config: 2, agent/tools: 2, bus: 3）
- **依赖**: 利用现有 zod、better-sqlite3 等依赖，无需新增
- **API**: 定义核心接口，后续模块遵循
- **兼容**: ES Module 格式，TypeScript 严格模式

## Non-goals

- 不实现 Agent 循环逻辑（Phase 2）
- 不实现具体工具（read_file, exec 等，Phase 3）
- 不实现 LLM 提供商（Phase 4）
- 不实现会话持久化到数据库（Phase 5）
- 不添加 MCP 协议支持

## Acceptance Criteria

- [ ] 所有核心类型定义完整且有 JSDoc 注释
- [ ] 配置系统能正确加载、验证、合并配置
- [ ] 工具框架支持注册、执行、生成 OpenAI/Anthropic Schema
- [ ] 事件总线支持订阅、发布、等待事件
- [ ] TypeScript 编译无错误
- [ ] 所有导出符号有类型定义，无 `any`
