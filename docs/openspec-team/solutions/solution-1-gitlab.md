# 方案一：GitLab 原生协作方案

## 概述

基于 GitLab 原生功能（MR、Labels、Board、CI）实现的 OpenSpec 团队协作方案。

**核心特点**:

- ✅ 零额外工具依赖
- ✅ 与现有 GitLab 工作流无缝集成
- ✅ 实施成本低，1-2天即可上线
- ✅ 适合团队规模 10-100 人

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    GitLab 原生协作层                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  GitLab MR                                                  │
│  ├── MR 模板 (openspec_change.md)                           │
│  ├── Labels 体系                                            │
│  │   ├── openspec::change                                   │
│  │   ├── openspec::status::*                                │
│  │   └── openspec::conflict::*                              │
│  └── CI/CD 集成                                             │
│      ├── 冲突检测 job                                       │
│      ├── 自动评论                                           │
│      └── 标签更新                                           │
│                                                             │
│  GitLab Board                                               │
│  ├── 📋 Proposed                                            │
│  ├── 🔄 Active                                              │
│  ├── ⚠️ 冲突                                                │
│  ├── 👀 Review                                              │
│  └── ✅ Done                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 实施步骤

### Phase 1: 基础配置（1天）

#### 1. 创建 Labels

在 GitLab 项目设置中创建：

| Label                       | 颜色    | 用途               |
| --------------------------- | ------- | ------------------ |
| `openspec::change`          | #428BCA | 标识 OpenSpec 变更 |
| `openspec::status::active`  | #5CB85C | 变更进行中         |
| `openspec::status::review`  | #F0AD4E | 变更审核中         |
| `openspec::status::blocked` | #D9534F | 变更被阻塞         |
| `openspec::conflict::none`  | #5CB85C | 无冲突             |
| `openspec::conflict::warn`  | #F0AD4E | 潜在冲突           |
| `openspec::conflict::block` | #D9534F | 冲突阻塞           |

#### 2. 创建 MR 模板

创建文件 `.gitlab/merge_request_templates/openspec_change.md`：

```markdown
## OpenSpec 变更

### 基本信息

- **变更名称**: %{source_branch}
- **创建人**: @%{author}

### 变更范围

- [ ] 后端 API 变更
- [ ] 前端界面变更
- [ ] 数据库 Schema 变更

### 规格文档

- `openspec/changes/%{source_branch}/proposal.md`
- `openspec/changes/%{source_branch}/design.md`
- `openspec/changes/%{source_branch}/specs/`

### 冲突检查

- [ ] 已查看 Board 确认无冲突
- [ ] 已检查与其他 Active Changes 的依赖

### 协调记录

**相关 MR**:
**协调人**:
**解决方案**:

/label ~openspec::change ~openspec::status::active
```

#### 3. 创建 Board

**名称**: OpenSpec 协调板

**列配置**:
| 列名 | 过滤条件 |
|------|----------|
| 📋 Proposed | Label = `openspec::change` |
| 🔄 Active | Label = `openspec::status::active` |
| ⚠️ 冲突 | Label = `openspec::conflict::*` |
| 👀 Review | Label = `openspec::status::review` |
| ✅ Done | MR 状态 = Merged |

### Phase 2: CI 自动化（1天）

在 `.gitlab-ci.yml` 中添加：

```yaml
openspec-conflict-check:
  stage: test
  image: alpine/git
  script:
    - apk add --no-cache curl jq
    - |
      # 获取所有 open 的 OpenSpec MR
      ACTIVE_MRS=$(curl -s --header "PRIVATE-TOKEN: ${CI_JOB_TOKEN}" \
        "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/merge_requests?state=opened" \
        | jq -r '.[] | select(.labels | contains(["openspec::change"])) | .source_branch')

      # 检查当前 MR 与其他的冲突
      for branch in $ACTIVE_MRS; do
        if [ "$branch" != "$CI_MERGE_REQUEST_SOURCE_BRANCH_NAME" ]; then
          git fetch origin $branch:$branch
          
          # 检查 specs 文件重叠
          CURRENT=$(git diff main --name-only | grep "openspec/changes/")
          OTHER=$(git diff main $branch --name-only | grep "openspec/changes/")
          CONFLICTS=$(echo "$CURRENT" | grep -F "$OTHER" || true)
          
          if [ ! -z "$CONFLICTS" ]; then
            echo "⚠️  潜在冲突与 $branch:"
            echo "$CONFLICTS"
            echo "CONFLICT=true" >> build.env
          fi
        fi
      done
  artifacts:
    reports:
      dotenv: build.env
  only:
    - merge_requests

openspec-comment:
  stage: test
  needs:
    - openspec-conflict-check
  script:
    - |
      if [ "$CONFLICT" = "true" ]; then
        curl -X POST --header "PRIVATE-TOKEN: ${CI_JOB_TOKEN}" \
          --data "body=⚠️ **OpenSpec 冲突警告**..." \
          "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/merge_requests/${CI_MERGE_REQUEST_IID}/notes"
        
        curl -X PUT --header "PRIVATE-TOKEN: ${CI_JOB_TOKEN}" \
          --data "add_labels=openspec::conflict::warn" \
          "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/merge_requests/${CI_MERGE_REQUEST_IID}"
      fi
  only:
    - merge_requests
```

### Phase 3: 团队推广（2-4周）

按照渐进式路线推广：

1. Week 1: 试点（2-3人）
2. Week 2: 小团队（5-10人）
3. Week 3-4: 逐步扩大
4. Month 2: 全团队

## 工作流程

```
开发者开始工作:
  1. 查看 GitLab Board
       └── 确认无冲突的 Active Changes

  2. 创建 MR (使用 openspec_change 模板)
       └── 自动添加 Labels
       └── 自动触发 CI 冲突检测

  3. 开发实现
       └── Board 卡片在 Active 列

  4. 提交代码
       └── CI 自动检测冲突
       └── 如有冲突，自动评论并更新标签

  5. 协调冲突
       └── 在 MR 中沟通
       └── 更新 MR 描述的"协调记录"

  6. 审核通过 → 合并
       └── Board 自动归档到 Done
```

## 优势

1. **零额外成本**
   - 不需要购买新工具
   - 不需要额外服务器

2. **无缝集成**
   - 开发者已经在 GitLab 工作
   - 不改变现有习惯

3. **快速实施**
   - 1-2天即可完成基础配置
   - 立即可用

4. **可扩展**
   - 从小团队到 80+ 人都适用
   - 可根据需要增强（Swagger 集成等）

## 局限

1. **可视化有限**
   - GitLab Board 功能较基础
   - 无法进行复杂的筛选和统计

2. **自动化受限**
   - 依赖 GitLab CI
   - 跨工具集成能力有限

3. **实时性不足**
   - 状态更新依赖 CI 触发
   - 不是实时同步

## 适用场景

✅ **推荐使用**:

- 已经在使用 GitLab
- 不想引入新工具
- 需求简单直接
- 预算有限

❌ **不推荐使用**:

- 需要强大的可视化报表
- 需要跨多平台集成
- 追求极致的实时协作

## 下一步

完成基础配置后，可查看：

- [方案二：集成看板方案](solution-2-notion.md) - 更强大的可视化
- [方案三：实时协作方案](solution-3-realtime.md) - 实时同步

或参考主文档：

- [实施路线图](../guide/05-roadmap.md)
- [工具脚本](../guide/06-scripts.md)
