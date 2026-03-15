## Context

Niuma 项目当前使用 better-sqlite3 和 sqlite-vec 作为数据库和向量存储方案。better-sqlite3 是一个高性能的 SQLite 绑定，但需要编译原生模块，在跨平台部署时存在兼容性问题。sqlite-vec 是一个向量检索扩展，但目前版本仍处于 alpha 阶段（0.1.7-alpha.10），稳定性不足。

@sqliteai/sqlite-wasm 是基于 WebAssembly 的 SQLite 实现，提供了：
- 稳定的版本支持（当前版本 3.50.4）
- 跨平台兼容性（无需编译原生模块）
- 内置向量搜索功能
- 与现代构建工具（如 Vite）的良好集成

项目需要搭建 Vite 开发环境以支持 WASM 模块的加载和优化。

## Goals / Non-Goals

**Goals:**
- 迁移数据库引擎从 better-sqlite3 到 @sqliteai/sqlite-wasm
- 迁移向量检索从 sqlite-vec 到 @sqliteai/sqlite-wasm 内置支持
- 配置 Vite 开发环境以支持 WASM 模块
- 更新所有文档中的数据库引用

**Non-Goals:**
- 不实现新的数据库功能
- 不修改数据库架构（如果已定义）
- 不影响现有的文件系统存储方案（当前实际使用）
- 不添加新的向量检索功能

## Decisions

### D1: 使用 @sqliteai/sqlite-wasm 替代 better-sqlite3 + sqlite-vec

**决定**: 将 better-sqlite3 和 sqlite-vec 替换为 @sqliteai/sqlite-wasm

**理由**:
- **稳定性**: @sqliteai/sqlite-wasm 版本稳定，而 sqlite-vec 仍处于 alpha 阶段
- **跨平台**: WASM 版本无需编译原生模块，提供更好的跨平台兼容性
- **功能完整**: @sqliteai/sqlite-wasm 内置向量搜索功能，无需额外依赖
- **现代化**: WASM 是现代 Web 标准技术，未来发展前景良好
- **性能**: WASM 性能优秀，且支持现代浏览器和 Node.js 环境

**替代方案**: 继续使用 better-sqlite3，等待 sqlite-vec 稳定 → 拒绝，sqlite-vec 稳定时间不确定，且 better-sqlite3 跨平台问题依然存在

### D2: 配置 Vite 环境支持 WASM 模块

**决定**: 创建 vite.config.ts，配置 WASM 模块优化

**配置内容**:
```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': '/niuma',
    },
  },
  optimizeDeps: {
    include: ['@sqliteai/sqlite-wasm'],
  },
})
```

**理由**:
- **别名配置**: 提供 @ 别名，简化模块导入
- **依赖优化**: 预优化 @sqliteai/sqlite-wasm，提升加载性能
- **标准化**: 使用 Vite 标准配置，便于维护和扩展

**替代方案**: 不使用 Vite → 拒绝，WASM 模块需要构建工具支持，Vite 是最佳选择

### D3: 更新文档而非代码

**决定**: 当前项目实际使用文件系统存储（JSON 文件），仅更新文档中的数据库引用

**理由**:
- **当前状态**: better-sqlite3 和 sqlite-vec 仅在文档中提及，代码中未实际使用
- **风险最小**: 不修改代码，避免引入潜在问题
- **一致性**: 保持文档与未来实现的一致性
- **渐进式**: 为未来实际使用数据库做好准备

**替代方案**: 同时更新代码实现 → 拒绝，当前使用文件系统，无需立即实现数据库

### D4: 创建 OpenSpec 变更提案而非直接修改

**决定**: 为 OpenSpec 配置和归档文件创建变更提案，而非直接修改

**理由**:
- **合规性**: 遵循 OpenSpec 工作流，禁止直接修改 OpenSpec 文件
- **可追溯性**: 变更提案提供完整的变更历史和理由
- **可审核**: 变更提案可被审核和讨论
- **标准化**: 使用标准化的 OpenSpec 流程

**替代方案**: 直接修改 OpenSpec 文件 → 拒绝，违反工作流约束

## Implementation Plan

### Phase 1: 依赖管理
1. 移除 better-sqlite3 和 sqlite-vec 依赖
2. 移除 @types/better-sqlite3 类型定义
3. 安装 @sqliteai/sqlite-wasm 依赖
4. 安装 Vite 和相关开发依赖

### Phase 2: Vite 配置
1. 创建 vite.config.ts
2. 配置模块别名和依赖优化

### Phase 3: 文档更新
1. 更新 docs/architecture-design.md
2. 更新 docs/niuma-development-plan.md
3. 更新 AGENTS.md
4. 更新 README.md（如有引用）

### Phase 4: OpenSpec 更新
1. 创建变更提案（proposal.md）
2. 创建设计文档（design.md）
3. 创建任务清单（tasks.md）
4. 等待变更审核和归档

## Migration Notes

### 向量检索 API 变更

**旧 API (sqlite-vec)**:
```typescript
// 示例（假设的 API）
import sqliteVec from 'sqlite-vec'
// 使用 sqliteVec 提供的向量检索功能
```

**新 API (@sqliteai/sqlite-wasm)**:
```typescript
import { Sqlite3 } from '@sqliteai/sqlite-wasm'
// 使用内置的向量搜索功能
```

### 数据库初始化变更

**旧方式 (better-sqlite3)**:
```typescript
import Database from 'better-sqlite3'
const db = new Database(':memory:')
```

**新方式 (@sqliteai/sqlite-wasm)**:
```typescript
import { Sqlite3 } from '@sqliteai/sqlite-wasm'
const Sqlite3 = await sqlite3InitModule()
const db = new Sqlite3.Database(':memory:')
```

## Testing Strategy

1. **依赖验证**: 确认所有依赖正确安装和移除
2. **配置验证**: 确认 Vite 配置正确加载
3. **文档验证**: 确认所有文档中的引用已更新
4. **构建验证**: 确认 TypeScript 编译和 Vite 构建正常

## Rollback Plan

如果迁移出现问题，可以回滚到 better-sqlite3 + sqlite-vec：
1. 恢复 package.json 中的依赖
2. 删除 vite.config.ts
3. 恢复文档中的引用
4. 运行 pnpm install 重新安装依赖