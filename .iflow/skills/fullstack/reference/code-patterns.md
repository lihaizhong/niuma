# 代码模式和最佳实践

本文档提供常用的代码模式和最佳实践参考。

> **快速命令参考：** [quick-reference.md](quick-reference.md)

---

## 目录

- [一、TypeScript 代码规范](#一typescript-代码规范)
- [二、错误处理模式](#二错误处理模式)
- [三、类型定义模式](#三类型定义模式)
- [四、异步操作模式](#四异步操作模式)
- [五、调试技巧](#五调试技巧)
- [六、性能优化技巧](#六性能优化技巧)
- [七、安全最佳实践](#七安全最佳实践)

---

## 一、TypeScript 代码规范

### 类型定义

```typescript
// ✅ 好的实践：明确的类型定义
interface User {
  id: string;
  name: string;
  email: string;
}

async function getUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// ❌ 坏的实践：使用 any
const user: any = getUser(id);
function processData(input) {
  return input * 2;
}
```

### 函数签名

```typescript
// ✅ 完整的类型签名
export async function createUser(
  data: CreateUserInput
): Promise<Result<User>> {
  // ...
}

// ✅ 使用泛型
export function wrapResult<T>(data: T): Result<T> {
  return { success: true, data };
}

// ❌ 缺少类型
export function createUser(data) {
  // ...
}
```

---

## 二、错误处理模式

### 基本错误处理

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

### Result 模式

```typescript
// ✅ Result 模式处理错误
interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

async function safeFetch<T>(url: string): Promise<Result<T>> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { 
        success: false, 
        error: new Error(`HTTP ${response.status}`) 
      };
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// 使用
const result = await safeFetch<User>('/api/users/1');
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

---

## 三、类型定义模式

### 泛型工具类型

```typescript
// ✅ 可复用的泛型类型
interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

function getResult<T>(data: T): Result<T> {
  return { success: true, data };
}

// ❌ 模糊的类型定义
function getResult(data) {
  return { success: true, data };
}
```

### 条件类型

```typescript
// ✅ 条件类型
type ApiResponse<T> = T extends { id: string }
  ? { success: true; data: T }
  : { success: false; error: string };

// ✅ 挑选和省略
type UserInput = Pick<User, 'name' | 'email'>;
type UserUpdate = Partial<Omit<User, 'id'>>;
```

---

## 四、异步操作模式

### 并行处理

```typescript
// ✅ 正确的异步并行操作
async function processMultiple(items: string[]): Promise<unknown[]> {
  return Promise.all(items.map(item => processItem(item)));
}

// ❌ 错误的串行处理（效率低）
async function processMultiple(items) {
  const results = [];
  for (const item of items) {
    results.push(await processItem(item));
  }
  return results;
}
```

### 错误处理

```typescript
// ✅ 使用 Promise.allSettled 处理部分失败
async function processMultipleSafe(items: string[]): Promise<PromiseSettledResult<unknown>[]> {
  return Promise.allSettled(items.map(item => processItem(item)));
}

// 处理结果
const results = await processMultipleSafe(items);
const succeeded = results.filter(r => r.status === 'fulfilled');
const failed = results.filter(r => r.status === 'rejected');
```

### 流式处理

```typescript
// ✅ 使用 async generator 处理大数据
async function* processStream(items: AsyncIterable<Input>): AsyncGenerator<Output> {
  for await (const item of items) {
    yield transform(item);
  }
}

// 使用
for await (const result of processStream(stream)) {
  console.log(result);
}
```

---

## 五、调试技巧

### 结构化日志

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
log('API response:', response);

// 环境变量启用
// DEBUG=app:* node app.js
```

### 断点调试

```typescript
// ✅ 使用 debugger 语句
function complexCalculation(input: number): number {
  debugger; // 在此处暂停
  return input * 2;
}

// ✅ 条件断点
function processItem(item: Item): void {
  if (item.id === 'target-id') {
    debugger;
  }
}
```

---

## 六、性能优化技巧

### React 优化

```typescript
// ✅ 使用 memo 避免不必要渲染
import { memo } from 'react';

const ExpensiveComponent = memo(({ data }: { data: Data }) => {
  return <div>{JSON.stringify(data)}</div>;
});

// ✅ 使用 useMemo 避免不必要计算
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// ✅ 使用 useCallback 避免函数重建
const handleClick = useCallback(() => {
  console.log('Clicked');
}, []);
```

### 数据处理优化

```typescript
// ✅ 使用 Map 提高查找效率
const userMap = new Map(users.map(u => [u.id, u]));
const user = userMap.get(userId); // O(1)

// ❌ 使用数组查找
const user = users.find(u => u.id === userId); // O(n)

// ✅ 批量处理
const results = await Promise.all(items.map(processItem));

// ❌ 逐个处理
for (const item of items) {
  await processItem(item);
}
```

### 缓存策略

```typescript
// ✅ 简单内存缓存
const cache = new Map<string, unknown>();

async function fetchWithCache(key: string): Promise<unknown> {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const data = await fetchData(key);
  cache.set(key, data);
  return data;
}
```

---

## 七、安全最佳实践

### 输入验证

```typescript
// ✅ 验证输入
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

function validateUser(input: unknown) {
  return UserSchema.parse(input);
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
import { escape } from 'html-escaper';

const safeHTML = escape(userInput);

// ❌ 直接输出
const unsafeHTML = userInput;

// ✅ 使用 React 自动转义
const element = <div>{userInput}</div>; // React 自动转义
```

### 认证和授权

```typescript
// ✅ 检查权限
async function deleteUser(userId: string, currentUser: User) {
  if (currentUser.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  
  // 执行删除
}

// ✅ 使用中间件
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
```

---

## 八、代码风格速查

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量 | camelCase | `userName` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 函数 | camelCase | `getUserById` |
| 类 | PascalCase | `UserService` |
| 接口 | PascalCase | `IUserService` |
| 类型 | PascalCase | `UserResponse` |
| 文件 | kebab-case | `user-service.ts` |

### 代码组织

```typescript
// 文件结构推荐
// user-service.ts

// 1. 导入
import { User } from './types';

// 2. 常量
const MAX_RETRIES = 3;

// 3. 类型
interface CreateUserInput {
  name: string;
  email: string;
}

// 4. 接口
interface IUserService {
  create(input: CreateUserInput): Promise<User>;
}

// 5. 类/函数
export class UserService implements IUserService {
  async create(input: CreateUserInput): Promise<User> {
    // ...
  }
}

// 6. 默认导出
export default UserService;
```

---

## 九、常见反模式

### 避免的反模式

```typescript
// ❌ 嵌套回调地狱
async function badExample() {
  fetchData(url1, (data1) => {
    fetchData(url2, (data2) => {
      fetchData(url3, (data3) => {
        // ...
      });
    });
  });
}

// ✅ 使用 async/await
async function goodExample() {
  const data1 = await fetchData(url1);
  const data2 = await fetchData(url2);
  const data3 = await fetchData(url3);
}

// ❌ 过度使用 any
function process(data: any): any {
  return data;
}

// ✅ 使用泛型
function process<T>(data: T): T {
  return data;
}

// ❌ 魔法数字
if (status === 1) { ... }

// ✅ 使用常量
const STATUS_ACTIVE = 1;
if (status === STATUS_ACTIVE) { ... }
```
