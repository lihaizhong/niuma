## Context

当前 `niuma/agent/tools/filesystem.ts` 已实现 4 个基础工具（read_file、write_file、edit_file、list_dir）。这些工具基于 Tool 抽象类，通过工具注册表自动注册到 Agent 系统。

项目使用 TypeScript 严格模式，遵循 nanobot 的 Tool 模式。文件系统操作依赖 Node.js 原生 `fs` 和 `fs/promises` 模块，以及 `path` 模块进行路径处理。

## Goals / Non-Goals

**Goals:**
- 扩展 filesystem-tools，新增 7 个高级文件操作工具
- 保持与现有工具一致的 API 设计和错误处理模式
- 确保所有工具有完整的类型定义和 JSDoc 注释
- 为每个工具添加全面的单元测试
- 实现安全防护机制（特别是删除操作）

**Non-Goals:**
- 不实现文件监控功能
- 不处理符号链接的特殊情况
- 不添加文件版本控制或备份功能
- 不支持跨文件系统操作

## Decisions

### 1. 工具实现方式

**决策**: 在 `filesystem.ts` 中直接添加 7 个新工具类，每个工具继承 `SimpleTool` 抽象类

**理由**:
- 与现有工具保持一致
- SimpleTool 提供了简洁的实现方式（单次执行）
- 便于自动注册到工具注册表

**替代方案**: 为每个工具创建独立文件
- **优势**: 文件更小，职责更清晰
- **劣势**: 增加导入复杂度，与现有模式不一致

### 2. 文件搜索实现

**决策**: 使用正则表达式进行内容搜索，支持大小写敏感/不敏感选项

**理由**:
- 正则表达式提供强大的模式匹配能力
- 支持复杂的搜索需求（如多行匹配、字符类）
- 与常见的 grep 工具行为一致

**替代方案**: 使用字符串匹配
- **优势**: 实现简单，性能更好
- **劣势**: 功能受限，无法支持复杂模式

### 3. 危险操作的安全确认

**决策**: `file_delete` 和 `dir_delete` 添加 `confirm` 参数，必须显式设置为 `true` 才能执行

**理由**:
- 防止意外删除重要文件
- 参考 nanobot 的安全设计
- 提供明确的操作确认机制

**实现示例**:
```typescript
{
  name: "confirm",
  type: "boolean",
  description: "必须设置为 true 才能执行删除操作",
  required: true
}
```

### 4. 路径处理策略

**决策**: 所有工具接收绝对路径，内部使用 `path.resolve()` 转换相对路径

**理由**:
- 避免路径歧义
- 统一路径处理逻辑
- 与现有工具保持一致

**安全检查**:
- 验证路径是否在工作目录范围内
- 防止路径遍历攻击（`..`）

### 5. 错误处理

**决策**: 使用 `ToolExecutionError` 统一处理所有文件系统错误

**理由**:
- 与现有工具的错误处理一致
- 便于 Agent 识别和处理工具执行失败
- 提供清晰的错误信息

**错误类型**:
- 文件不存在
- 权限不足
- 路径无效
- 操作失败（如磁盘空间不足）

### 6. 单元测试策略

**决策**: 为每个工具创建独立的测试用例，覆盖正常流程和错误场景

**理由**:
- 确保工具行为正确
- 验证错误处理机制
- 便于维护和扩展

**测试覆盖场景**:
- 正常操作
- 文件/目录不存在
- 权限不足
- 参数验证失败
- 危险操作未确认

### 7. 使用 fast-glob 替代自定义 glob 匹配

**决策**: 在 `ListDirTool` 中使用 `fast-glob` 库替代当前简陋的自定义 glob 匹配实现

**理由**:
- **功能完整**: 支持完整的 glob 语法（`**`、`?`、`[]`、`{}`、extglob），而当前实现仅支持简单的 `*`
- **性能卓越**: fast-glob 是最快的 Node.js glob 库，使用异步并发处理，性能提升 2-10 倍
- **代码简洁**: 删除 40+ 行自定义 glob 匹配逻辑，代码更易维护
- **社区支持**: 广泛使用的成熟库，每周下载量数百万，问题少
- **TypeScript 支持**: 完整的类型定义，开发体验更好

**当前实现的问题**:
```typescript
// 简陋的 glob 匹配，只支持 *
new RegExp(pattern.replace(/\*/g, '.*'))

// 递归遍历，性能差
async function listDir(dir: string) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    // 处理每个条目...
  }
}
```

**fast-glob 的优势**:
| 特性 | 当前实现 | fast-glob |
|------|---------|-----------|
| glob 语法支持 | ❌ 仅 `*` | ✅ 完整支持（`**`、`?`、`[]`、`{}`、extglob） |
| 性能 | ❌ 递归遍历，同步操作 | ✅ 高性能，异步 + 并发，**最快** |
| TypeScript 支持 | ✅ 有 | ✅ 完整类型定义 |
| API 多样性 | ❌ 单一实现 | ✅ 同步、Promise、Stream 三种 API |
| ignore 功能 | ❌ 简陋的正则 | ✅ 完整的 negative patterns + ignore 选项 |
| 错误处理 | ✅ 有 | ✅ Error-tolerant，可配置 |

**实现示例**:
```typescript
import fg from 'fast-glob'

// 异步调用
const entries = await fg(['src/**/*.ts', '!**/node_modules/**'], {
  cwd: resolvedPath,
  ignore: ignorePatterns,
  absolute: false,
  onlyFiles: true,
  objectMode: true,
  stats: true
})
```

**迁移成本**:
- 依赖增加：~30KB（gzip 后）
- 修改时间：约 1 小时

**收益**:
- 代码减少：~50 行
- 性能提升：2-10 倍（大型项目）
- 功能完整度：从 20% → 100%

**替代方案**: 继续使用自定义实现
- **优势**: 无额外依赖
- **劣势**: 功能受限、性能差、维护成本高
- **结论**: 不推荐，fast-glob 的收益远超成本

## Risks / Trade-offs

### 风险 1: 大文件搜索性能问题
- **风险**: `file_search` 在大文件中搜索可能导致性能问题
- **缓解措施**: 限制搜索文件大小（如 10MB），超出范围拒绝搜索

### 风险 2: 递归删除误操作
- **风险**: `dir_delete` 递归删除可能误删大量文件
- **缓解措施**: 强制 `confirm` 参数，添加 `recursive` 参数（默认 false）

### 权衡 1: 同步 vs 异步
- **决策**: 使用 `fs/promises` 实现异步操作
- **理由**: 避免阻塞事件循环，提升并发性能
- **权衡**: 代码略复杂，但性能更好

### 权衡 2: 正则表达式 vs 字符串匹配
- **决策**: 使用正则表达式实现搜索
- **理由**: 功能更强大，满足复杂需求
- **权衡**: 性能略低，但对大多数场景可接受

## 实现架构

```
niuma/agent/tools/filessystem.ts
├── 现有工具
│   ├── ReadFileTool
│   ├── WriteFileTool
│   ├── EditFileTool
│   └── ListDirTool (需要使用 fast-glob 重构)
└── 新增工具
    ├── FileSearchTool
    ├── FileMoveTool
    ├── FileCopyTool
    ├── FileDeleteTool
    ├── FileInfoTool
    ├── DirCreateTool
    └── DirDeleteTool
```

## ListDirTool 重构实现

### 当前实现问题

```typescript
// 问题 1: 简陋的 glob 匹配，只支持 *
new RegExp(pattern.replace(/\*/g, '.*'))

// 问题 2: 递归遍历，性能差
async function listDir(dir: string, relativePath = ''): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    // 处理每个条目...
  }
}
```

### fast-glob 重构方案

```typescript
import fg from 'fast-glob'

/**
 * ListDir 工具：列出目录内容（使用 fast-glob 重构）
 */
export class ListDirTool extends BaseTool {
  readonly name = 'list_dir'
  readonly description = '列出目录中的文件和子目录。支持递归列出和 glob 模式过滤（使用 fast-glob）。'
  readonly parameters = z.object({
    path: z.string().describe('目录路径'),
    recursive: z.boolean().optional().describe('是否递归列出子目录'),
    pattern: z.string().optional().describe('文件过滤模式（glob 模式，支持完整语法）'),
    ignore: z.array(z.string()).optional().describe('忽略的模式（glob 模式）'),
  })

  async execute(args: {
    path: string
    recursive?: boolean
    pattern?: string
    ignore?: string[]
  }): Promise<string> {
    const { path, recursive = false, pattern, ignore = [] } = args
    const resolvedPath = resolvePath(path)

    try {
      // 检查路径是否存在且是目录
      const stats = await stat(resolvedPath)
      if (!stats.isDirectory()) {
        throw new ToolExecutionError(this.name, `路径不是目录: ${resolvedPath}`)
      }

      // 构建模式列表
      const patterns: string[] = []

      if (pattern) {
        // 使用用户提供的 glob 模式
        patterns.push(pattern)
      } else {
        // 默认列出所有文件和目录
        patterns.push(recursive ? '**/*' : '*')
      }

      // 使用 fast-glob 进行文件匹配
      const entries = await fg(patterns, {
        cwd: resolvedPath,
        ignore,
        absolute: false,
        onlyFiles: false,
        objectMode: true,
        stats: true,
        deep: recursive ? Infinity : 1,
        dot: true,
        caseSensitiveMatch: false,
        unique: true,
      })

      // 格式化输出
      const output = entries
        .map((entry) => {
          const typeStr = entry.dirent.isDirectory() ? '[DIR]' : '[FILE]'
          const sizeStr = entry.stats ? ` (${entry.stats.size} bytes)` : ''
          return `${typeStr} ${entry.path}${sizeStr}`
        })
        .join('\n')

      return output || '目录为空'
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error
      }
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new ToolExecutionError(this.name, `目录不存在: ${resolvedPath}`)
      }
      throw new ToolExecutionError(this.name, `列出目录失败: ${(error as Error).message}`)
    }
  }
}
```

### 支持的 glob 模式示例

```typescript
// 简单匹配
list_dir({ path: 'src', pattern: '*.ts' })        // src/*.ts

// 递归匹配
list_dir({ path: 'src', pattern: '**/*.ts' })     // src/**/*.ts

// 多扩展名
list_dir({ path: 'src', pattern: '*.{ts,tsx}' })  // src/*.{ts,tsx}

// 忽略 node_modules
list_dir({
  path: '.',
  pattern: '**/*.ts',
  ignore: ['**/node_modules/**']
})

// 只列出目录
list_dir({ path: 'src', recursive: true })
```

### 迁移检查清单

- [ ] 安装 fast-glob 依赖
- [ ] 重构 ListDirTool 的 pattern 和 ignore 处理逻辑
- [ ] 删除自定义的 glob 匹配正则表达式
- [ ] 删除递归遍历函数 listDir
- [ ] 添加 fast-glob 的 TypeScript 类型导入
- [ ] 更新工具描述，说明使用 fast-glob
- [ ] 测试各种 glob 模式（`*`、`**`、`?`、`[]`、`{}`）
- [ ] 测试 ignore 功能（negative patterns）
- [ ] 性能测试（对比迁移前后的速度）
- [ ] 确保向后兼容（现有调用仍然有效）

## 工具 API 设计

### file_search
```typescript
{
  path: string,           // 文件路径
  pattern: string,        // 搜索模式（正则表达式）
  caseSensitive: boolean, // 大小写敏感（默认 false）
  maxMatches: number      // 最大匹配数（默认 100）
}
```

### file_move
```typescript
{
  source: string,  // 源文件路径
  dest: string     // 目标路径
}
```

### file_copy
```typescript
{
  source: string,  // 源文件路径
  dest: string     // 目标路径
}
```

### file_delete
```typescript
{
  path: string,    // 文件路径
  confirm: boolean // 确认标志（必须为 true）
}
```

### file_info
```typescript
{
  path: string  // 文件路径
}
// 返回: { size, mtime, atime, ctime, mode, isFile, isDirectory }
```

### dir_create
```typescript
{
  path: string,      // 目录路径
  recursive: boolean // 递归创建（默认 true）
}
```

### dir_delete
```typescript
{
  path: string,      // 目录路径
  recursive: boolean, // 递归删除（默认 false）
  confirm: boolean    // 确认标志（必须为 true）
}
```

## Open Questions

无。所有设计决策已明确。