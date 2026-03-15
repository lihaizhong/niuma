## Why

当前 Niuma 项目需要扩展 Agent 的工具能力，以支持文件压缩解压、网络操作和数据处理等常见任务。这些工具是实现完整 AI 助手能力的关键组件，能够提升 Agent 的实用性和灵活性。

同时，项目中存在代码质量改进需求：
- 文件系统操作使用 Node.js 内置的 `fs` 和 `fs/promises`，需要统一为 `fs-extra`
- import 语句缺乏规范化，影响代码可维护性
- 部分模块使用 `any` 类型，降低类型安全性
- 核心模块（ContextBuilder、ToolRegistry）缺少单元测试覆盖

## What Changes

### 新增功能
- 新增压缩与解压工具（archive、extract），支持 zip、tar、tar.gz 等格式
- 新增网络工具（ping、dns_lookup、http_request），支持网络连通性测试、DNS 查询和通用 HTTP 请求
- 新增 JSON/YAML 处理工具（json_parse、json_stringify、yaml_parse、yaml_stringify），支持数据格式转换和解析

### 代码质量改进
- 将所有 `fs` 和 `fs/promises` 导入替换为 `fs-extra`（12 个文件）
- 规范化所有测试文件的 import 语句顺序（内置库 → 第三方库 → 本地模块）
- 消除所有 `any` 类型使用（26 处），使用 `unknown` 或具体类型
- 修复 TypeScript 类型检查错误
- 使用 deepmerge 库替代自定义深度合并实现（减少 33 行代码）
- 规范化 22 个文件的 import 语句，添加清晰的分类注释
  - **源代码文件（11 个）**：context.ts、loop.ts、memory.ts、skills.ts、subagent.ts、tools/base.ts、bus/events.ts、config/json5-loader.ts、config/loader.ts、config/manager.ts、config/merger.ts、providers/openai.ts、session/manager.ts
  - **测试文件（11 个）**：data-tools.test.ts、env-resolver.test.ts、merger.test.ts、message-tool.test.ts、network-tools.test.ts、tool-registry.test.ts、types.test.ts、utils.test.ts、web-tools.test.ts
  - **Import 顺序规范**：内置库 → 第三方库 → 本地模块
  - **分类注释**：每个 import 分组前添加清晰的注释标识
- 更新 VS Code 设置，添加新的拼写检查词汇（backlink、backlinks、frontmatter、sqliteai）

### 测试覆盖提升
- 新增 5 个测试文件（archive-tools、data-tools、network-tools、context-builder、tool-registry）
- 为 utils 模块添加 sanitize 功能的完整测试（21 个测试）
- 修复 6 个测试文件的 import 顺序问题
- 测试总数从 252 增加到 318（+26%）

## Capabilities

### New Capabilities
- `archive-tools`: 文件压缩和解压功能，支持多种压缩格式
- `network-tools`: 网络连通性测试、DNS 查询和 HTTP 请求功能
- `data-processing-tools`: JSON 和 YAML 数据的解析与序列化功能

### Modified Capabilities
- 所有文件系统操作统一使用 `fs-extra`，提升 API 一致性
- 提升类型安全性，消除 `any` 类型带来的运行时风险
- 改善代码可维护性，统一 import 语句规范

## Impact

### 新增文件
- 新增 3 个工具模块文件：`archive.ts`、`network.ts`、`data.ts`
- 新增 5 个测试文件：`archive-tools.test.ts`、`data-tools.test.ts`、`network-tools.test.ts`、`context-builder.test.ts`、`tool-registry.test.ts`

### 修改文件
- 修改 12 个源代码文件：统一使用 `fs-extra`
- 修改 14 个源代码文件：规范化 import 语句并添加分类注释
  - `niuma/agent/context.ts`、`niuma/agent/loop.ts`、`niuma/agent/memory.ts`、`niuma/agent/skills.ts`、`niuma/agent/subagent.ts`
  - `niuma/agent/tools/base.ts`、`niuma/bus/events.ts`
  - `niuma/config/json5-loader.ts`、`niuma/config/loader.ts`、`niuma/config/manager.ts`、`niuma/config/merger.ts`
  - `niuma/providers/openai.ts`、`niuma/session/manager.ts`
- 修改 11 个测试文件：规范化 import 语句并添加分类注释
  - `niuma/__tests__/data-tools.test.ts`、`niuma/__tests__/env-resolver.test.ts`、`niuma/__tests__/merger.test.ts`
  - `niuma/__tests__/message-tool.test.ts`、`niuma/__tests__/network-tools.test.ts`、`niuma/__tests__/tool-registry.test.ts`
  - `niuma/__tests__/types.test.ts`、`niuma/__tests__/utils.test.ts`、`niuma/__tests__/web-tools.test.ts`
- 修改 1 个配置文件：`.vscode/settings.json`（添加新的拼写检查词汇）

### 依赖变更
- 需要安装新的 npm 依赖：archiver、adm-zip、tar、ping、js-yaml、fs-extra、deepmerge（部分已存在）

### 功能扩展
- 扩展 Agent 的工具注册表，增加 9 个新工具

### 质量指标
- 测试通过率：318/318（100%）
- TypeScript 类型检查：通过
- 消除 `any` 类型：26 处
- 减少代码行数：33 行（使用 deepmerge 库替代自定义实现）

### 兼容性
- 不影响现有功能和 API，纯新增功能和代码质量改进