# 工具安全指南

本文档提供了使用 Niuma 内置工具时的安全注意事项和最佳实践。

## 概述

Niuma 提供了一套强大的内置工具，包括文件系统操作、Shell 命令执行、Web 请求等功能。虽然这些工具为 Agent 提供了强大的能力，但也需要谨慎使用以避免安全风险。

## Shell 工具安全

### 危险命令黑名单

Shell 工具实现了危险命令黑名单防护，以下命令会被拦截或要求用户确认：

| 命令模式 | 描述 | 处理方式 |
|---------|------|---------|
| `rm -rf`, `rm -r` | 递归删除文件/目录 | 要求确认 |
| `del /f`, `del /q` | Windows 删除命令 | 要求确认 |
| `rmdir /s` | Windows 删除目录 | 要求确认 |
| `shutdown` | 系统关机 | 拒绝执行 |
| `reboot` | 系统重启 | 拒绝执行 |
| `poweroff` | 系统电源 | 拒绝执行 |
| `:(){ :|:& };:` | Fork Bomb | 拒绝执行 |
| `mkfs` | 格式化文件系统 | 拒绝执行 |
| `dd if=` | 直接写入磁盘 | 要求确认 |

### 安全最佳实践

1. **使用严格模式**
   ```typescript
   await execTool.execute({
     command: 'some-command',
     args: ['arg1', 'arg2'],
     strict: true  // 非零退出码抛出异常
   })
   ```

2. **限制工作目录**
   ```typescript
   await execTool.execute({
     command: 'ls',
     cwd: '/safe/directory'  // 限制在安全目录
   })
   ```

3. **设置超时**
   ```typescript
   await execTool.execute({
     command: 'long-running',
     timeout: 30000  // 30 秒超时
   })
   ```

4. **避免使用 eval 或类似功能**
   ```typescript
   // 危险：不要这样做
   await execTool.execute({
     command: 'eval',
     args: [userInput]
   })

   // 安全：使用参数化命令
   await execTool.execute({
     command: 'safe-command',
     args: [validatedArg1, validatedArg2]
   })
   ```

## 文件系统工具安全

### 路径遍历防护

文件系统工具支持绝对路径和相对路径，但需要防止路径遍历攻击：

```typescript
// 危险：用户可能通过 ../ 访问系统文件
await readFileTool.execute({ path: userPath })

// 安全：验证和规范化路径
import { resolve, join } from 'path'

function safePath(baseDir: string, userPath: string): string {
  const resolvedPath = resolve(baseDir, userPath)
  if (!resolvedPath.startsWith(baseDir)) {
    throw new Error('路径超出允许范围')
  }
  return resolvedPath
}
```

### 文件权限

```typescript
// 始终检查文件权限
try {
  await readFileTool.execute({ path: '/sensitive/file.txt' })
} catch (error) {
  if (error instanceof ToolExecutionError) {
    // 处理权限错误
  }
}
```

### 大文件处理

```typescript
// 使用分页读取大文件
const content = await readFileTool.execute({
  path: '/large/file.txt',
  offset: 0,
  limit: 1000  // 只读取前 1000 行
})
```

## Web 工具安全

### URL 验证

```typescript
// 危险：未验证的 URL
await webFetchTool.execute({ url: userInput })

// 安全：验证 URL
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

if (isValidUrl(userInput)) {
  await webFetchTool.execute({ url: userInput })
}
```

### 限制请求

```typescript
// 设置超时
await webFetchTool.execute({
  url: 'https://example.com',
  timeout: 10000  // 10 秒
})

// 限制响应大小（通过实现内容限制）
```

### API 密钥管理

```typescript
// 使用环境变量存储 API 密钥
process.env.BRAVE_API_KEY = 'your-api-key'

// 不要在代码中硬编码密钥
// ❌ 错误
const apiKey = 'hardcoded-key'

// ✅ 正确
const apiKey = process.env.BRAVE_API_KEY
```

### HTTPS 验证

```typescript
// WebFetchTool 默认验证 SSL 证书
// 对于内部网络，可能需要禁用验证（谨慎使用）
```

## 消息工具安全

### 内容验证

```typescript
// 验证消息内容
function sanitizeMessage(content: string): string {
  // 移除危险内容
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
}

await messageTool.execute({
  content: sanitizeMessage(userInput)
})
```

### 渠道权限

```typescript
// 验证渠道权限
if (allowedChannels.includes(channel)) {
  await messageTool.execute({
    content: message,
    channel
  })
}
```

## Cron 工具安全

### 任务验证

```typescript
// 验证 Cron 表达式
import { validate } from 'node-cron'

if (validate(cronExpression)) {
  await cronTool.execute({
    action: 'create',
    cron: cronExpression,
    name: 'safe-task',
    handler: 'safeHandler'
  })
}
```

### 任务隔离

```typescript
// 使用独立的处理器函数
async function safeTaskHandler(params: any): Promise<void> {
  try {
    // 执行任务
  } catch (error) {
    // 记录错误，不影响其他任务
    logger.error({ error }, '任务执行失败')
  }
}
```

### 频率限制

```typescript
// 避免过于频繁的任务
// ❌ 危险：每秒执行
cron: '* * * * * *'

// ✅ 安全：每小时执行
cron: '0 * * * *'
```

## 通用安全原则

### 1. 最小权限原则

只授予完成任务所需的最小权限：

```typescript
// ❌ 危险：授予所有权限
const allPermissions = {
  tools: { allowed: ['*'] },
  paths: { allowed: ['/*'] }
}

// ✅ 安全：授予特定权限
const limitedPermissions = {
  tools: { allowed: ['read_file'] },
  paths: { allowed: ['/safe/directory/*'] }
}
```

### 2. 输入验证

始终验证用户输入：

```typescript
function validateInput(input: any): boolean {
  // 验证类型、格式、范围等
  return true
}

if (validateInput(userInput)) {
  await tool.execute(userInput)
}
```

### 3. 错误处理

正确处理错误，避免信息泄露：

```typescript
try {
  await tool.execute(params)
} catch (error) {
  // ❌ 危险：泄露系统信息
  console.error(error.stack)

  // ✅ 安全：记录错误但不泄露敏感信息
  logger.error({ error: error.message }, '工具执行失败')
}
```

### 4. 日志记录

记录所有重要操作：

```typescript
logger.info({
  tool: 'read_file',
  path: filePath,
  userId: currentUser.id
}, '文件读取操作')
```

### 5. 审计追踪

维护审计日志：

```typescript
// 记录所有工具执行
auditLog.log({
  timestamp: new Date(),
  tool: toolName,
  user: userId,
  action: 'execute',
  result: 'success' | 'failure'
})
```

## 安全检查清单

在使用工具前，请检查：

- [ ] 是否验证了所有用户输入？
- [ ] 是否限制了工作目录/文件路径？
- [ ] 是否设置了合理的超时时间？
- [ ] 是否使用了严格模式（Shell 工具）？
- [ ] 是否限制了工具权限？
- [ ] 是否记录了审计日志？
- [ ] 是否正确处理了错误？
- [ ] 是否使用了安全的 URL？
- [ ] 是否隔离了敏感数据？
- [ ] 是否定期审查安全策略？

## 紧急响应

如果发现安全漏洞：

1. 立即停止相关工具的使用
2. 记录受影响的数据和操作
3. 分析漏洞原因
4. 修复漏洞
5. 通知相关用户
6. 更新安全策略

## 参考资料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)