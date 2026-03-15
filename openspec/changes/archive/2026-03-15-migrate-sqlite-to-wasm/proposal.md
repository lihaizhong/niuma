## Why

当前项目使用 better-sqlite3 和 sqlite-vec 作为数据库和向量存储方案。但 sqlite-vec 版本尚未稳定（0.1.7-alpha.10），且 better-sqlite3 的原生绑定在跨平台兼容性方面存在限制。为了提升系统的稳定性和跨平台兼容性，需要迁移到 @sqliteai/sqlite-wasm，它提供了：
- 稳定的版本支持
- WASM 跨平台兼容性
- 内置向量搜索功能
- 与 Vite 开发环境的良好集成

## What Changes

- 移除 `better-sqlite3` 和 `sqlite-vec` 依赖
- 安装 `@sqliteai/sqlite-wasm` 依赖
- 配置 Vite 环境（创建 `vite.config.ts`）
- 更新所有文档中的数据库引用：
  - `docs/architecture-design.md`
  - `docs/niuma-development-plan.md`
  - `AGENTS.md`
- 更新 OpenSpec 配置文件（`openspec/config.yaml`）
- 更新归档变更提案中的引用（`openspec/changes/archive/2026-03-10-core-infrastructure/proposal.md`）

## Capabilities

### New Capabilities

- `sqlite-wasm-integration`: WASM 版本的 SQLite 集成
- `vector-search`: 内置向量搜索支持
- `cross-platform-database`: 跨平台兼容的数据库解决方案

### Modified Capabilities

- `data-storage`: 数据库引擎从 better-sqlite3 迁移到 @sqliteai/sqlite-wasm
- `vector-retrieval`: 向量检索功能从 sqlite-vec 迁移到 @sqliteai/sqlite-wasm 内置支持

## Impact

- **代码**: 需要更新数据库初始化和使用代码（如有实际使用）
- **依赖**: 移除 better-sqlite3 和 sqlite-vec，添加 @sqliteai/sqlite-wasm
- **文档**: 更新 4 个文档文件和 2 个 OpenSpec 文件
- **配置**: 添加 vite.config.ts，更新 package.json
- **兼容**: WASM 版本提供更好的跨平台兼容性

## Non-goals

- 不实现新的数据库功能（仅迁移现有功能）
- 不修改数据库架构（如果已定义）
- 不影响现有的文件系统存储方案（当前实际使用）
- 不添加新的向量检索功能（仅更新现有功能说明）

## Acceptance Criteria

- [ ] better-sqlite3 和 sqlite-vec 依赖已移除
- [ ] @sqliteai/sqlite-wasm 依赖已安装
- [ ] vite.config.ts 已创建并配置
- [ ] 所有文档中的数据库引用已更新
- [ ] OpenSpec 配置和归档文件已更新
- [ ] TypeScript 编译无错误
- [ ] package.json 脚本正常工作