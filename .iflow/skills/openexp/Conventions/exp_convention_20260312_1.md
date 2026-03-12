---
id: exp_convention_20260312_1
type: convention
created: 2026-03-12T00:00:00Z
updated: 2026-03-12T00:00:00Z
confidence: 0.9
usage_count: 0
effective: true
tags: [convention, nodejs, import, best-practice]
project: niuma
batch_id: batch_20260312_1
convention_type: [格式, 结构]
enforcement_level: 强制
---

# 约定规范：Node.js 内建模块导入使用 node: 前缀

## 描述
统一 Node.js 内建模块的导入方式，使用 `node:` 前缀。这是 Node.js 官方推荐的最佳实践，可以明确区分内建模块和第三方模块，避免与同名 npm 包冲突，提高代码可读性。

## 规则详情

### 导入规范
- **内建模块导入**：必须使用 `node:` 前缀
  - 正确示例：`import { readFile } from 'node:fs'`
  - 正确示例：`import { join } from 'node:path'`
  - 正确示例：`import { EventEmitter } from 'node:events'`
  - 错误示例：`import { readFile } from 'fs'`
  - 错误示例：`import { join } from 'path'`
  - 错误示例：`import { EventEmitter } from 'events'`

- **支持的模块**：所有 Node.js 内建模块
  - `node:fs` / `node:fs/promises` - 文件系统
  - `node:path` - 路径处理
  - `node:os` - 操作系统信息
  - `node:crypto` - 加密功能
  - `node:events` - 事件处理
  - `node:child_process` - 子进程
  - `node:util` - 工具函数
  - `node:url` - URL 处理
  - `node:http` / `node:https` - HTTP/HTTPS
  - `node:stream` - 流处理
  - `node:buffer` - 缓冲区
  - 其他所有 Node.js 内建模块

### 格式规范
- **导入语句**：使用单引号 `'node:module'`
- **多行导入**：每个导入独立一行
- **命名导入**：优先使用命名导入

## 示例

### 正确示例
```typescript
// 单个模块导入
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// 多个命名导入
import {
  readFile,
  writeFile,
  mkdir
} from 'node:fs/promises'

// 默认导入
import { EventEmitter } from 'node:events'

// 子模块导入
import { createHash } from 'node:crypto'
```

### 错误示例
```typescript
// ❌ 缺少 node: 前缀
import { readFile } from 'fs'
import { join } from 'path'

// ❌ 混合使用（部分有前缀，部分没有）
import { existsSync } from 'node:fs'
import { join } from 'path'  // 缺少前缀
```

## 工具配置
- **ESLint 规则**：建议添加 `no-restricted-imports` 规则
  ```javascript
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['fs', 'path', 'os', 'crypto', 'events', 'child_process', 'util', 'url'],
            message: 'Use "node:" prefix for Node.js built-in modules'
          }
        ]
      }
    ]
  }
  ```
- **IDE 设置**：配置 VS Code 自动修复

## 优势
- ✅ 明确区分内建模块和第三方模块
- ✅ 避免与同名 npm 包的潜在冲突
- ✅ 提高代码可读性和可维护性
- ✅ 符合 Node.js 官方最佳实践
- ✅ 便于工具分析和优化

## 例外情况
- 目前无例外情况，所有 Node.js 内建模块都必须使用 `node:` 前缀

## 遵守统计
- 遵守率：100%（已统一修改）
- 违规次数：0（已修复）
- 最后检查：2026-03-12

## 修改记录
- 2026-03-12：首次制定规范，统一修改 7 个文件
  - `niuma/bus/events.ts`
  - `niuma/agent/tools/shell.ts`
  - `niuma/agent/tools/filesystem.ts`
  - `niuma/agent/subagent.ts`
  - `niuma/__tests__/filesystem-tools.test.ts`
  - `niuma/__tests__/tools-acceptance.test.ts`
  - `niuma/agent/skills.ts`