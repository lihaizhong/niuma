# 快速参考

本文档提供常用命令、Subagent 映射和检查清单的快速参考。

---

## 一、常用命令

### OpenSpec 命令

| 命令 | 说明 | 使用场景 |
|------|------|----------|
| `/opsx:explore` | 探索问题空间 | 需求不明确，需要探索 |
| `/opsx:propose` | 创建变更提案 | 开始新功能开发 |
| `/opsx:apply` | 实施变更任务 | 执行提案中的任务 |
| `/opsx:archive` | 归档完成的变更 | 功能开发完成 |

### Git 命令

| 命令 | 说明 | 使用场景 |
|------|------|----------|
| `git status` | 查看状态 | 检查修改 |
| `git add` | 添加文件 | 暂存修改 |
| `git commit` | 提交修改 | 保存修改 |
| `git push` | 推送修改 | 同步到远程 |
| `git log` | 查看历史 | 查看提交 |

### NPM 命令

| 命令 | 说明 | 使用场景 |
|------|------|----------|
| `npm install` | 安装依赖 | 安装包 |
| `npm run dev` | 开发模式 | 启动开发服务器 |
| `npm run build` | 构建 | 构建项目 |
| `npm test` | 运行测试 | 执行测试 |

---

## 二、Subagent 映射

### 任务类型 → Subagent

| 任务类型 | 推荐 Subagent | 备选 Subagent |
|----------|--------------|--------------|
| 规划分析 | `plan-agent` | `general-purpose` |
| 代码探索 | `explore-agent` | `search-specialist` |
| UI 设计 | `ui-designer` | `frontend-developer` |
| API 设计 | `api-designer` | `backend-developer` |
| 前端开发 | `frontend-developer` | `fullstack-developer` |
| 后端开发 | `backend-developer` | `fullstack-developer` |
| 全栈功能 | `fullstack-developer` | - |
| 前端测试 | `frontend-tester` | - |
| 代码审查 | `code-reviewer` | - |
| 深度研究 | `search-specialist` | - |
| 通用任务 | `general-purpose` | - |

### 框架/技术 → Subagent

| 技术 | Subagent | 说明 |
|------|----------|------|
| React | `frontend-developer` | React 开发 |
| Vue | `frontend-developer` | Vue 开发 |
| Angular | `frontend-developer` | Angular 开发 |
| Node.js | `backend-developer` | Node.js 开发 |
| Express | `backend-developer` | Express 开发 |
| FastAPI | `backend-developer` | FastAPI 开发 |

---

## 三、硬约束检查清单

### 开发前检查

```
[ ] 有 OpenSpec 变更？
[ ] 变更包含 proposal.md？
[ ] 变更包含 design.md？
[ ] 变更包含 specs/？
[ ] 变更包含 tasks.md？
[ ] 理解任务需求？
[ ] 选择合适 subagent？
```

### 开发中检查

```
[ ] 只修改变更范围文件？
[ ] 代码风格符合规范？
[ ] 变更保持最小化？
[ ] 及时更新 tasks.md？
[ ] 处理阻塞问题？
```

### 开发后检查

```
[ ] tasks.md 已更新？
[ ] 代码已测试？
[ ] 前端已调用 frontend-tester？
[ ] 代码已调用 code-reviewer？
[ ] 文档已更新？
[ ] 可回滚？
```

---

## 四、任务流程速查

### 前端开发流程

```
1. ui-designer 设计
2. frontend-developer 实现
3. frontend-tester 验证
4. code-reviewer 审查
```

### 后端开发流程

```
1. api-designer 设计
2. backend-developer 实现
3. code-reviewer 审查
```

### 全栈开发流程

```
1. api-designer 设计 API
2. fullstack-developer 实现后端
3. fullstack-developer 实现前端
4. frontend-tester 验证
5. code-reviewer 审查
```

### 调研流程

```
1. explore-agent 探索
2. plan-agent 规划
3. /opsx:propose 创建提案
```

---

## 五、文件操作规则

### 允许的操作

```yaml
读取:
  - 任何项目文件
  - 配置文件
  - 文档文件

创建:
  - proposal.md 中定义的文件
  - 测试文件
  - 文档文件

修改:
  - 变更范围内的文件
  - proposal.md
  - tasks.md
```

### 禁止的操作

```yaml
删除:
  - ❌ 未在 proposal 中定义的文件
  - ❌ 系统文件
  - ❌ 配置文件

修改:
  - ❌ 变更范围外的文件
  - ❌ .gitignore
  - ❌ package.json（除非在提案中）
```

### 需要确认的操作

```yaml
修改:
  - ⚠️ package.json
  - ⚠️ tsconfig.json
  - ⚠️ .gitignore
  - ⚠️ 锁文件
```

---

## 六、代码规范速查

### TypeScript

```typescript
// ✅ 好的实践
interface User {
  id: string;
  name: string;
}

async function getUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// ❌ 坏的实践
const user: any = getUser(id);
function processData(input) {
  return input * 2;
}
```

### Shell 命令

```bash
# ✅ 允许
ls, cat, grep, mkdir
npm, pnpm, git status

# ❌ 禁止
rm -rf, dd if=, shutdown
git push (需确认)
```

### 路径

```yaml
# ✅ 允许
workspace/**
/tmp/**
~/.niuma/**

# ❌ 禁止
~/.ssh/**
~/.gnupg/**
/etc/**
**/.env
**/credentials*
```

---

## 七、常用代码模式

### 错误处理

```typescript
// ✅ 正确的错误处理
async function fetchData(url: string): Promise<unknown> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
}

// ❌ 错误的错误处理
async function fetchData(url: string) {
  const response = await fetch(url);
  return response.json();
}
```

### 类型定义

```typescript
// ✅ 明确的类型定义
interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function getResult<T>(data: T): Result<T> {
  return { success: true, data };
}

// ❌ 模糊的类型定义
function getResult(data) {
  return { success: true, data };
}
```

### 异步操作

```typescript
// ✅ 正确的异步操作
async function processMultiple(items: string[]): Promise<unknown[]> {
  return Promise.all(items.map(item => processItem(item)));
}

// ❌ 错误的异步操作
async function processMultiple(items) {
  const results = [];
  for (const item of items) {
    results.push(await processItem(item));
  }
  return results;
}
```

---

## 八、调试技巧

### 日志输出

```typescript
// ✅ 结构化日志
console.log('[Component] Rendering with props:', props);
console.warn('[Component] Invalid value:', value);
console.error('[Component] Failed to fetch:', error);

// ❌ 非结构化日志
console.log('Rendering');
console.log('Invalid value');
console.log('Error');
```

### 调试工具

```typescript
// ✅ 使用调试库
import debug from 'debug';
const log = debug('app:component');

log('Rendering with props:', props);

// ❌ 随意 console.log
console.log('Rendering');
```

---

## 九、性能优化技巧

### 避免不必要的渲染

```typescript
// ✅ 使用 memo
import { memo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  return <div>{JSON.stringify(data)}</div>;
});
```

### 避免不必要的计算

```typescript
// ✅ 使用 useMemo
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

### 避免不必要的重新创建

```typescript
// ✅ 使用 useCallback
const handleClick = useCallback(() => {
  console.log('Clicked');
}, []);
```

---

## 十、安全最佳实践

### 输入验证

```typescript
// ✅ 验证输入
function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '');
}

// ❌ 不验证输入
function processInput(input: string) {
  return input;
}
```

### SQL 注入防护

```typescript
// ✅ 使用参数化查询
const result = await db.query(
  'SELECT * FROM users WHERE id = ?',
  [userId]
);

// ❌ 字符串拼接
const result = await db.query(
  `SELECT * FROM users WHERE id = '${userId}'`
);
```

### XSS 防护

```typescript
// ✅ 转义输出
const safeHTML = escapeHTML(userInput);

// ❌ 直接输出
const unsafeHTML = userInput;
```

---

## 十一、常见问题速查

### Q: 如何选择 subagent？

**A:** 根据任务类型选择：
- 设计 → `ui-designer` 或 `api-designer`
- 实现 → `frontend-developer` 或 `backend-developer`
- 测试 → `frontend-tester`
- 审查 → `code-reviewer`

### Q: 何时需要并行执行？

**A:** 多个独立任务，无依赖关系

### Q: 如何处理阻塞？

**A:** 更新 tasks.md，记录阻塞原因，请求指导

### Q: 如何确保代码质量？

**A:** 调用 `code-reviewer` 审查代码

### Q: 如何处理超时？

**A:** 分解任务，增加超时时间

---

## 十二、常用命令组合

### 提交代码

```bash
git status
git add .
git commit -m "feat: 实现新功能"
git push
```

### 安装依赖

```bash
pnpm install
npm install
yarn install
```

### 运行测试

```bash
pnpm test
npm test
yarn test
```

### 构建项目

```bash
pnpm build
npm run build
yarn build
```

---

## 十三、版本管理

### 提交信息格式

```
<type>: <description>

[type]:
  feat: 新功能
  fix: 修复 bug
  refactor: 重构
  docs: 文档
  style: 格式
  test: 测试
  chore: 构建/工具
```

### 版本号格式

```
<major>.<minor>.<patch>
- major: 不兼容变更
- minor: 向后兼容的功能
- patch: 向后兼容的 bug 修复
```