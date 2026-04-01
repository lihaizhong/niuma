# 04 - 命令参考

> 所有 `/opsx-*` 命令的详细用法速查

## 命令定义位置

所有命令定义存储在 `{{AI_CONFIG_DIR}}/` 目录中：

- **命令入口**：`{{AI_CONFIG_DIR}}/commands/*.md` - 用户可见的命令描述
- **执行逻辑**：`{{AI_CONFIG_DIR}}/skills/openspec-*/SKILL.md` - AI 执行的详细步骤

完整命令定义可参考：

- `.template/custom/commands/` - 命令模板
- `.template/custom/skills/` - 技能模板

## 命令总览

| 命令            | 功能     | 适用场景             | 对应工作流         |
| --------------- | -------- | -------------------- | ------------------ |
| `/opsx-explore` | 探索模式 | 需求不明确、自由讨论 | Explore            |
| `/opsx-spike`   | 技术调研 | 技术选型、可行性研究 | Spike              |
| `/opsx-propose` | 创建提案 | 新功能、架构改动     | Spec-Driven        |
| `/opsx-bugfix`  | Bug 修复 | 修复问题、错误处理   | Bugfix             |
| `/opsx-apply`   | 实施任务 | 开始实现已规划的功能 | Spec-Driven/Bugfix |
| `/opsx-archive` | 归档变更 | 手动归档（通常自动） | 所有               |

## /opsx-explore

### 功能

进入探索模式，与 AI 自由讨论，澄清需求或技术方案。

### 语法

```bash
/opsx-explore [optional: topic]
```

### 参数

- `topic`（可选）- 要讨论的主题，如 "使用什么数据库"

### 使用场景

#### 场景 1：技术选型

```bash
/opsx-explore
> "数据库用 PostgreSQL 还是 MongoDB？"

AI 分析：
- 你的场景需要复杂查询 → 推荐 PostgreSQL
- 如果数据关系简单且需要水平扩展 → 考虑 MongoDB

建议：先用 PostgreSQL，后期有需要再迁移
```

#### 场景 2：需求澄清

```bash
/opsx-explore
> "用户想要'智能推荐'，具体指什么？"

AI 引导讨论：
- 是基于用户行为的历史推荐？
- 还是基于内容的标签匹配？
- 或者是热门内容的排行榜？

通过提问帮助明确需求
```

#### 场景 3：风险评估

```bash
/opsx-explore
> "引入微服务有什么风险？"

AI 列出风险：
1. 运维复杂度增加
2. 分布式事务处理困难
3. 服务间通信延迟
4. 调试困难

结论：当前规模不建议
```

### 产物

- 无固定产物（可能有讨论记录）
- 可能转为 `/opsx-propose` 或 `/opsx-bugfix`

### 退出方式

- 说"结束探索"或"开始实施"
- AI 会询问是否要创建正式变更

### 命令定义

- **命令定义**：`{{AI_CONFIG_DIR}}/commands/opsx-explore.md`
- **执行逻辑**：`{{AI_CONFIG_DIR}}/skills/openspec-explore/SKILL.md`
- **模板参考**：`.template/custom/commands/opsx-explore.md`

## /opsx-spike

### 功能

启动技术调研（Spike），进行时间盒限制的研究并产出决策文档。

### 语法

```bash
/opsx-spike <spike-name> [optional: description]
```

### 参数

- `spike-name`（必需）- 调研名称，kebab-case 格式，如 `evaluate-state-management`
- `description`（可选）- 简短描述

### 命名规范

```
✅ 正确：
  - evaluate-state-management
  - compare-api-options
  - investigate-performance-issue
  - prototype-webrtc-integration

❌ 错误：
  - research (太笼统)
  - spike1 (无意义)
  - ReduxVsZustand (应该用 kebab-case)
```

### 使用步骤

#### 步骤 1：启动 Spike

```bash
/opsx-spike evaluate-state-management

AI: 正在创建 Spike 变更...
     创建 research-question.md 模板

请定义研究问题：
- Problem_Statement: 需要选择轻量级状态管理方案
- Research_Goals: 评估 Redux vs Zustand vs Context
- Scope: 对比包大小、API、性能
- Timebox: 4 小时
```

#### 步骤 2：填写研究问题

AI 引导填写 research-question.md：

```markdown
# Research Question: 状态管理方案选择

## Problem_Statement

当前项目需要添加全局状态管理，要求：

- 轻量级（<5KB）
- TypeScript 友好
- 易于测试

## Research_Goals

1. 对比 Redux Toolkit、Zustand、Context API
2. 评估学习曲线
3. 测试实际性能

## Scope

**In Scope**: 三个方案的基础功能对比
**Out of Scope**: 高级功能、长期维护成本

## Timebox

4 小时
```

#### 步骤 3：进行探索

```bash
AI: 开始探索阶段...

你可以：
1. 阅读文档
2. 编写原型代码
3. 进行实验
4. 记录发现

我会帮你记录到 exploration-log.md
```

#### 步骤 4：形成决策

AI 协助撰写 decision.md：

```markdown
# Decision: 采用 Zustand

## Summary

经过 3.5 小时调研，评估了三个状态管理方案。

## Recommendation

**采用 Zustand**

## Rationale

- 包大小仅 1KB（vs Redux 11KB）
- TypeScript 原生支持
- API 极简，学习成本低

## Next_Steps

1. 创建实现变更: `/opsx-propose add-zustand-store`
2. 编写迁移指南
```

### 产物详解

| 文件                   | 用途     | 内容                   |
| ---------------------- | -------- | ---------------------- |
| `.openspec.yaml`       | 调研配置 | schema、状态、时间盒   |
| `research-question.md` | 研究问题 | 要研究什么、范围、时间 |
| `exploration-log.md`   | 探索日志 | 发现、实验、对比       |
| `decision.md`          | 决策文档 | 结论、理由、下一步     |

### Spike vs Explore

| 场景                   | 使用            | 原因             |
| ---------------------- | --------------- | ---------------- |
| "Redux 还是 Zustand？" | `/opsx-spike`   | 需要产出明确决策 |
| "这个功能合理吗？"     | `/opsx-explore` | 开放式讨论       |
| "API 是否可行？"       | `/opsx-spike`   | 需要验证并决策   |
| "不知道怎么实现"       | `/opsx-explore` | 需要澄清方案     |

### 时间盒规则

- **默认**: 4 小时
- **最大**: 2 天
- **到期**: 必须下结论（即使是不完整的）
- **延期**: 需要明确理由和新的时间盒

### 命令定义

- **命令定义**：`{{AI_CONFIG_DIR}}/commands/opsx-spike.md`
- **执行逻辑**：`{{AI_CONFIG_DIR}}/skills/openspec-spike/SKILL.md`
- **模板参考**：`.template/custom/commands/opsx-spike.md`

## /opsx-propose

### 功能

创建 Spec-Driven 变更，生成完整的设计文档。

### 语法

```bash
/opsx-propose <change-name> [optional: description]
```

### 参数

- `change-name`（必需）- 变更名称，kebab-case 格式，如 `add-user-auth`
- `description`（可选）- 简短描述，如 "添加用户认证功能"

### 命名规范

```
✅ 正确：
  - add-user-authentication
  - fix-login-timeout
  - refactor-payment-module
  - update-dark-mode

❌ 错误：
  - addUserAuth（应该用 kebab-case）
  - feature1（无意义）
  - fix（太笼统）
```

### 使用步骤

#### 步骤 1：创建变更

```bash
/opsx-propose add-dark-mode

AI: 正在创建变更...
     生成 proposal.md
     生成 design.md
     生成 specs/
     生成 tasks.md

变更已创建: openspec/changes/add-dark-mode/
```

#### 步骤 2：查看生成的文档

```bash
ls openspec/changes/add-dark-mode/

输出:
├── .openspec.yaml          # 变更元数据
├── proposal.md             # 提案文档
├── design.md               # 设计文档
├── specs/                  # 规格目录
│   └── theme/
│       └── spec.md
└── tasks.md                # 任务列表
```

#### 步骤 3：审阅并修改

AI 生成的文档可能需要调整：

```bash
# 查看 proposal.md
cat openspec/changes/add-dark-mode/proposal.md

# 如需修改，告诉 AI
> "目标部分需要补充性能要求"

AI: 更新 proposal.md
```

#### 步骤 4：确认完成

```bash
> "提案完成"

AI: 提案阶段完成！
     运行 /opsx-apply 开始实施
```

### 产物详解

| 文件             | 用途     | 内容                 |
| ---------------- | -------- | -------------------- |
| `.openspec.yaml` | 变更配置 | schema、状态、元数据 |
| `proposal.md`    | 提案     | Why：为什么要做      |
| `design.md`      | 设计     | How：技术方案        |
| `specs/**/*.md`  | 规格     | What：详细规格       |
| `tasks.md`       | 任务     | When：实施计划       |

### 注意事项

- 变更名称唯一，不能重复
- 可以多次运行来更新文档
- 确认完成后才能进入 Apply 阶段

### 命令定义

- **命令定义**：`{{AI_CONFIG_DIR}}/commands/opsx-propose.md`
- **执行逻辑**：`{{AI_CONFIG_DIR}}/skills/openspec-propose/SKILL.md`
- **模板参考**：`.template/custom/commands/opsx-propose.md`

## /opsx-bugfix

### 功能

创建 Bugfix 变更，记录和修复问题。

### 语法

```bash
/opsx-bugfix <bug-id> [optional: description]
```

### 参数

- `bug-id`（必需）- Bug 标识符，如 `login-button-error`
- `description`（可选）- 简短描述

### 命名规范

```
✅ 正确：
  - login-button-not-working
  - api-timeout-error
  - data-sync-failure
  - memory-leak-in-dashboard

❌ 错误：
  - bug1（无意义）
  - fix（太笼统）
  - 中文名称（应该用英文）
```

### 使用步骤

#### 步骤 1：启动 Bugfix

```bash
/opsx-bugfix button-double-click

AI: 正在创建 Bugfix 变更...
     创建 bug-report.md 模板

请描述问题：
- Symptom: 按钮点击两次才响应
- Steps to Reproduce:
  1. 打开页面
  2. 快速点击按钮
- Expected: 立即响应
- Actual: 第二次点击才响应
```

#### 步骤 2：填写报告

AI 引导填写 bug-report.md：

```markdown
# Bug Report: button-double-click

## Symptom

按钮需要点击两次才响应

## Steps to Reproduce

1. 打开首页
2. 快速点击"提交"按钮
3. 第一次点击无反应

## Expected Behavior

第一次点击就响应

## Actual Behavior

第二次点击才响应

## Environment

- Browser: Chrome 120
- OS: macOS 14

## Root Cause Analysis (Optional)

可能是事件防抖设置时间过长

## Workaround (Optional)

等待 500ms 后再次点击
```

#### 步骤 3：复现与定位

```bash
AI: 尝试复现问题...
     本地启动应用
     按步骤操作
     确认 Bug 存在

     分析根因...
     发现防抖函数设置 1000ms
     导致快速点击被忽略
```

#### 步骤 4：修复

AI 生成 fix.md：

````markdown
# Fix: button-double-click

## Root Cause

Button 组件使用了 1000ms 的防抖：

```tsx
const handleClick = debounce(onClick, 1000);
```
````

用户快速点击时，第一次被忽略。

## Fix Description

将防抖时间减少到 300ms：

```tsx
const handleClick = debounce(onClick, 300);
```

## Files Changed

- src/components/Button.tsx

## Testing Strategy

1. 单元测试：模拟快速点击
2. 手动测试：验证响应速度

## Regression Test

```typescript
it('should respond to quick clicks', () => {
  const onClick = jest.fn();
  render(<Button onClick={onClick} />);

  fireEvent.click(screen.getByRole('button'));
  fireEvent.click(screen.getByRole('button'));

  expect(onClick).toHaveBeenCalledTimes(2);
});
```

````

#### 步骤 5：验证

```bash
AI: 运行回归测试...
     测试通过

     运行所有测试...
     无破坏现有功能

修复完成！
````

### 产物详解

| 文件             | 用途     | 内容                 |
| ---------------- | -------- | -------------------- |
| `.openspec.yaml` | Bug 配置 | schema、状态、优先级 |
| `bug-report.md`  | 问题描述 | 现象、复现步骤、环境 |
| `fix.md`         | 修复方案 | 根因、修改、测试     |

### 严重程度

可以在报告中指定严重程度：

```markdown
## Severity

P0 - Critical: 系统不可用
P1 - High: 核心功能损坏
P2 - Medium: 非核心功能问题
P3 - Low: 轻微问题
```

### 命令定义

- **命令定义**：`{{AI_CONFIG_DIR}}/commands/opsx-bugfix.md`
- **执行逻辑**：`{{AI_CONFIG_DIR}}/skills/openspec-bugfix/SKILL.md`
- **模板参考**：`.template/custom/commands/opsx-bugfix.md`

## /opsx-apply

### 功能

实施已创建的变更，执行 TDD 开发。

### 语法

```bash
/opsx-apply [optional: change-name]
```

### 参数

- `change-name`（可选）- 指定变更名称，如未指定则使用当前激活的变更

### 使用步骤

#### 步骤 1：确保有已创建的变更

```bash
# 检查当前变更
ls openspec/changes/

输出：
├── add-dark-mode/          # 这个变更
└── archive/                # 归档目录
```

#### 步骤 2：开始实施

```bash
/opsx-apply
# 或指定变更名
/opsx-apply add-dark-mode

AI: 读取 tasks.md...
     当前任务：实现 ThemeProvider

     [Red Phase] 编写测试...
```

#### 步骤 3：TDD 循环

**Red Phase**：

```bash
AI: 编写测试...
     src/components/ThemeProvider.test.tsx

     运行测试...
     ✗ 失败（预期，因为没有实现）

     确认测试失败原因正确
```

**Green Phase**：

```bash
AI: 编写最小实现...
     src/components/ThemeProvider.tsx

     运行测试...
     ✓ 通过

     实现最简单代码使测试通过
```

**Refactor Phase**：

```bash
AI: 重构代码...
     优化结构
     提取函数
     改善命名

     运行测试...
     ✓ 仍然通过

     重构不改变行为
```

#### 步骤 4：标记任务完成

```bash
AI: 更新 tasks.md...
     - [x] 实现 ThemeProvider

     下一个任务：实现主题切换按钮
```

#### 步骤 5：重复直到完成

继续下一个任务的 Red→Green→Refactor 循环。

#### 步骤 6：完成所有任务

```bash
AI: 所有任务完成！
     运行完整测试套件...
     ✓ 全部通过

     准备提交...
```

### 检查点

实施过程中会运行检查点：

```bash
[Checkpoint] test:unit
  ✓ 单元测试通过

[Checkpoint] lint
  ✓ 代码风格合规

[Checkpoint] type-check
  ✓ TypeScript 类型正确
```

任一检查失败会阻止继续。

### 注意事项

- 必须先有创建的变更（通过 `/opsx-propose` 或 `/opsx-bugfix`）
- 按照 tasks.md 的顺序执行任务
- 每个任务必须完成 Red→Green→Refactor
- 可以随时中断，下次继续

### 命令定义

- **命令定义**：`{{AI_CONFIG_DIR}}/commands/opsx-apply.md`
- **执行逻辑**：`{{AI_CONFIG_DIR}}/skills/openspec-apply-change/SKILL.md`
- **模板参考**：`.template/custom/commands/opsx-apply.md`

## /opsx-archive

### 功能

手动归档已完成的变更（通常自动归档，无需手动）。

### 语法

```bash
/opsx-archive <change-name>
```

### 参数

- `change-name`（必需）- 要归档的变更名称

### 使用场景

#### 场景 1：手动归档

```bash
/opsx-archive add-dark-mode

AI: 归档变更...
     从 openspec/changes/ 移动到 openspec/changes/archive/
     生成归档报告

归档完成！
```

#### 场景 2：查看归档历史

```bash
ls openspec/changes/archive/

输出：
├── add-dark-mode/
├── fix-login-timeout/
└── refactor-api/
```

### 自动归档

通常不需要手动运行，因为：

- **Spec-Driven**：Release 发布或部署成功后自动归档
- **Bugfix**：Release 发布或部署成功后自动归档
- **Spike**：Release 发布或部署成功后自动归档

手动归档只在特殊情况下使用：

- 放弃变更时
- 手动清理旧变更时

### 命令定义

- **命令定义**：`{{AI_CONFIG_DIR}}/commands/opsx-archive.md`
- **执行逻辑**：`{{AI_CONFIG_DIR}}/skills/openspec-archive-change/SKILL.md`
- **模板参考**：`.template/custom/commands/opsx-archive.md`

## 命令组合使用

### 典型流程 1：新功能开发

```bash
# 1. 探索需求（可选）
/opsx-explore
> "用户认证怎么做比较好？"

# 2. 创建提案
/opsx-propose add-user-auth

# 3. 审阅提案（迭代直到满意）
> "设计部分需要补充安全性考虑"
> "补充了 JWT 刷新机制"

# 4. 实施
/opsx-apply

# 5. 提交（自动验证）
git commit -m "feat: add user authentication"

# 6. 合并后自动归档
```

### 典型流程 2：Bug 修复

```bash
# 1. 启动 Bugfix
/opsx-bugfix api-timeout

# 2. 描述问题
> "API 请求超时"
> AI 引导填写报告...

# 3. 修复（包含在 /opsx-bugfix 中）
> AI 定位并修复...

# 4. 提交
git commit -m "fix: API timeout issue"

# 5. 合并后自动归档
```

### 典型流程 3：技术调研

```bash
# 1. 启动 Spike 调研
/opsx-spike evaluate-caching-strategy
> "对比 Redis vs 内存缓存 vs 本地存储"

# 2. 定义研究问题
> AI 引导填写 research-question.md

# 3. 进行探索
> 阅读文档、编写原型、测试性能
> 记录发现到 exploration-log.md

# 4. 形成决策
> AI 协助撰写 decision.md
> "推荐：使用 Redis"

# 5. 转为正式开发
/opsx-propose add-redis-cache

# 6. 继续 Spec-Driven 流程...
```

## 故障排除

### 问题 1：找不到变更

```bash
/opsx-apply

AI: 错误：没有找到激活的变更
     请先运行 /opsx-propose 或 /opsx-bugfix 创建变更
```

**解决**：

```bash
# 查看现有变更
ls openspec/changes/

# 指定变更名
/opsx-apply <change-name>
```

### 问题 2：变更名已存在

```bash
/opsx-propose add-auth

AI: 错误：变更 'add-auth' 已存在
     位置: openspec/changes/add-auth/
```

**解决**：

```bash
# 选择不同名称
/opsx-propose add-oauth2-auth

# 或继续已有变更
/opsx-apply add-auth
```

### 问题 3：检查点失败

```bash
/opsx-apply

AI: [Checkpoint Failed] test:unit
     ✗ ThemeProvider 测试失败
     错误: expect(received).toBe(expected)

需要修复测试后再继续
```

**解决**：

```bash
# 查看错误详情
# 修复代码或测试
# 重新运行
/opsx-apply
```

## 快捷键速查

| 意图          | 命令                   |
| ------------- | ---------------------- |
| 不确定怎么做  | `/opsx-explore`        |
| 技术调研/选型 | `/opsx-spike <name>`   |
| 加新功能      | `/opsx-propose <name>` |
| 修 Bug        | `/opsx-bugfix <id>`    |
| 开始编码      | `/opsx-apply`          |
| 结束当前      | "完成" 或 "归档"       |

## 下一步

- **[目录结构](05-directory-structure.md)** - 理解文件和目录的组织方式
- **[最佳实践](06-best-practices.md)** - 学习推荐的开发模式
