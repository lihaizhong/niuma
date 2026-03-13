# 工具使用示例

本文档提供了 Niuma 内置工具的使用示例。

## 文件系统工具

### read_file

读取文件内容，支持行号范围读取。

```typescript
// 读取完整文件
const content = await readFileTool.execute({ path: '/path/to/file.txt' })

// 读取指定行号范围
const content = await readFileTool.execute({
  path: '/path/to/file.txt',
  offset: 10,  // 从第 10 行开始
  limit: 20    // 读取 20 行
})
```

### write_file

创建或覆盖文件。

```typescript
// 创建新文件
await writeFileTool.execute({
  path: '/path/to/new-file.txt',
  content: 'Hello, World!'
})

// 自动创建目录
await writeFileTool.execute({
  path: '/path/to/nested/dir/file.txt',
  content: 'Content'
})
```

### edit_file

精确修改文件的特定部分。

```typescript
// 替换指定内容
await editFileTool.execute({
  path: '/path/to/file.txt',
  old_string: 'Hello, World!',
  new_string: 'Hi, World!'
})
```

### list_dir

列出目录内容，支持完整的 glob 语法（使用 fast-glob）。

```typescript
// 列出根目录
const content = await listDirTool.execute({ path: '/path/to/dir' })

// 递归列出
const content = await listDirTool.execute({
  path: '/path/to/dir',
  recursive: true
})

// 使用简单模式过滤
const content = await listDirTool.execute({
  path: '/path/to/dir',
  pattern: '*.ts'
})

// 使用完整的 glob 语法
const content = await listDirTool.execute({
  path: '/path/to/dir',
  pattern: '**/*.test.{ts,js}',  // 递归匹配所有测试文件
  recursive: true
})

// 使用 ignore 忽略特定文件
const content = await listDirTool.execute({
  path: '/path/to/dir',
  pattern: '**/*.ts',
  ignore: ['**/node_modules/**', '**/*.test.ts']  // 忽略 node_modules 和测试文件
})
```

### file_search

在文件中搜索内容，支持正则表达式。

```typescript
// 基本搜索
const result = await fileSearchTool.execute({
  path: '/path/to/file.txt',
  pattern: 'function\\s+\\w+'  // 搜索函数定义
})

// 大小写敏感搜索
const result = await fileSearchTool.execute({
  path: '/path/to/file.txt',
  pattern: 'Error',
  caseSensitive: true
})

// 限制匹配数量
const result = await fileSearchTool.execute({
  path: '/path/to/file.txt',
  pattern: 'TODO',
  maxMatches: 50
})

// 搜索多个匹配项
const result = await fileSearchTool.execute({
  path: '/path/to/file.txt',
  pattern: '(import|export)\\s+.*from'
})
```

**安全特性：**
- 文件大小限制：10MB
- 正则表达式安全检查：防止 ReDoS 攻击
- 单行匹配数限制：100 个

### file_move

移动文件到新位置。

```typescript
// 移动文件
const result = await fileMoveTool.execute({
  source: '/path/to/source.txt',
  dest: '/path/to/destination.txt'
})

// 移动并重命名
const result = await fileMoveTool.execute({
  source: '/path/to/source.txt',
  dest: '/path/to/renamed.txt'
})

// 自动创建目标目录
const result = await fileMoveTool.execute({
  source: '/path/to/source.txt',
  dest: '/path/to/nested/dir/file.txt'
})
```

**安全特性：**
- 文件大小限制：100MB
- 使用 fs.rename 保证原子性（同文件系统）
- 跨设备移动自动回退到复制+删除

### file_copy

复制文件到新位置。

```typescript
// 复制文件
const result = await fileCopyTool.execute({
  source: '/path/to/source.txt',
  dest: '/path/to/destination.txt'
})

// 复制并重命名
const result = await fileCopyTool.execute({
  source: '/path/to/source.txt',
  dest: '/path/to/renamed.txt'
})

// 自动创建目标目录
const result = await fileCopyTool.execute({
  source: '/path/to/source.txt',
  dest: '/path/to/nested/dir/file.txt'
})
```

**安全特性：**
- 文件大小限制：100MB
- 自动创建目标目录

### file_delete

安全删除文件（需要确认）。

```typescript
// 删除文件（已确认）
const result = await fileDeleteTool.execute({
  path: '/path/to/file.txt',
  confirm: true  // 必须设置为 true
})

// 尝试删除未确认（会抛出错误）
try {
  await fileDeleteTool.execute({
    path: '/path/to/file.txt',
    confirm: false  // 或不设置 confirm 参数
  })
} catch (error) {
  console.error('删除需要确认')
}
```

**安全特性：**
- 必须设置 `confirm: true` 才能执行
- 防止意外删除重要文件

### file_info

获取文件详细信息。

```typescript
// 获取文件信息
const result = await fileInfoTool.execute({ path: '/path/to/file.txt' })
const info = JSON.parse(result)

console.log('文件名:', info.name)
console.log('类型:', info.type)  // 'file' 或 'directory'
console.log('大小:', info.size)
console.log('修改时间:', info.modified)
console.log('是否为文件:', info.isFile)
console.log('是否为目录:', info.isDirectory)
```

### dir_create

创建目录（支持递归）。

```typescript
// 创建单层目录
const result = await dirCreateTool.execute({
  path: '/path/to/newdir',
  recursive: false
})

// 递归创建目录（默认）
const result = await dirCreateTool.execute({
  path: '/path/to/nested/deep/dir',
  recursive: true  // 或省略，默认为 true
})

// 目录已存在不会报错
const result = await dirCreateTool.execute({
  path: '/path/to/existing-dir'
})
```

### dir_delete

安全删除目录（需要确认，支持递归）。

```typescript
// 删除空目录（已确认）
const result = await dirDeleteTool.execute({
  path: '/path/to/empty-dir',
  confirm: true,
  recursive: false
})

// 递归删除目录及其内容（已确认）
const result = await dirDeleteTool.execute({
  path: '/path/to/non-empty-dir',
  confirm: true,
  recursive: true
})

// 尝试删除非空目录但未设置递归（会抛出错误）
try {
  await dirDeleteTool.execute({
    path: '/path/to/non-empty-dir',
    confirm: true,
    recursive: false  // 目录不为空时会报错
  })
} catch (error) {
  console.error('目录不为空，请设置 recursive: true')
}
```

**安全特性：**
- 必须设置 `confirm: true` 才能执行
- 受保护路径列表（防止删除项目根目录、用户主目录、系统目录等）
- 递归删除需要显式设置

## Shell 工具

### exec

执行 Shell 命令，包含安全黑名单防护。

```typescript
// 执行简单命令
const result = await execTool.execute({
  command: 'echo',
  args: ['Hello, World!']
})

// 指定工作目录
const result = await execTool.execute({
  command: 'pwd',
  cwd: '/tmp'
})

// 设置环境变量
const result = await execTool.execute({
  command: 'echo',
  args: ['$MY_VAR'],
  env: { MY_VAR: 'test' }
})

// 超时控制
const result = await execTool.execute({
  command: 'sleep',
  args: ['10'],
  timeout: 5000  // 5 秒后超时
})

// 后台执行
const result = await execTool.execute({
  command: 'npm',
  args: ['run', 'dev'],
  runInBackground: true
})

// 严格模式（非零退出码抛出异常）
await execTool.execute({
  command: 'false',
  strict: true
})
```

**安全注意事项：**
- Shell 工具包含危险命令黑名单防护
- 以下命令会被拦截：`rm -rf`、`shutdown`、`reboot`、`poweroff`、`fork bomb` 等
- 使用 `strict: true` 可以确保命令执行失败时抛出异常

## Web 工具

### web_search

使用搜索引擎查找信息。

```typescript
// 基本搜索
const result = await webSearchTool.execute({
  query: 'TypeScript 教程',
  num: 10  // 返回 10 个结果
})
```

**环境变量：**
- `BRAVE_API_KEY`: Brave Search API 密钥（必需）

### web_fetch

获取和处理网页内容。

```typescript
// 获取网页内容
const result = await webFetchTool.execute({
  url: 'https://example.com'
})

// 提取文本内容
const result = await webFetchTool.execute({
  url: 'https://example.com',
  extractText: true
})

// 提取链接
const result = await webFetchTool.execute({
  url: 'https://example.com',
  extractLinks: true
})

// 提取图片
const result = await webFetchTool.execute({
  url: 'https://example.com',
  extractImages: true
})

// 提取元数据
const result = await webFetchTool.execute({
  url: 'https://example.com',
  extractMetadata: true
})

// 解析 JSON 响应
const result = await webFetchTool.execute({
  url: 'https://api.example.com/data',
  parseJson: true
})

// 自定义超时
const result = await webFetchTool.execute({
  url: 'https://example.com',
  timeout: 10000  // 10 秒
})
```

## 消息工具

### message

通过配置的渠道发送消息。

```typescript
// 发送简单消息
const result = await messageTool.execute({
  content: 'Hello, World!',
  channel: 'cli'
})

// 设置优先级
const result = await messageTool.execute({
  content: '重要消息',
  priority: 'high'
})

// 使用 Markdown
const result = await messageTool.execute({
  content: '**粗体** *斜体*',
  type: 'markdown'
})

// 添加标签
const result = await messageTool.execute({
  content: '测试消息',
  tags: ['test', 'demo']
})
```

## Agent 工具

### spawn

创建和管理子智能体。

```typescript
// 创建子智能体
const result = await spawnTool.execute({
  config: {
    name: 'test-agent',
    model: {
      provider: 'openai',
      model: 'gpt-4'
    }
  },
  task: '分析数据并生成报告'
})

// 限制工具权限
const result = await spawnTool.execute({
  config: {
    name: 'restricted-agent',
    tools: {
      allowed: ['read_file', 'write_file'],
      denied: ['exec', 'web_search']
    }
  }
})

// 设置超时
const result = await spawnTool.execute({
  config: { name: 'test-agent' },
  timeout: 60000  // 60 秒
})
```

### cron

管理定时任务。

```typescript
// 创建定时任务
const result = await cronTool.execute({
  action: 'create',
  cron: '0 * * * *',  // 每小时执行一次
  name: 'hourly-backup',
  handler: 'backupHandler',
  params: { source: '/data', destination: '/backup' }
})

// 列出所有任务
const result = await cronTool.execute({ action: 'list' })

// 更新任务
const result = await cronTool.execute({
  action: 'update',
  taskId: 'task-id',
  cron: '30 * * * *',  // 改为每小时的第 30 分钟
  enabled: true
})

// 暂停任务
const result = await cronTool.execute({
  action: 'pause',
  taskId: 'task-id'
})

// 恢复任务
const result = await cronTool.execute({
  action: 'resume',
  taskId: 'task-id'
})

// 删除任务
const result = await cronTool.execute({
  action: 'delete',
  taskId: 'task-id'
})
```

**Cron 表达式格式：**
- `* * * * *`: 分 时 日 月 星期
- `0 * * * *`: 每小时的第 0 分钟执行
- `0 0 * * *`: 每天午夜执行
- `0 0 * * 0`: 每周日凌晨执行
- `0 0 1 * *`: 每月 1 日凌晨执行

## 工具注册

所有工具通过 `ToolRegistry` 注册：

```typescript
import { ToolRegistry, registerBuiltinTools } from './agent/tools/registry.js'

const registry = new ToolRegistry()

// 注册所有内置工具
registerBuiltinTools(registry)

// 手动注册工具
registry.register(customTool)

// 执行工具
const result = await registry.execute('read_file', {
  path: '/path/to/file.txt'
})

// 获取所有工具定义
const definitions = registry.getDefinitions()
```

## 错误处理

所有工具可能抛出 `ToolExecutionError`：

```typescript
import { ToolExecutionError } from './types/error.js'

try {
  const result = await tool.execute(params)
} catch (error) {
  if (error instanceof ToolExecutionError) {
    console.error('工具执行失败:', error.message)
    console.error('工具名称:', error.toolName)
    console.error('错误详情:', error.details)
  }
}
```

## 安全最佳实践

1. **Shell 工具**：
   - 始终验证用户输入
   - 使用 `strict: true` 确保错误处理
   - 避免使用危险命令

2. **文件操作**：
   - 验证文件路径，防止路径遍历攻击
   - 限制工作目录范围
   - 使用绝对路径

3. **Web 请求**：
   - 设置合理的超时时间
   - 验证响应内容
   - 避免请求不可信的 URL

4. **消息发送**：
   - 验证消息内容
   - 使用适当的优先级
   - 记录敏感操作

5. **子智能体**：
   - 限制工具权限
   - 设置超时控制
   - 隔离工作区和会话