# 快速开始指南

5 分钟上手 TDD 驱动的全栈开发工作流。

---

## 一、核心概念

**一个循环：** Red → Green → Refactor

```
Red: 先写失败的测试
Green: 实现最小代码使测试通过
Refactor: 优化代码，保持测试通过
```

**三个命令：**

| 命令 | 用途 |
|------|------|
| `/opsx:propose` | 创建变更提案 |
| `/opsx:apply` | 实施变更任务 |
| `/opsx:archive` | 归档完成的变更 |

**四个角色：**

| 角色 | 用途 |
|------|------|
| `spec-writer` | 编写测试规格 |
| `tester` | 实现测试用例 |
| `developer` | 实现代码 |
| `code-reviewer` | 代码审查 |

---

## 二、5 分钟上手

### 步骤 1：创建提案

```
/opsx:propose 实现用户登录功能
```

系统会自动创建：
- `proposal.md` - 功能描述
- `specs/login/spec.md` - 功能规格
- `specs/login/test.md` - 测试规格
- `design.md` - 设计方案
- `tasks.md` - 任务清单

### 步骤 2：执行 TDD 循环

```
/opsx:apply
```

系统会自动执行：
1. **Red** - `spec-writer` 编写测试规格 → `tester` 实现测试
2. **Green** - `developer` 实现代码
3. **Refactor** - `developer` 优化代码 → `code-reviewer` 审查

### 步骤 3：归档完成

```
/opsx:archive
```

---

## 三、最小示例

**用户请求：**
```
帮我实现用户登录功能
```

**系统响应：**

```
1. 触发 fullstack skill
2. 创建 OpenSpec 变更提案

Phase 1: Red
├── spec-writer: 编写登录测试规格
├── tester: 实现登录测试用例
└── 验证: 测试失败 ✓

Phase 2: Green
├── developer: 实现登录最小代码
└── 验证: 测试通过 ✓

Phase 3: Refactor
├── developer: 重构登录代码
├── 验证: 测试仍通过 ✓
└── code-reviewer: 审查代码

完成！归档变更。
```

---

## 四、常见任务模板

### 前端功能

```
/opsx:propose 实现用户管理页面
```

流程：`ui-designer` → `frontend-developer` → `frontend-tester` → `code-reviewer`

### 后端 API

```
/opsx:propose 实现用户管理 API
```

流程：`api-designer` → `backend-developer` → `code-reviewer`

### 全栈功能

```
/opsx:propose 实现博客系统
```

流程：`api-designer` → `fullstack-developer` → `frontend-tester` → `code-reviewer`

---

## 五、检查清单

### 开始前

- [ ] 理解需求
- [ ] 运行 `/opsx:propose`
- [ ] 确认提案内容

### 开发中

- [ ] 遵循 TDD 循环
- [ ] Red → Green → Refactor
- [ ] 更新 tasks.md

### 完成后

- [ ] 测试通过
- [ ] 代码审查
- [ ] 运行 `/opsx:archive`

---

## 六、常见问题

### Q: 简单任务也要 TDD 吗？

**A:** 看情况：
- 新功能开发（> 200 行）→ 推荐 TDD
- 复杂 Bug 修复（> 50 行或多文件）→ 可跳过 Red 阶段，直接修复后写回归测试
- 简单 Bug 修复（< 50 行）→ 直接修复即可
- 配置修改 → 直接修改即可

### Q: 测试在 Red 阶段就通过了？

**A:** 检查：
1. 测试断言是否正确
2. 功能是否已存在
3. Mock 配置是否正确

### Q: Green 阶段测试无法通过？

**A:** 检查：
1. 实现是否满足测试规格
2. 是否有遗漏的边界情况
3. Mock 配置是否正确

---

## 七、下一步

- 详细 TDD 流程：[tdd-workflow.md](tdd-workflow.md)
- 任务模板：[task-templates.md](task-templates.md)
- 代码模式：[code-patterns.md](code-patterns.md)
- 快速参考：[quick-reference.md](quick-reference.md)
