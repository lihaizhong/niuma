# 团队协作完整示例

> 从零到一：一个 20 人团队的实施案例

## 案例背景

**团队规模**：20 人（15 后端 + 5 前端）  
**代码托管**：GitLab  
**发布频率**：每 2 周一个版本  
**主要问题**：

- 代码冲突频繁（平均每周 5 次）
- API 文档不同步
- 团队协作靠口头约定

**实施目标**：

- 降低冲突频率 50%
- API 文档同步率 >90%
- 团队满意度 >4.0/5

---

## Week 1: 准备阶段

### Day 1-2: 团队动员

**上午：问题分析会**

```markdown
## 会议记录：OpenSpec 协作方案讨论

### 参会人员

- 团队负责人、各小组 Leader、核心开发

### 当前问题

1. 代码冲突频繁
   - 最近一周发生 5 次冲突
   - 平均解决时间 4 小时
   - 影响发布进度

2. API 文档不同步
   - 文档更新延迟 3-5 天
   - 前端经常使用过期接口
   - 联调效率低

3. 协调依赖口头
   - 谁在做什么是口头约定
   - 新人不了解情况
   - 重复开发

### 方案介绍

（使用 README.md 中的内容）

### 决议

- 同意试点实施
- 选择后端组作为试点
- 预计 2 周后评估
```

**下午：环境准备**

```bash
# GitLab 项目设置
Project → Settings → Labels

# 创建 Labels
openspec::change          # 标识 OpenSpec 变更
openspec::status::active  # 进行中
openspec::status::review  # 审核中
openspec::status::blocked # 阻塞
openspec::conflict::none  # 无冲突
openspec::conflict::warn  # 潜在冲突
openspec::conflict::block # 冲突阻塞
```

### Day 3-5: 基础配置

**创建 MR 模板**

```markdown
<!-- .gitlab/merge_request_templates/openspec_change.md -->

## OpenSpec 变更

### 基本信息

- **变更名称**: %{source_branch}
- **创建人**: @%{author}
- **功能模块**: <!-- 后端/前端/全栈 -->

### 变更范围

- [ ] 后端 API 变更
- [ ] 前端界面变更
- [ ] 数据库变更
- [ ] 配置变更
- [ ] 文档更新

### Swagger 更新

- [ ] 已更新 Swagger 文档
- [ ] 无需更新（非 API 变更）

### 冲突检查

- [ ] 已查看 [OpenSpec Board](${CI_PROJECT_URL}/-/boards)
- [ ] 确认无冲突

### 检查清单

- [ ] 规格文档已更新
- [ ] 代码实现符合规格
- [ ] 测试通过

/label ~"openspec::change" ~"openspec::status::active"
```

**创建 Board**

```
Board 名称: OpenSpec 协调板

列配置:
├── Backlog
│   过滤: Label = openspec::change AND 无status
├── Active
│   过滤: Label = openspec::status::active
├── Review
│   过滤: Label = openspec::status::review
├── Blocked
│   过滤: Label = openspec::status::blocked
└── Done
    过滤: MR 状态 = merged
```

---

## Week 2: 试点运行

### 试点选择

**选择标准**：

- 功能相对独立
- 涉及 API 变更
- 团队有积极性

**试点任务**：用户认证功能重构

### Day 1: 创建第一个 OpenSpec 变更

```bash
# 开发者 A 创建 MR
git checkout -b feature/openspec-auth-refactor

# 创建 MR（使用模板）
# GitLab UI: Create MR → 选择模板 "openspec_change"
```

**MR 描述示例**：

```markdown
## OpenSpec 变更

### 基本信息

- **变更名称**: auth-refactor
- **创建人**: @zhangsan
- **功能模块**: 后端

### 变更范围

- [x] 后端 API 变更
- [ ] 前端界面变更
- [x] 数据库变更
- [x] 配置变更
- [x] 文档更新

### Swagger 更新

- [x] 已更新 Swagger 文档
  - 文件: swagger/auth.yaml
  - 版本: 1.2.0

### 冲突检查

- [x] 已查看 OpenSpec Board
- [x] 确认无冲突（当前没有其他 auth 相关变更）

### 检查清单

- [ ] 规格文档已更新
- [ ] 代码实现符合规格
- [ ] 测试通过

/label ~"openspec::change" ~"openspec::status::active"
```

### Day 2: CI 自动检测

**CI 日志示例**：

```
验证 OpenSpec 冲突检测...

当前分支: feature/openspec-auth-refactor
目标分支: main

发现 Active OpenSpec Changes:
  !125  feature/openspec-order-optimize
  !127  feature/openspec-payment

检查与 !125 的冲突...
  当前分支修改:
    openspec/changes/auth-refactor/specs/auth.md
    src/auth/

  !125 修改:
    openspec/changes/order-optimize/specs
    src/order/

  ✓ 无冲突

检查与 !127 的冲突...
  当前分支修改:
    openspec/changes/auth-refactor/specs/auth.md
    src/auth/

  !127 修改:
    openspec/changes/payment/specs/payment.md
    src/payment/

  ✓ 无冲突

✅ 未发现冲突
添加标签: openspec::conflict::none
```

### Day 3-4: 发现和解决冲突

**场景：开发者 B 也创建了认证相关变更**

```markdown
# CI 日志

验证 OpenSpec 冲突检测...

发现 Active OpenSpec Changes:
!125 feature/openspec-auth-refactor ← 当前 MR
!127 feature/openspec-payment
!130 feature/openspec-user-profile ← 新增

检查与 !130 的冲突...
当前分支修改:
openspec/changes/auth-refactor/specs/auth.md
src/auth/user.ts

!130 修改:
openspec/changes/user-profile/specs/auth.md
src/auth/user.ts

⚠️ 潜在冲突: - openspec/changes/auth-refactor/specs/auth.md - openspec/changes/user-profile/specs/auth.md - src/auth/user.ts

添加评论: ⚠️ 发现潜在冲突
添加标签: openspec::conflict::warn
```

**冲突协调实例**：

```markdown
## 协调记录

**冲突发现**: 2024-03-15 10:30

**相关 MR**:

- !125 auth-refactor (当前)
- !130 user-profile (冲突)

**协调讨论**:

@lisi (user-profile 作者):
@zhangsan 你的 auth-refactor 改了什么？会影响我吗？

@zhangsan (auth-refactor 作者):
我重构了认证流程，但保留了原有接口。
你的 user-profile 只是读取用户信息，应该不影响。

@lisi:
确认，我的变更只读取，不修改认证逻辑。
我们可以并行开发，谁先完成谁先合并。

@zhangsan:
好的，我比较快，预计今天完成。
完成后通知你，你来 rebase。

**协调结果**:

- auth-refactor 先合并
- user-profile rebase 后合并
- 预计延迟: 1 天

**状态**: 🔄 等待中
```

### Day 5: 合并和归档

**auth-refactor 合并后**：

```markdown
# 合并记录

## MR !125: auth-refactor

- 合并时间: 2024-03-16 14:30
- 合并人: @reviewer1
- 冲突: 无
- 测试: 通过
- Review: 通过

## 归档

CI 自动归档:

- openspec/changes/auth-refactor/ → openspec/changes/archive/

归档时间: 2024-03-16 14:31
```

---

## Week 3-4: 扩大推广

### 收集试点数据

```markdown
## 试点数据统计

### 冲突统计

- 冲突发现时间: 2 天 → 30 分钟（提升 96%）
- 冲突解决时间: 4 小时 → 1 小时（提升 75%）
- 冲突次数: 5 次/周 → 3 次/周（减少 40%）

### MR 统计

- MR 重复打开率: 30% → 8%
- 平均 MR 存活时间: 3 天 → 2 天
- 一次成功率: 60% → 85%

### 团队反馈

- 易用性: 3.5/5 → 4.0/5
- 有效性: 3.8/5 → 4.3/5
- 满意度: 3.2/5 → 4.2/5

### 问题清单

1. Labels 太多，记不住
2. CI 报警太频繁
3. 不清楚什么时候该用什么流程
```

### 全团队推广

**培训材料**：

```markdown
## OpenSpec 协作方案培训

### 适用场景

- 新功能开发
- Bug 修复
- 重构
- 文档更新

### 工作流程

1. 开始工作前
   - 查看 OpenSpec Board
   - 确认没有冲突

2. 创建 MR
   - 使用模板
   - 填写必填项
   - 添加 Labels

3. CI 检测
   - 自动检测冲突
   - 自动添加评论
   - 自动更新标签

4. 协调冲突（如有）
   - 在 MR 评论中讨论
   - 更新"协调记录"
   - 解决后继续

5. 合并
   - CI 通过
   - Review 通过
   - 自动归档

### 检查清单

（参见团队守则）
```

---

## Month 2: 稳定运行

### 日常运维

**每日检查**：

```markdown
## OpenSpec Board 日报

### Active Changes (今天)

| !125 | auth-refactor | @zhangsan | 无冲突 | 进行中 |
| !126 | order-optimize | @lisi | 无冲突 | Review |
| !127 | user-profile | @wangwu | 无冲突 | 进行中 |

### Blocked Changes

| !130 | payment-export | @zhaoliu | 等待支付接口 | 需协调 |

### 今日新增

- !131 report-feature (新)

### 今日完成

- !123 login-fix (已合并)
```

**每周统计**：

```markdown
## 周报: OpenSpec 协作统计

### 本周数据

- 新增变更: 5 个
- 合并变更: 4 个
- 阻塞变更: 1 个
- 平均完成时间: 2.5 天

### 冲突情况

- 发现冲突: 2 次
- 平均解决时间: 1.5 小时
- 无协调失败

### 问题反馈

- 建议: CI 检测可以更精确（已采纳）
- 建议: Labels 可以简化（评估中）

### 下周计划

- 继续监控数据
- 优化 CI 检测逻辑
- 评估 Swagger 集成
```

---

## Month 3: 效果评估

### 量化指标对比

```markdown
## 实施前后对比

| 指标          | 实施前  | 3个月后 | 改善      |
| ------------- | ------- | ------- | --------- |
| 冲突发现时间  | 2 天    | 30 分钟 | **↓96%**  |
| 冲突解决时间  | 4 小时  | 1 小时  | **↓75%**  |
| 冲突频率      | 5 次/周 | 2 次/周 | **↓60%**  |
| MR 重复打开率 | 30%     | 5%      | **↓83%**  |
| 文档同步率    | 40%     | 92%     | **↑130%** |
| 团队满意度    | 3.2/5   | 4.3/5   | **↑34%**  |
```

### 团队反馈

**正面反馈**：

> "现在能看到大家都在做什么了，不需要每天问来问去。"
> ——后端开发 @zhangsan

> "冲突提前发现，不再等到合并时才处理。"
> ——前端开发 @lisi

> "API 文档更新终于不用催了。"
> ——产品经理 @pm_wang

**改进建议**：

> "Labels 太多，建议简化"
> ——已优化，保留核心 Labels

> "CI 报错太多，有些误报"
> ——已优化检测逻辑，减少误报

---

## 关键成功因素

### 1. 管理层支持

- 团队负责人积极参与试点
- 提供 2 周试点时间
- 优先处理问题反馈

### 2. 渐进式推广

```
Week 1-2: 基础配置 + 试点
    ↓
Week 3-4: 扩大到后端团队
    ↓
Month 2: 全团队推广
    ↓
Month 3+: 优化迭代
```

### 3. 自动化优先

- CI 自动检测冲突
- CI 自动更新标签
- CI 自动归档

### 4. 团队参与

- 收集反馈
- 快速响应问题
- 定期分享成果

---

## 可复用资源

### GitLab CI 配置

```yaml
# .gitlab-ci.yml 完整配置
# 参考: [06 - 工具脚本](06-scripts.md)
```

### MR 模板

```markdown
# .gitlab/merge_request_templates/openspec_change.md

# 参考: [02 - GitLab 配置](02-gitlab-setup.md#12-创建-mr-模板)
```

### 检查脚本

```bash
# scripts/openspec-check.sh
# 参考: [06 - 工具脚本](06-scripts.md)
```

---

## 下一步

- **已完成试点** → 查看 [05 - 实施路线图](05-roadmap.md) 扩大范围
- **遇到问题** → 查看 [08 - 常见问题 FAQ](08-faq.md)
- **需要脚本** → 查看 [06 - 工具脚本](06-scripts.md)
