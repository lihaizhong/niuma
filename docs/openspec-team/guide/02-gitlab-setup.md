# 02 - GitLab 配置

> GitLab Labels、MR 模板、Board 的完整配置指南

## 配置清单

- [ ] 1.1 创建 Label 体系（7 个标签）
- [ ] 1.2 创建 MR 模板
- [ ] 1.3 创建 Board 视图
- [ ] 1.4 配置 GitLab CI 变量

---

## 1.1 创建 Label 体系

### 在 GitLab 项目设置中创建

路径：`项目 Settings → Labels → New Label`

| Label 名称                  | 颜色             | 说明                       |
| --------------------------- | ---------------- | -------------------------- |
| `openspec::change`          | `#428BCA` (蓝色) | 标识这是一个 OpenSpec 变更 |
| `openspec::status::active`  | `#69D100` (绿色) | 变更进行中                 |
| `openspec::status::review`  | `#F0AD4E` (橙色) | 变更审核中                 |
| `openspec::status::blocked` | `#D9534F` (红色) | 变更被阻塞                 |
| `openspec::conflict::none`  | `#5CB85C` (绿色) | 无冲突                     |
| `openspec::conflict::warn`  | `#F0AD4E` (橙色) | 潜在冲突                   |
| `openspec::conflict::block` | `#D9534F` (红色) | 冲突阻塞                   |

### 使用说明

```
MR 创建时自动添加: openspec::change + openspec::status::active

CI 检测冲突后更新:
  - 无冲突: openspec::conflict::none
  - 潜在冲突: openspec::conflict::warn
  - 严重冲突: openspec::conflict::block

状态流转:
  active → review → (merged → 自动移除所有标签)
```

---

## 1.2 创建 MR 模板

### 文件路径

```
.gitlab/merge_request_templates/openspec_change.md
```

### 模板内容

```markdown
## OpenSpec 变更

<!-- 此模板用于 OpenSpec 工作流的标准化变更 -->

### 基本信息

- **变更名称**: %{source_branch}
- **创建时间**: 自动填充
- **作者**: @%{author}

### 变更范围

<!-- 请填写此变更影响的范围 -->

- [ ] 后端 API 变更
- [ ] 前端界面变更
- [ ] 数据库 Schema 变更
- [ ] 配置文件变更
- [ ] 文档更新

**影响的服务/模块**:

<!-- 列出受影响的服务或模块，如：user-service, auth-module -->

### 规格文档

<!-- 列出此变更涉及的规格文件 -->

- `openspec/changes/%{source_branch}/proposal.md`
- `openspec/changes/%{source_branch}/design.md`
- `openspec/changes/%{source_branch}/specs/`

### 冲突检查

<!-- CI 会自动更新此部分，开发者只需确认 -->

- [ ] 已检查与其他 Active Changes 的冲突
- [ ] 已确认 Swagger 文档需要更新（如适用）
- [ ] 已通知相关团队（如适用）

**冲突状态**: <!-- CI 会自动更新：无冲突/潜在冲突/冲突阻塞 -->

### 协调记录

<!-- 如有冲突，在此记录协调过程和结果 -->

**相关 MR**:

<!-- 列出相关的其他 MR，如：!123, !124 -->

**协调人**:

<!-- @ 协调此冲突的开发者 -->

**解决方案**:

<!-- 描述如何解决冲突 -->

### 部署信息

- **目标环境**: <!-- dev / staging / prod -->
- **预计完成时间**: <!-- YYYY-MM-DD -->
- **回滚计划**: <!-- 如有风险，描述回滚步骤 -->

### 检查清单

- [ ] 规格文档已更新
- [ ] 代码实现已完成
- [ ] 单元测试已添加
- [ ] Swagger 文档已同步（如适用）
- [ ] 已通知相关团队（如适用）

---

/label ~openspec::change ~openspec::status::active
```

### 如何使用

创建 MR 时，选择模板：

```
Create Merge Request → Description →
选择模板: openspec_change
```

---

## 1.3 创建 Board 视图

### 创建步骤

1. 进入项目 → Issues → Boards
2. 点击 "Create new board"
3. 配置如下：

### Board 配置

**名称**: `OpenSpec 协调板`

**列设置**:

| 列名        | 过滤条件                                      |
| ----------- | --------------------------------------------- |
| **Backlog** | Label = `openspec::change` AND 无 status 标签 |
| **Active**  | Label = `openspec::status::active`            |
| **Review**  | Label = `openspec::status::review`            |
| **Blocked** | Label = `openspec::status::blocked`           |
| **Done**    | MR 状态 = Merged                              |

### Board 视图效果

```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│   Backlog   │   Active    │   Review    │   Blocked   │    Done     │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│             │ !123        │ !125        │ !127        │ !120        │
│             │ add-auth    │ fix-login   │ payment     │ user-profile│
│             │ 🟡 warn     │ 🟢 none     │ 🔴 block    │             │
│             │             │             │             │             │
│             │ !124        │             │             │ !121        │
│             │ order-api   │             │             │ refactor-db │
│             │ 🟢 none     │             │             │             │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

### 卡片显示配置

在 Board 设置中，配置卡片显示：

- Title
- Author
- Labels（显示 conflict 状态标签）
- Pipeline status

---

## 1.4 配置 GitLab CI 变量

### 需要的变量

在 `项目 Settings → CI/CD → Variables` 中添加：

| 变量名                 | 值                            | 说明               |
| ---------------------- | ----------------------------- | ------------------ |
| `CI_JOB_TOKEN`         | (自动生成)                    | 用于 API 调用      |
| `OPENSPEC_WEBHOOK_URL` | `https://hooks.slack.com/...` | 通知 Slack（可选） |

---

## 下一步

配置完成后，继续设置冲突检测：
→ [03 - 冲突检测](03-conflict-detection.md)
