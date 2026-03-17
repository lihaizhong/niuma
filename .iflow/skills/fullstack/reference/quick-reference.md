# 快速参考

本文档提供常用命令、Subagent 映射和检查清单的快速参考。

> **代码模式和最佳实践：** [code-patterns.md](code-patterns.md)

---

## 目录

- [一、常用命令](#一常用命令)
- [二、Subagent 映射](#二subagent-映射)
- [三、硬约束检查清单](#三硬约束检查清单)
- [四、任务流程速查](#四任务流程速查)
- [五、文件操作规则](#五文件操作规则)
- [六、代码规范速查](#六代码规范速查)
- [七、常见问题速查](#七常见问题速查)

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
| **TDD 规格编写** | `spec-writer` | - |
| **测试实现** | `tester` | - |
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

### TDD 工作流角色

| 阶段 | Subagent | 输出 |
|------|----------|------|
| Red | `spec-writer` → `tester` | 测试规格 + 测试代码 |
| Green | `developer` | 实现代码 |
| Refactor | `developer` → `code-reviewer` | 优化代码 |

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

### TDD 流程（推荐）

```
1. spec-writer 编写测试规格
2. tester 实现测试用例（Red）
3. developer 实现最小代码（Green）
4. developer 重构优化（Refactor）
5. code-reviewer 审查
```

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

### TypeScript 基本规范

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

> **详细代码模式：** [code-patterns.md](code-patterns.md)

---

## 七、常见问题速查

### Q: 如何选择 subagent？

**A:** 根据任务类型选择：
- TDD 规格 → `spec-writer`
- TDD 测试 → `tester`
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

## 八、常用命令组合

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

## 九、版本管理

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