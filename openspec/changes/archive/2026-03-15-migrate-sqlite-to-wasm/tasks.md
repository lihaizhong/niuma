## 1. 依赖管理

- [x] 1.1 移除 better-sqlite3 依赖
- [x] 1.2 移除 sqlite-vec 依赖
- [x] 1.3 移除 @types/better-sqlite3 类型定义
- [x] 1.4 安装 @sqliteai/sqlite-wasm 依赖
- [x] 1.5 安装 Vite 开发依赖
- [x] 1.6 验证所有依赖正确安装

## 2. Vite 配置

- [x] 2.1 创建 vite.config.ts
- [x] 2.2 配置模块别名 (@)
- [x] 2.3 配置依赖优化 (@sqliteai/sqlite-wasm)
- [x] 2.4 验证 Vite 配置正确加载

## 3. 文档更新

- [x] 3.1 更新 docs/architecture-design.md 中的数据库引用
  - [x] 3.1.1 更新技术栈表格（better-sqlite3 → @sqliteai/sqlite-wasm）
  - [x] 3.1.2 更新章节标题和内容
  - [x] 3.1.3 更新替代方案对比表格
  - [x] 3.1.4 更新优点说明
  - [x] 3.1.5 更新改进建议
- [x] 3.2 更新 docs/niuma-development-plan.md 中的数据库引用
  - [x] 3.2.1 更新技术栈表格
  - [x] 3.2.2 更新示例配置文件
- [x] 3.3 更新 AGENTS.md 中的数据库引用
  - [x] 3.3.1 更新主要依赖表格
  - [x] 3.3.2 更新数据存储说明
- [x] 3.4 更新 README.md（如有引用）

## 4. OpenSpec 更新

- [x] 4.1 创建变更提案 (proposal.md)
- [x] 4.2 创建设计文档 (design.md)
- [x] 4.3 创建任务清单 (tasks.md)
- [x] 4.4 提交变更提案进行审核

**注意**: OpenSpec 归档内容（如 openspec/changes/archive/）不应修改，这些变更提案作为历史记录保留原样。

## 5. 验证

- [x] 5.1 运行 TypeScript 编译验证无错误
- [x] 5.2 运行 pnpm type-check 验证类型正确
- [x] 5.3 运行 pnpm lint 验证代码规范
- [x] 5.4 运行 pnpm build 验证构建成功
- [x] 5.5 运行 pnpm test 验证测试通过

**验证结果说明：**
- ✅ TypeScript 编译：通过
- ✅ 类型检查：通过（修复了预先存在的类型错误：niuma/__tests__/filesystem-tools.test.ts:364）
- ✅ 代码规范：通过（36个预先存在的警告，0个错误）
- ✅ 构建验证：成功
- ✅ 测试验证：全部通过（189/189 测试）
  - 修复了测试配置问题（vitest.config.ts）
  - 解决了测试环境冲突问题
  - 所有测试文件（12/12）通过

## 6. 归档

- [x] 6.1 完成所有任务并验证
- [x] 6.2 提交变更提案
- [ ] 6.3 等待审核和批准
- [ ] 6.4 归档变更并更新主规格