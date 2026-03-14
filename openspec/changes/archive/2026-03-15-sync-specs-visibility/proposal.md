## Why

OpenSpec 规格文件与实际代码实现存在不一致，特别是方法可见性不匹配。memory.ts 中的 `_readLongTerm()` 和 `_writeLongTerm()` 已改为私有方法，context.ts 中的 `_buildSystemPrompt()` 也改为私有方法，但规格文件仍将它们列为公共接口。这会导致规格失去准确性，影响后续开发和维护。

## Context

通过 git 历史分析，发现以下相关提交：

**最近的代码重构（50c85d3 - 2026-03-14）：**
- 重构了 5 个核心模块的代码结构
- 添加了清晰的注释分隔符（属性、构造函数、公共方法、私有方法）
- 统一了导入语句风格，移除 `node:` 前缀
- 将 `readLongTerm()` 和 `writeLongTerm()` 作为公共方法保留

**后续优化（57de5d5 - 2026-03-14）：**
- 用开源库 `fast-clean` 替代手写的对象清理逻辑
- 创建了通用 sanitize 工具函数（`niuma/utils/sanitize.ts`）
- 代码减少 61 行，提升可维护性和安全性

**当前未提交的修改：**
- 将 `readLongTerm()` 和 `writeLongTerm()` 改为私有方法（`_readLongTerm()` 和 `_writeLongTerm()`）
- 整理了 memory.ts 的代码顺序，符合标准 TypeScript 类结构
- 这些修改是为了更好地封装内部实现，只暴露必要的公共 API

## What Changes

- **移除规格中的私有方法接口**：从 `agent-memory` 和 `agent-context` 规格中移除私有方法的公共接口定义
- **更新 TypeScript Interfaces**：只保留实际公开的公共方法
- **整理 memory.ts 代码顺序**：按属性 → 构造函数 → 公共方法 → 私有方法的顺序重新组织

## Capabilities

### New Capabilities
无新增能力

### Modified Capabilities

- **agent-memory**: 移除 `readLongTerm()` 和 `writeLongTerm()` 的公共接口定义，因为它们已改为私有方法 `_readLongTerm()` 和 `_writeLongTerm()`
- **agent-context**: 将 `buildSystemPrompt()` 更新为 `buildSystemPromptAsync()`，因为实际的公共方法是异步版本，`_buildSystemPrompt()` 是私有方法

## Impact

- **文档准确性提升**：规格文件现在准确反映实际代码实现
- **维护成本降低**：开发人员无需在规格和代码之间进行映射
- **无破坏性变更**：这是纯粹的规格同步，不影响现有功能或 API