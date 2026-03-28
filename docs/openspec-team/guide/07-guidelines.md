# 07 - 团队守则

## 概述

OpenSpec 团队协作的使用规范和最佳实践。

**适用对象**: 所有使用 OpenSpec 的开发者  
**目标**: 建立一致的协作习惯，减少冲突

---

## 核心原则

```
1. 可见性优先
   └── 创建 MR 即宣告"我在做这个"

2. 冲突前置
   └── 在开始工作前检查是否有冲突

3. 文档即代码
   └── 改代码必须同步改文档

4. 主动协调
   └── 发现冲突立即沟通，不等待
```

---

## 工作流程

### 完整工作流

```
开始工作
   │
   ▼
查看 Board ──▶ 确认无冲突
   │
   ▼
创建变更 ──▶ 使用 /opsx-propose
   │
   ▼
创建 MR ──▶ 使用 openspec_change 模板
   │
   ▼
开发实现 ──▶ 本地运行检查脚本
   │
   ▼
提交代码 ──▶ 关注 CI 冲突检测
   │
   ▼
冲突? ──▶ 是 ──▶ 协调沟通 ──▶ 更新协调记录
   │                 │
   否                │
   │                 │
   ▼                 ▼
审核通过 ◀──────────┘
   │
   ▼
合并归档
```

### 详细步骤

#### Step 1: 开始工作前

**必须做**:

1. 打开 [OpenSpec Board](链接到 Board)
2. 查看 Active 列，确认没有冲突的变更
3. 检查相关 specs 文件是否被锁定

**检查清单**:

- [ ] Board 上没有同功能的 Active Change
- [ ] 相关 specs 文件未被其他 MR 修改
- [ ] 如有疑问，在团队群询问

#### Step 2: 创建变更

**命令**:

```bash
/opsx-propose <change-name>
# 或
openspec new change "<change-name>"
```

**命名规范**:

```
✅ 正确: add-user-auth, fix-login-timeout, refactor-payment
❌ 错误: feature1, fix, update
```

#### Step 3: 创建 MR

**分支命名**:

```
feature/openspec-<name>
bugfix/openspec-<name>
refactor/openspec-<name>
```

**MR 创建**:

```bash
# 推送分支
git push origin feature/openspec-add-auth

# 创建 MR（使用 glab）
glab mr create \
  --title="[openspec] 添加用户认证" \
  --label="openspec::change" \
  --template="openspec_change"
```

**模板填写要求**:

- 变更范围必须勾选
- 影响的服务/模块必须填写
- API 变更必须说明版本和兼容性

#### Step 4: 开发实现

**本地检查**:

```bash
# 开发前
./scripts/openspec-check.sh

# 开发后，提交前
./scripts/openspec-check.sh
```

**开发规范**:

- 代码必须符合 specs 定义
- 涉及 API 变更必须同步更新 Swagger
- 保持 commits 清晰，不要混无关改动

#### Step 5: 提交代码

**commit message 规范**:

```
[<类型>] <简短描述>

类型:
  spec: 规格更新
  feat: 功能实现
  fix:  缺陷修复
  docs: 文档更新
  test: 测试添加

示例:
  [spec] 更新用户认证规格，增加 JWT 说明
  [feat] 实现用户登录 API
  [fix] 修复登录状态校验逻辑
```

**提交前检查**:

- [ ] 本地检查通过
- [ ] specs 文档已更新
- [ ] Swagger 已同步（如适用）
- [ ] 单元测试通过

#### Step 6: 处理冲突

**当 CI 报告冲突时**:

1. **立即查看冲突详情**:

   ```bash
   # 查看 CI 日志了解冲突文件
   # 在 MR 页面查看冲突评论
   ```

2. **联系相关开发者**:

   ```
   在 MR 评论中 @ 对方
   在团队群简要说明
   预约协调时间（如需要）
   ```

3. **记录协调结果**:

   ```markdown
   <!-- 在 MR 描述中更新 -->

   ### 协调记录

   **相关 MR**: !123
   **协调人**: @developer-b
   **解决方案**: 等待 !123 先合并，本 MR rebase 后解决冲突
   **状态**: 🔄 等待中
   ```

4. **解决后更新标签**:
   ```
   CI 会自动更新标签为 openspec::conflict::none
   ```

#### Step 7: 审核与合并

**Code Review 检查点**:

- [ ] 代码符合 specs 定义
- [ ] specs 文档完整
- [ ] 无未解决的冲突
- [ ] CI 全部通过

**合并前确认**:

- [ ] Board 上状态正确
- [ ] 所有 tasks 完成
- [ ] 已通知相关方（如适用）

**合并后**:

- CI 自动归档变更
- Board 自动更新

---

## 规范细则

### 分支规范

```
命名格式: <type>/openspec-<name>

类型:
  feature:  新功能
  bugfix:   Bug 修复
  refactor: 重构
  docs:     文档更新

示例:
  feature/openspec-add-auth
  bugfix/openspec-fix-login-timeout
  refactor/openspec-simplify-payment
```

### Commit 规范

```
格式: [<type>] <subject>

类型:
  spec: 规格更新 (openspec/changes/**/specs/)
  feat: 功能实现 (src/**)
  fix:  缺陷修复
  docs: 文档更新 (不包括 specs)
  test: 测试代码
  chore: 构建/工具

主题:
  - 使用动词开头: 添加、修复、更新、重构
  - 不超过 50 个字符
  - 不要以句号结尾

示例:
  [spec] 添加用户认证规格
  [feat] 实现 JWT token 生成
  [fix] 修复登录状态校验失败
```

### MR 规范

**标题格式**:

```
[openspec] <变更简述>

示例:
  [openspec] 添加用户认证功能
  [openspec] 修复登录超时问题
  [openspec] 重构支付模块
```

**描述要求**:

- 必须填写模板中的所有必填项
- 变更范围必须明确
- 如有 API 变更，必须说明版本影响
- 冲突记录必须及时更新

**标签要求**:

- 必须添加: `openspec::change`
- 必须添加状态标签: `openspec::status::active`
- 冲突状态由 CI 自动更新

### 协调规范

**发现冲突时**:

1. 立即在 MR 中评论，@ 相关人
2. 简要说明冲突点和影响
3. 提出协调建议（如：谁先合并）
4. 更新 MR 描述的"协调记录"部分

**协调沟通模板**:

```markdown
@developer-b

发现潜在冲突:

- 本 MR 修改: specs/auth/login.md (添加 JWT 支持)
- 你的 MR (!123) 修改: specs/auth/login.md (添加 OAuth 支持)

建议协调方案:

1. 先合并你的 !123（OAuth 基础）
2. 本 MR rebase 后添加 JWT 扩展
3. 预计影响：1-2 天延迟

请确认是否可行？
```

**协调完成后**:

1. 更新 MR 描述的"协调记录"
2. 标记冲突已解决
3. 必要时更新 specs 以反映协调结果

---

## 常见问题 FAQ

### Q1: 我应该在什么时候创建 MR？

**A**: 越早越好。建议在完成 Explore 阶段后，创建了 proposal.md 就创建 MR。这样团队能尽早知道你在做什么。

### Q2: CI 检测冲突失败，但我没看到冲突详情？

**A**:

1. 点击 CI job 查看详细日志
2. 等待 CI 自动在 MR 中添加冲突评论
3. 如果长时间没有，检查 CI 配置是否正确

### Q3: 我的变更和其他人的变更有重叠，但不是冲突？

**A**: 即使不是冲突，也建议在 MR 中说明。例如：

```markdown
### 相关变更

本变更与 !123 有功能关联，但不是冲突：

- !123: 添加用户基础信息接口
- 本 MR: 添加用户头像上传功能（依赖 !123 的用户 ID）

建议：先合并 !123，再合并本 MR
```

### Q4: 我需要修改之前已经归档的变更，怎么办？

**A**: 创建新的变更，不要修改已归档的。在新变更的 proposal.md 中说明：

```markdown
## 背景

这是对 change/add-user-auth (已归档) 的补充，原因：...
```

### Q5: Board 上我的 MR 不见了？

**A**: 可能原因：

1. MR 被合并了（自动移动到 Done 列）
2. 标签被意外移除
3. Board 筛选条件变化

解决方法：在 MR 页面检查标签，手动添加 `openspec::change`。

### Q6: 我可以跳过某些步骤吗？

**A**: 简单变更可以适当简化，但以下步骤**不可跳过**：

- ✅ 创建 MR（让团队可见）
- ✅ CI 冲突检测（防止合并后冲突）
- ✅ 更新协调记录（如有冲突）

可以简化：

- ⚠️ 简短的 specs 文档（但必须有）
- ⚠️ 简化的 MR 描述（但关键信息必须有）

---

## 检查清单

### 创建变更前

- [ ] 查看了 OpenSpec Board
- [ ] 确认无冲突的 Active Changes
- [ ] 确定了变更范围

### 开发过程中

- [ ] 本地检查通过
- [ ] specs 文档随代码同步更新
- [ ] 定期提交 commits

### 提交 MR 时

- [ ] 使用了正确的分支名
- [ ] MR 标题符合规范
- [ ] 填写了模板所有必填项
- [ ] 添加了必需标签

### 处理冲突时

- [ ] 立即联系相关开发者
- [ ] 在 MR 中记录协调过程
- [ ] 协调完成后更新状态

### 合并前

- [ ] CI 全部通过
- [ ] Code Review 通过
- [ ] 无未解决的冲突
- [ ] 所有 tasks 完成

---

## 违规处理

**轻微违规**（如格式不规范）:

- Reviewer 在 MR 中提醒
- 修正后重新提交

**中度违规**（如未创建 MR 直接开发）:

- 团队群内提醒
- 要求补充 MR 和相关文档

**严重违规**（如跳过冲突检测强行合并）:

- 团队负责人谈话
- 视情况回滚变更

---

## 检查清单

完成本章后，团队应能回答：

- [ ] 所有成员都知道工作流程？
- [ ] 所有成员都了解命名规范？
- [ ] 所有成员都知道如何处理冲突？
- [ ] 团队有明确的协调流程？
- [ ] 新成员有入职培训？

---

**有问题或建议？** 查看 [08 - 常见问题 FAQ](08-faq.md) 或在团队群内讨论。
