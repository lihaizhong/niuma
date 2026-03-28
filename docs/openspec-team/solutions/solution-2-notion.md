# 方案二：增强可视化看板方案

## 概述

通过集成 Notion、Trello 或 Linear 等工具，实现比 GitLab Board 更强大的可视化、更灵活的状态管理和更丰富的自动化。

**核心特点**:

- 🎨 强大的可视化（多视图、自定义字段、公式）
- 🔗 多工具集成（Slack、邮件、Zoom、GitLab）
- 🤖 灵活的自动化（无需编程）
- 📊 丰富的报表和 Dashboard

**推荐工具**: Notion（功能全面）、Trello（简单快速）、Linear（开发者友好）

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    增强看板层                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Notion / Trello / Linear                                   │
│  ├─ 📋 Changes 数据库                                       │
│  │   ├─ 看板视图（按状态分组）                               │
│  │   ├─ 表格视图（完整信息）                                 │
│  │   ├─ 日历视图（截止日期）                                 │
│  │   └─ 甘特图（时间线）                                     │
│  │                                                          │
│  ├─ 👥 人员数据库                                           │
│  │   ├─ 负责人负载                                          │
│  │   └─ 技能匹配                                            │
│  │                                                          │
│  └─ 📊 Dashboard                                            │
│      ├─ Active Changes 统计                                 │
│      ├─ 冲突预警                                            │
│      └─ 团队负载                                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    自动化层 (Make/Zapier)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  GitLab Webhook ──▶ Filter ──▶ Notion API                   │
│                                                             │
│  场景：                                                      │
│  1. MR 创建 → 自动创建卡片                                   │
│  2. MR 更新 → 同步状态                                       │
│  3. CI 冲突检测 → 更新风险等级 + Slack 通知                  │
│  4. Deadline 临近 → 邮件提醒                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Notion 方案详解

### 数据库设计

**Changes 数据库字段**:

| 字段          | 类型             | 示例值                    |
| ------------- | ---------------- | ------------------------- |
| **名称**      | Title            | 添加用户认证              |
| **状态**      | Select           | Active                    |
| **负责人**    | Person           | Alice                     |
| **GitLab MR** | URL              | https://gitlab.com/...    |
| **分支**      | Text             | feature/openspec-add-auth |
| **影响范围**  | Multi-select     | auth, user                |
| **冲突风险**  | Select           | High                      |
| **优先级**    | Select           | P1                        |
| **进度**      | Number           | 75%                       |
| **预计完成**  | Date             | 2026-04-01                |
| **相关变更**  | Relation         | user-profile-change       |
| **阻塞原因**  | Text             | 等待 API 审批             |
| **最后更新**  | Last edited time | 自动                      |
| **剩余天数**  | Formula          | 自动计算                  |

### 多视图配置

**视图 1: 看板视图 (Kanban)**

```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│  📋 Proposed │  🔄 Active  │   👀 Review │  ⛔ Blocked │    ✅ Done  │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ 卡片        │ 卡片        │ 卡片        │ 卡片        │ 卡片        │
│ 可拖拽      │ 进度条      │ 审核人      │ 🔴 红色     │ 完成时间    │
│             │ 75%         │             │ 阻塞原因    │             │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

**视图 2: 表格视图 (Table)**

- 完整字段展示
- 可筛选、排序
- 批量编辑

**视图 3: 日历视图 (Calendar)**

- 按预计完成日期展示
- 便于查看 Deadline

**视图 4: 负责人视图 (Board by Assignee)**

```
Alice          Bob           Charlie
────────       ───────       ─────────
卡片1          卡片3         卡片5
卡片2          卡片4

负载: 2        负载: 2       负载: 1 ✅
```

### Dashboard 设计

**Dashboard 组件**:

1. **Active Changes 统计卡片**

   ```
   ┌──────────┬──────────┬──────────┬──────────┐
   │ Proposed │  Active  │  Review  │  Blocked │
   │    3     │    8     │    5     │    2     │
   └──────────┴──────────┴──────────┴──────────┘
   ```

2. **冲突预警看板**

   ```
   🔴 High Risk (2)
   ├─ add-auth vs user-profile
   └─ payment-refactor vs order-api

   🟡 Medium Risk (3)
   └─ ...

   🟢 Low Risk (5)
   ```

3. **团队负载均衡**

   ```
   负载分布：
   Alice   ████████░░ 8  (⚠️ 过载)
   Bob     ██████░░░░ 6
   Charlie ████░░░░░░ 4  ✅
   ```

4. **本周截止任务**

   ```
   4月1日 周一
   ├─ 添加用户认证 (Alice)
   └─ 修复登录超时 (Bob)

   4月3日 周三
   └─ 支付流程优化 (Charlie)
   ```

### 自动化集成 (Make.com)

**场景 1: MR 创建**

```
触发: GitLab Webhook (MR created)
条件: labels 包含 "openspec::change"

动作:
  1. Notion: Create database item
     - 名称: {{MR.title}}
     - 状态: Proposed
     - GitLab MR: {{MR.url}}
     - 分支: {{MR.source_branch}}
     - 负责人: {{MR.author}}

  2. Slack: Send message
     "📝 新 OpenSpec 变更\n{{MR.title}} by @{{MR.author}}"
```

**场景 2: 状态同步**

```
触发: GitLab Webhook (MR updated)

动作:
  1. Notion: Update database item
     - 搜索: GitLab MR = {{MR.url}}
     - 更新状态: 根据 {{MR.labels}} 映射
       - openspec::status::active → Active
       - openspec::status::review → Review
       - openspec::status::blocked → Blocked
```

**场景 3: 冲突检测**

```
触发: GitLab CI (conflict detected)

动作:
  1. Notion: Update database item
     - 冲突风险: High
     - 添加评论: {{CONFLICT_DETAILS}}

  2. Slack: Send message to #openspec-alerts
     "🔴 冲突预警!\n{{CHANGE_NAME}} 与 {{OTHER_CHANGE}}\n查看: {{NOTION_URL}}"

  3. 邮件: Send to 负责人
     "您的变更存在冲突，请查看"
```

**场景 4: Deadline 提醒**

```
触发: Schedule (每天 9:00)

条件: 筛选 Changes where 剩余天数 < 2 AND 状态 != Done

动作:
  1. Slack: Send summary
     "⏰ 即将到期:\n- {{CHANGE_1}} ({{DAYS}} 天)\n- {{CHANGE_2}} ({{DAYS}} 天)"

  2. 邮件: Send to 对应负责人
```

### 高级功能

**公式字段**:

```
# 剩余天数
prop("预计完成") - now()

# 状态标签
if(prop("剩余天数") < 0, "🔴 已逾期",
   if(prop("剩余天数") < 3, "🟡 即将到期",
   "🟢 正常"))

# 工作量估算
if(prop("影响范围").includes("api"), 5,
   if(prop("影响范围").includes("ui"), 3, 2))
```

**关联关系**:

- Changes ↔ People (负责人)
- Changes ↔ Changes (依赖/冲突)
- Changes ↔ Docs (规格文档)

## Trello 方案（轻量快速）

适合已经使用 Trello 或想要简单快速上手的团队。

**Board 结构**:

```
OpenSpec Changes
├── 📋 Proposed
│   └── 卡片: 添加用户认证
├── 🔄 Active
│   └── 卡片: 支付流程优化 [进度: 60%]
├── ⏸️ Blocked
│   └── 卡片: 用户资料升级 [原因: 等待设计]
├── 👀 Review
│   └── 卡片: 登录页面改版
└── ✅ Done
    └── 卡片: 密码重置功能 [完成: 2026-03-28]
```

**Power-Ups**:

- **GitLab**: 关联 MR，自动同步状态
- **Slack**: 变更通知
- **Calendar**: 截止日期同步
- **Butler**: 自动化规则

**Butler 自动化规则**:

```
当卡片移动到 Blocked:
  → 添加红色标签 "BLOCKED"
  → @ 团队负责人
  → 发送到 Slack #openspec-alerts

当卡片 3 天未更新:
  → 添加黄色标签 "STALE"
  → 提醒负责人

当截止日期临近 (< 2天):
  → 添加紧急标记
  → 发送邮件提醒
```

## Linear 方案（开发者友好）

适合追求极致效率的技术团队。

**特点**:

- 键盘操作优先
- Git 集成深度（自动关联 branch/commit）
- 快速创建和切换任务
- 优秀的搜索和筛选

**工作流**:

```
Keyboard: C → 创建 Change
         ⌘K → 快速跳转
         ⌘/ → 分配给某人

Git 集成:
  git checkout -b feature/add-auth
  git commit -m "feat: add auth"
  → Linear 自动关联，显示在 Active
```

## 方案对比

| 维度           | Notion     | Trello     | Linear     |
| -------------- | ---------- | ---------- | ---------- |
| **功能丰富度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐     | ⭐⭐⭐⭐   |
| **上手难度**   | ⭐⭐⭐     | ⭐⭐       | ⭐⭐       |
| **可视化能力** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐     |
| **自动化能力** | ⭐⭐⭐⭐   | ⭐⭐⭐     | ⭐⭐⭐⭐   |
| **开发者体验** | ⭐⭐⭐     | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ |
| **成本**       | 免费-8$/人 | 免费-5$/人 | 免费-8$/人 |

## 实施步骤

### Phase 1: 工具选择（1天）

根据团队特点选择：

- **已有文档在 Notion** → 选 Notion
- **喜欢简单直观** → 选 Trello
- **追求效率** → 选 Linear

### Phase 2: 基础配置（1-2天）

1. **创建工作区/看板**
2. **配置数据库/字段**
3. **创建多视图**
4. **设置 Dashboard**

### Phase 3: 自动化（1-2天）

1. **注册 Make.com / Zapier**
2. **连接 GitLab**
3. **配置 3-5 个核心自动化场景**
4. **测试并优化**

### Phase 4: 推广（2-4周）

同方案一的渐进式推广。

## 优势

1. **可视化强大**
   - 多视图满足不同需求
   - Dashboard 一目了然
   - 自定义字段灵活

2. **自动化丰富**
   - 无需编程
   - 跨工具集成
   - 定时触发

3. **信息集中**
   - 不仅是状态，还有完整信息
   - 可关联文档、人员
   - 历史记录完整

4. **协作增强**
   - 评论、@提及
   - 实时通知
   - 权限管理

## 局限

1. **额外成本**
   - 可能需要付费
   - 需要学习新工具

2. **集成复杂度**
   - 需要配置自动化
   - 可能出现同步延迟

3. **依赖外部服务**
   - 需要网络连接
   - 数据在外部（可选本地导出）

## 适用场景

✅ **推荐使用**:

- 已经在使用 Notion/Trello/Linear
- 需要强大的可视化
- 需要复杂的报表和统计
- 愿意投入时间配置自动化

❌ **不推荐使用**:

- 预算非常有限
- 不想引入新工具
- 团队抗拒学习新系统

## 下一步

查看 [方案三：实时协作方案](solution-3-realtime.md) 了解基于 WebSocket 的实时同步方案。
