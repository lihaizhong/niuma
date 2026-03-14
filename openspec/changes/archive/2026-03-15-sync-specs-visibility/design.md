## Context

当前 OpenSpec 规格文件与实际代码实现存在不一致：

1. **memory.ts**：`_readLongTerm()` 和 `_writeLongTerm()` 已改为私有方法（以下划线开头），但规格中仍列为公共方法 `readLongTerm()` 和 `writeLongTerm()`
2. **context.ts**：`_buildSystemPrompt()` 是私有方法，实际的公共方法是 `buildSystemPromptAsync()`，但规格中只列出了 `buildSystemPrompt()`
3. **memory.ts 代码顺序**：方法和属性的排列不够规范，影响代码可读性

### Git 历史演进

**Phase 1: 初始实现（d35cf4e - 2026-03-10）**
- 实现 Phase 2 Agent Core 核心模块
- 包括 memory.ts、context.ts、loop.ts、skills.ts、subagent.ts
- 基础功能完成，代码结构相对简单

**Phase 2: 代码质量改进（50c85d3 - 2026-03-14）**
- 重构了 5 个核心模块的代码结构
- 添加了清晰的注释分隔符：
  ```
  // ============================================
  // 属性
  // ============================================
  // ============================================
  // 构造函数
  // ============================================
  // ============================================
  // 公共方法
  // ============================================
  ```
- 统一了导入语句风格（移除 `node:` 前缀）
- 将 `readLongTerm()` 和 `writeLongTerm()` 作为公共方法保留
- 文件变更统计：
  - context.ts: 366 行变更
  - loop.ts: 80 行变更
  - memory.ts: 343 行变更
  - skills.ts: 40 行变更
  - subagent.ts: 17 行变更

**Phase 3: 安全性提升（57de5d5 - 2026-03-14）**
- 用开源库 `fast-clean` 替代手写的对象清理逻辑
- 创建了通用 sanitize 工具函数（`niuma/utils/sanitize.ts`）
- 删除 memory.ts 中的 `_sanitizeObject` 方法（76 行代码）
- 代码减少 61 行，提升可维护性和安全性
- 提交信息：`refactor: 用开源库替代手写的对象清理逻辑`

**Phase 4: 当前状态（未提交）**
- 将 `readLongTerm()` 和 `writeLongTerm()` 改为私有方法
- 理由：这些方法是内部实现细节，不应该暴露为公共 API
- 整理了 memory.ts 的代码顺序，符合标准 TypeScript 类结构
- Git diff 显示：
  - 删除了公共方法 `readLongTerm()` 和 `writeLongTerm()`
  - 添加了私有方法 `_readLongTerm()` 和 `_writeLongTerm()`
  - 更新了所有内部调用点
  - 重新组织了方法顺序

## Goals / Non-Goals

**Goals:**
- 同步 OpenSpec 规格与实际代码实现
- 整理 memory.ts 的代码顺序，提高可读性
- 确保规格文件准确反映公共 API

**Non-Goals:**
- 不修改任何功能逻辑
- 不改变任何公共 API 的行为
- 不引入新的依赖或架构变更

## Decisions

### 1. 规格同步策略

**决策**：使用增量更新（delta spec）而非完全重写

**理由**：
- 只需要修改不一致的部分，降低风险
- 保持规格历史的可追溯性
- 更容易审查变更内容

**替代方案**：
- 完全重写规格：工作量更大，可能引入不必要的变更

### 2. 代码顺序组织

**决策**：按照标准 TypeScript 类结构重新组织 memory.ts

**顺序**：
1. 属性（按访问修饰符：private → protected → public）
2. 构造函数
3. 公共方法（按功能分组：文件操作 → 记忆整合）
4. 私有方法（按功能分组：文件操作 → 辅助方法）

**理由**：
- 符合 TypeScript 社区最佳实践
- 提高代码可读性和可维护性
- 与项目其他模块保持一致

**替代方案**：
- 保持原有顺序：不利于代码维护

### 3. 私有方法命名约定

**决策**：保持现有的下划线前缀约定（`_methodName`）

**理由**：
- 项目已采用此约定，保持一致性
- 明确区分公共和私有方法
- 符合 TypeScript 社区常见做法

## Risks / Trade-offs

### 风险 1：规格同步可能遗漏

**风险**：可能存在其他未发现的规格与代码不一致问题

**缓解措施**：
- 仔细审查相关的规格文件
- 运行 `openspec validate` 确保规格有效性
- 进行代码审查确保完整性

### 风险 2：代码顺序变更可能影响 Git 历史

**风险**：大量行号变更可能使 Git 历史难以追踪

**缓解措施**：
- 使用语义化的提交信息
- 在 commit message 中明确说明这是代码重构
- 保留所有方法的实现逻辑不变

### Trade-offs

**选择**：只修改规格中明确不一致的部分，而不是全面审查所有规格

**权衡**：
- 优点：变更范围小，风险低
- 缺点：可能遗漏其他不一致之处
- 缓解：后续定期进行规格-代码一致性检查

## Migration Plan

这是一个纯粹的规格同步和代码重构变更，无需迁移步骤。

### 实施步骤

1. 更新 `openspec/specs/agent-memory/spec.md`：
   - 移除 `readLongTerm()` 和 `writeLongTerm()` 的公共接口定义
   - 保留 `appendHistory()` 和 `getMemoryContext()` 的公共接口

2. 更新 `openspec/specs/agent-context/spec.md`：
   - 将 `buildSystemPrompt()` 更新为 `buildSystemPromptAsync()`
   - 确保返回类型为 `Promise<string>`

3. 整理 `niuma/agent/memory.ts`：
   - 重新排列属性和方法顺序
   - 保持所有实现逻辑不变

4. 验证：
   - 运行 `openspec validate` 确保规格有效性
   - 运行现有测试确保功能不变

### Rollback Strategy

如果出现问题，可以通过 Git 回滚到变更前的版本。

## Open Questions

无