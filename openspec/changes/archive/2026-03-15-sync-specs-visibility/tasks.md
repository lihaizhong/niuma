## 1. 规格文件更新

- [x] 1.1 更新 openspec/specs/agent-memory/spec.md，移除 readLongTerm() 和 writeLongTerm()
- [x] 1.2 更新 openspec/specs/agent-context/spec.md，将 buildSystemPrompt() 改为 buildSystemPromptAsync()
- [ ] 1.3 验证规格文件格式正确（运行 openspec validate）

## 2. 代码重构

- [x] 2.1 整理 niuma/agent/memory.ts 的属性顺序（private → 构造函数）
- [x] 2.2 整理 niuma/agent/memory.ts 的公共方法顺序（文件操作 → 记忆整合）
- [x] 2.3 整理 niuma/agent/memory.ts 的私有方法顺序（文件操作 → 辅助方法）
- [ ] 2.4 验证代码格式符合 TypeScript 规范（运行 pnpm lint）

## 3. Git 历史审查

- [x] 3.1 审查相关文件的 git 提交历史（50c85d3, 57de5d5）
- [x] 3.2 确认规格更新与代码历史演进一致
- [x] 3.3 记录重要的重构决策和理由

## 4. 验证测试

- [ ] 4.1 运行类型检查（pnpm type-check）
- [ ] 4.2 运行单元测试（pnpm test）
- [ ] 4.3 验证 OpenSpec 规格有效性（openspec validate）

## 5. 文档和提交

- [x] 5.1 更新相关文档（在规格中添加历史背景）
- [ ] 5.2 提交代码变更（使用 Conventional Commits 规范）
- [ ] 5.3 创建 Pull Request 并添加审查者