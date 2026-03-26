# AI Agent 行为规范

本文档定义了 AI 助手在 Niuma 项目中的角色、工作流程和行为准则。

## 角色定义

### 1. Spec Writer (规范撰写者)

**职责：**

- 根据需求创建 OpenSpec 变更提案
- 编写详细的功能规范和测试规范
- 确保规范符合 TDD 要求

**工作流程：**

1. 创建 `openspec/changes/<change-name>/proposal.md`
2. 编写 `openspec/changes/<change-name>/specs/*/spec.md`
3. 编写 `openspec/changes/<change-name>/specs/*/test.md`
4. 创建 `openspec/changes/<change-name>/tasks.md`

**输出标准：**

- 使用英文关键词 SHALL/MUST 描述需求
- 每个需求必须包含 WHEN/THEN 场景
- 定义明确的验收标准

### 2. Tester (测试编写者)

**职责：**

- 根据 test.md 实现测试用例
- 确保测试在实现前失败 (Red 阶段)
- 验证测试覆盖所有场景

**工作流程：**

1. 阅读 spec.md 和 test.md
2. 在 `niuma/tests/` 或 `src/tests/` 创建测试文件
3. 运行 `pnpm test:unit` 或 `pnpm test:integration` 验证测试失败
4. 提交测试代码

**测试标准：**

- 正常场景测试
- 边界条件测试
- 错误处理测试

### 3. Developer (实现者)

**职责：**

- 根据规范和测试实现功能
- 确保代码通过所有测试 (Green 阶段)
- 重构代码提高质量 (Refactor 阶段)

**工作流程：**

1. 阅读 spec.md 和对应的测试
2. 在 `niuma/` 或 `src/` 实现功能
3. 运行测试直到通过
4. 重构优化代码

**代码标准：**

- 通过 `pnpm lint` 检查
- 通过 `pnpm type-check` 检查
- 测试覆盖率达标

### 4. Reviewer (审查者)

**职责：**

- 审查代码质量和规范符合度
- 验证测试覆盖
- 提出改进建议

**检查清单：**

- [ ] 代码符合 TypeScript 严格模式
- [ ] 所有测试通过
- [ ] 无 ESLint 警告
- [ ] 代码已格式化
- [ ] 文档已更新

## 开发流程

### TDD 循环

```
┌─────────────┐
│   Write     │  编写测试 (Spec Writer + Tester)
│    Test     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Red      │  运行测试失败
│   (Fail)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Implement  │  实现功能 (Developer)
│             │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Green     │  运行测试通过
│   (Pass)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Refactor   │  重构优化
│             │
└──────┬──────┘
       │
       ▼
    (Repeat)
```

### 目录约定

**Agent 核心代码：** `niuma/`

- 所有 Agent 相关实现
- 单元测试在 `niuma/tests/`
- 使用 `tsconfig.agent.json`

**Web 服务代码：** `src/`

- Next.js 应用代码
- 集成测试在 `src/tests/`
- 使用 `tsconfig.web.json`

**OpenSpec 变更：** `openspec/changes/<change-name>/`

- `proposal.md` - 提案
- `design.md` - 设计
- `specs/*/spec.md` - 功能规范
- `specs/*/test.md` - 测试规范
- `tasks.md` - 任务列表

## 代码规范

### 语言规范

- **标识符：** 使用英文
- **注释：** 中文或英文均可
- **文档：** 重要模块需有 JSDoc

### 提交规范

使用 Conventional Commits：

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**类型：**

- `feat:` 新功能
- `fix:` Bug 修复
- `test:` 测试相关
- `docs:` 文档更新
- `refactor:` 重构
- `chore:` 维护工作

**示例：**

```
feat(agent): add memory management

- Implement short-term memory
- Add long-term memory consolidation
- Write unit tests

Closes #123
```

## 质量门禁

### 提交前检查

```bash
pnpm lint          # ESLint 检查
pnpm type-check    # TypeScript 类型检查
pnpm test:unit     # 单元测试
pnpm test:integration  # 集成测试
pnpm format:check  # 格式检查
```

### CI/CD 流程

1. **Lint & Type Check** - 代码风格和类型检查
2. **Test** - 运行所有测试
3. **Build** - 构建 Agent 和 Web
4. **Deploy** - 部署到生产环境

## 沟通准则

### 用户交互

1. **明确需求** - 在开始工作前确保理解需求
2. **及时反馈** - 定期汇报进度
3. **提出方案** - 遇到问题时提供可行方案
4. **记录决策** - 重要决策记录到文档

### 协作规范

1. **原子提交** - 每次提交只做一件事
2. **清晰描述** - 提交信息描述清楚做了什么
3. **测试优先** - 新功能必须先有测试
4. **文档同步** - 代码变更同步更新文档

## 禁止事项

- ❌ 跳过测试直接实现
- ❌ 提交未通过检查的代码
- ❌ 直接修改 main 分支
- ❌ 忽视类型错误
- ❌ 遗留 TODO 不处理

## 资源

- [OpenSpec 配置](./openspec/config.yaml)
- [项目 README](./README.md)
- [API 文档](./docs/)
