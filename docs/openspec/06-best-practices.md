# 06 - 最佳实践

> 推荐的开发模式和常见问题解决方案

## 规格编写最佳实践

### 1. 规格应该是可测试的

**❌ 反模式**：规格无法自动化验证

```markdown
# 差的规格示例

## 用户应该感觉界面流畅

## 性能应该足够快
```

**✅ 推荐**：规格可以被测试验证

```markdown
# 好的规格示例

## 场景: 页面加载时间

WHEN 用户打开首页
THEN 首屏加载时间 < 1s
AND LCP < 2.5s
AND CLS < 0.1
```

### 2. 使用 SHALL/MUST 关键词

```markdown
## 登录功能

The system SHALL validate email format
The user MUST provide a valid password
```

### 3. WHEN/THEN 格式

```markdown
## 场景 1: 成功登录

WHEN 用户提交正确的邮箱和密码
THEN 返回 JWT Token
AND 设置 HttpOnly cookie
AND 跳转到首页

## 场景 2: 密码错误

WHEN 用户提交错误的密码
THEN 返回 401 状态码
AND 提示"邮箱或密码错误"
AND 不设置任何 token
```

### 4. 每个场景都应该有验收标准

```markdown
## 登录功能验收标准

### 场景 1: 成功登录

- [ ] 返回有效的 JWT Token
- [ ] Token 包含用户 ID 和过期时间
- [ ] Refresh Token 存入 HttpOnly cookie
- [ ] 登录日志已记录

### 场景 2: 密码错误

- [ ] 返回 401 状态码
- [ ] 响应体包含错误信息
- [ ] 不返回任何 token
- [ ] 登录失败日志已记录
```

## TDD 最佳实践

### 1. 测试命名规范

```typescript
// ✅ 推荐
describe("LoginForm", () => {
  it("should show error when password is empty");
  it("should call onSubmit with credentials when form is valid");
  it("should disable submit button while loading");
});

// ❌ 避免
describe("LoginForm", () => {
  it("test1"); // 无意义
  it("should work"); // 太模糊
});
```

### 2. 测试结构：Given-When-Then

```typescript
it("should return user data when login succeeds", () => {
  // Given: 有效的用户凭证
  const credentials = { email: "test@example.com", password: "password123" };

  // When: 调用登录 API
  const result = await authService.login(credentials);

  // Then: 验证返回结果
  expect(result.token).toBeDefined();
  expect(result.user.id).toBe("user-123");
});
```

### 3. 每个 Bug 都应该有回归测试

```typescript
// Bugfix 后添加的回归测试
describe('Bug Regression: login-button-error', () => {
  it('should respond on first click without delay', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);

    // 快速点击两次
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button'));

    // 应该被调用两次，而不是第一次被忽略
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
```

### 4. 避免测试实现细节

```typescript
// ❌ 反模式：测试实现细节
it('should call debounce with 1000ms', () => {
  const debounce = jest.spyOn(_, 'debounce');
  render(<Button onClick={handleClick}>Click</Button>);
  expect(debounce).toHaveBeenCalledWith(expect.any(Function), 1000);
});

// ✅ 推荐：测试行为
it('should handle rapid clicks correctly', () => {
  const onClick = jest.fn();
  render(<Button onClick={onClick}>Click</Button>);

  fireEvent.click(screen.getByRole('button'));
  fireEvent.click(screen.getByRole('button'));

  expect(onClick).toHaveBeenCalledTimes(2);
});
```

## 工作流最佳实践

### 1. 不要混用 Schema

```bash
# ❌ 错误
用户：有个 bug
AI：好的，我们用 spec-driven 来设计一下

# ✅ 正确
用户：有个 bug
AI：好的，启动 bugfix 流程
```

### 2. Schema 可以升级

```bash
# Spike 调研后转为 Spec-Driven
/opsx-spike webrtc-feasibility
# 调研结果：可行
/opsx-propose implement-realtime-collab

# Bugfix 发现需要重构时
/opsx-bugfix arch-issue-123
# 修复中发现需要架构调整
# 结束 bugfix，创建新提案
/opsx-propose refactor-auth-module
```

### Spike 工作流最佳实践

#### 1. 严格遵守时间盒

```markdown
# ✅ 推荐：时间到就下结论

## Timebox: 4 小时

## 实际用时: 4 小时

尽管还有一些疑问，但已经 enough to decide:

- 推荐方案：Zustand
- 理由：满足所有硬性要求
- 风险：社区较小（可接受）

## Next_Steps

- 如后续发现问题，可再进行补充调研
```

#### 2. 记录失败的尝试

```markdown
# ✅ 推荐：记录死胡同

## 实验 3: 使用 Context + useReducer

**尝试**: 用原生 Context 实现复杂状态

**结果**: 失败

**原因**:

- 需要频繁更新导致大量重渲染
- Provider 嵌套变得复杂
- 测试困难

**学习**: 原生方案不适合复杂状态，需要专业库
```

#### 3. 可丢弃代码管理

```bash
# ✅ 推荐：明确标记实验代码

spike/
└── evaluate-state-management/
    ├── research-question.md
    ├── exploration-log.md
    ├── decision.md
    └── code-spikes/
        ├── redux-prototype/           # 标记为实验代码
        │   ├── README.md             # 说明这是 throwaway
        │   └── store.ts
        └── zustand-prototype/
            ├── README.md
            └── store.ts
```

#### 4. 决策必须明确

```markdown
# ✅ 推荐：清晰的决策

## Recommendation

**采用 Zustand 作为状态管理方案**

理由：

1. 包大小最优（1KB vs 11KB）
2. TypeScript 原生支持
3. 团队学习成本低

## Next_Steps

1. 创建实施变更: `/opsx-propose add-zustand-store`
2. 预计工期: 2 天
3. 负责人: @dev-team
```

```markdown
# ❌ 避免：模糊的结论

## Recommendation

"Zustand 看起来不错，Redux 也可以，
具体用哪个可以再讨论。"

# 问题：没有明确决策，调研失去意义
```

### 3. 紧急情况处理

```markdown
## 严重程度分级

### P0 - Critical

- 系统完全不可用
- 数据丢失风险
- 安全漏洞
  → 走 hotfix 通道，事后补文档

### P1 - High

- 核心功能损坏
- 影响大量用户
  → Bugfix 流程，跳过非必要步骤

### P2 - Medium

- 非核心功能问题
- 用户可绕过
  → 完整 Bugfix 流程

### P3 - Low

- 轻微问题
- 用户几乎无感知
  → 正常流程，可适当延后
```

### 4. 及时归档

```bash
# ✅ 推荐：合并后及时归档
git commit -m "feat: add user authentication"
git push
# 合并后自动归档到 archive/

# ❌ 避免：长时间不归档
# 保持 openspec/changes/ 整洁很重要
```

## 配置最佳实践

### 1. 保持 config.yaml 简洁

```yaml
# ✅ 推荐：只放必要配置
context:
  project:
    name: MyApp
    language: TypeScript
  tech_stack:
    test_framework: vitest

# ❌ 避免：放太多细节
context:
  project:
    name: MyApp
    created_date: 2024-01-01
    author: John
    version: 1.0.0
    description: A long description...
    # ... 太多不必要的信息
```

### 2. Schema 变更要谨慎

```bash
# 修改 schema 前先备份
cp openspec/schemas/spec-driven.yaml openspec/schemas/spec-driven.yaml.bak

# 测试变更
# 确保所有现有变更仍能正常工作

# 确认无误后删除备份
rm openspec/schemas/spec-driven.yaml.bak
```

### 3. AGENTS.md 保持更新

当工作流调整时，及时更新 AGENTS.md：

```markdown
# 例如：新增了一个审查阶段

## Workflow

| Phase   | Command              | Purpose              |
| ------- | -------------------- | -------------------- | ------ |
| Explore | /opsx-explore        | Clarify requirements |
| Propose | /opsx-propose <name> | Create specification |
| Review  | /opsx-review         | Code review          | # 新增 |
| Apply   | /opsx-apply          | TDD implementation   |
| Archive | post-merge           | Archive change       |
```

## 目录组织最佳实践

### 1. 保持变更目录整洁

```bash
# ✅ 推荐：定期归档
ls openspec/changes/
add-user-auth/     # 活跃变更
add-dark-mode/     # 活跃变更
archive/           # 归档目录

# ❌ 避免：大量已完成的变更堆积
ls openspec/changes/
add-user-auth/
add-dark-mode/
feature-a/         # 已完成但未归档
feature-b/         # 已完成但未归档
feature-c/         # 已完成但未归档
```

### 2. 规格文件分组

```bash
# ✅ 推荐：按功能分组
specs/
├── auth/
│   ├── login.md
│   ├── register.md
│   └── logout.md
├── profile/
│   ├── view.md
│   └── update.md
└── settings/
    └── preferences.md

# ❌ 避免：全部平铺
specs/
├── login.md
├── register.md
├── logout.md
├── view-profile.md
├── update-profile.md
├── preferences.md
# ... 难以管理
```

### 3. 不要在 specs/ 中放代码

```bash
# ✅ 推荐：规格是 Markdown
specs/
└── auth/
    └── login.md    # 纯文本规格

# ❌ 避免：规格中混入代码
specs/
└── auth/
    └── login.md    # 里面全是代码片段
    └── login.ts    # 实际的代码应该在 src/
```

## 常见问题解决

### 问题 1：AI 生成了不合理的规格

```bash
# 发现规格不符合预期时
> "这个规格不对，我想要的是..."

AI 重新生成或修改规格
```

**预防**：

- Propose 阶段仔细审阅
- 不要跳过 Review 步骤

### 问题 2：TDD 感觉慢

```bash
# 感觉 TDD 增加工作量时
# 实际上：
# - 前期多花 20% 时间
# - 后期少修 80% Bug
# - 调试时间大幅减少
```

**建议**：

- 从小功能开始尝试 TDD
- 逐步建立信心
- 记录 TDD 带来的好处

### 问题 3：规格和实现不同步

```bash
# 发现实现偏离规格时
> "当前实现和规格不符，需要：
#  1. 更新规格（如果规格是对的）
#  2. 更新实现（如果实现是对的）
```

**预防**：

- Validate 阶段检查一致性
- 规格变更要走正式流程

### 问题 4：变更范围太大

```markdown
# 一次做太多事情

变更: add-complete-ecommerce-system
specs:

- user-management.md
- product-catalog.md
- shopping-cart.md
- payment.md
- shipping.md
- returns.md

# ... 太大，无法有效管理

# ✅ 推荐：拆分成小变更

变更: add-user-management
变更: add-product-catalog
变更: add-shopping-cart

# 每个变更小而专注
```

### 问题 5：忘记添加回归测试

```bash
# 修复 Bug 时
# 必须包含回归测试

# 如果担心时间不够
# 至少写一个最小回归测试
it('should not regress bug #123', () => {
  // 复现原 Bug 的测试
});
```

## 检查清单

### 开始新变更前

- [ ] 需求已经过探索和澄清
- [ ] 选择了正确的 Schema
- [ ] 变更名称符合规范

### Spike 调研阶段

- [ ] research-question.md 明确问题和范围
- [ ] 设定了合理的时间盒
- [ ] exploration-log.md 记录了关键发现
- [ ] 包含失败的尝试和教训
- [ ] decision.md 有明确的决策
- [ ] 有清晰的下一步行动

### 提案阶段

- [ ] proposal.md 清晰说明 Why
- [ ] design.md 包含技术方案
- [ ] specs/ 覆盖所有场景
- [ ] tasks.md 任务列表完整

### 实施阶段

- [ ] 每个任务遵循 Red→Green→Refactor
- [ ] 测试覆盖正常、边界、异常情况
- [ ] 代码通过 lint 和 type-check

### 归档前

- [ ] 所有任务完成
- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] 合并到 main 分支

## 下一步

- 查看 [命令参考](04-commands.md) 复习所有命令
- 阅读 [配置体系](02-config-system.md) 深入理解三层配置
- 开始使用：运行 `/opsx-explore` 开始你的第一个探索
