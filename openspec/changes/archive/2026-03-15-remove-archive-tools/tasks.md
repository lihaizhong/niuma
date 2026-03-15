## 1. 删除源代码文件

- [ ] 1.1 删除 `niuma/agent/tools/archive.ts` 文件
- [ ] 1.2 删除 `niuma/__tests__/archive-tools.test.ts` 测试文件
- [ ] 1.3 检查并删除其他可能的 archive 相关文件（如工具注册表中的引用）

## 2. 清理工具注册表

- [ ] 2.1 从工具注册表中移除 archive 工具的注册代码
- [ ] 2.2 从工具注册表中移除 extract 工具的注册代码
- [ ] 2.3 检查并清理所有对 ArchiveTool 和 ExtractTool 的引用

## 3. 更新依赖

- [ ] 3.1 从 package.json 中删除 adm-zip 依赖
- [ ] 3.2 从 package.json 中删除 archiver 依赖
- [ ] 3.3 从 package.json 中删除 tar 依赖
- [ ] 3.4 运行 `pnpm install` 清理依赖

## 4. 验证删除

- [ ] 4.1 运行 `pnpm build` 确保构建成功
- [ ] 4.2 运行 `pnpm type-check` 确保没有类型错误
- [ ] 4.3 运行 `pnpm lint` 确保代码规范检查通过
- [ ] 4.4 运行 `pnpm test` 确保所有测试通过（除了已删除的 archive 测试）

## 5. 更新文档

- [ ] 5.1 更新 CHANGELOG.md，添加 BREAKING CHANGE 记录
- [ ] 5.2 更新开发计划，移除 Phase 3.3 的完成状态
- [ ] 5.3 在 CHANGELOG 中提供 MCP Server 配置示例
- [ ] 5.4 更新 AGENTS.md，移除对 archive 工具的引用（如果有）

## 6. 清理遗留文件

- [ ] 6.1 检查 `dist/` 目录中是否有 archive 相关的编译产物并删除
- [ ] 6.2 检查 `.next/` 目录中是否有 archive 相关的缓存并删除
- [ ] 6.3 运行 `pnpm build` 重新构建，确保没有遗留引用

## 7. 最终验证

- [ ] 7.1 运行完整的测试套件（`pnpm test`）
- [ ] 7.2 确认所有测试通过
- [ ] 7.3 检查构建产物中不再包含 archive 相关代码
- [ ] 7.4 验证 package.json 中不再有压缩相关依赖