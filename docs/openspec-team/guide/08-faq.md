# 08 - 常见问题 FAQ

> 团队协作实施过程中的常见问题和解决方案

## 目录

- [问题分析阶段](#问题分析阶段)
- [配置阶段](#配置阶段)
- [冲突检测阶段](#冲突检测阶段)
- [实施阶段](#实施阶段)
- [团队协作问题](#团队协作问题)
- [技术问题](#技术问题)

---

## 问题分析阶段

### Q1: 如何评估我们团队是否需要这套方案？

**A**: 评估清单：

- [ ] 团队规模是否 >10 人？
- [ ] 是否使用 GitLab 管理代码？
- [ ] 是否有多个功能并行开发？
- [ ] 是否出现过代码合并冲突？
- [ ] 是否有文档不同步的问题？
- [ ] 是否需要跨团队协调？

如果 **≥3 项为是**，建议实施。

### Q2: 我们团队只有 5 人，需要这套方案吗？

**A**: 小团队（<10 人）建议：

- **简化版**：只用 GitLab Board + Labels
- **不做**：CI 冲突检测、Swagger 集成
- **重点**：团队守则和沟通规范

参考：[方案一：GitLab 原生](../solutions/solution-1-gitlab.md) 简化实施

### Q3: 我们用 GitHub，不是 GitLab，怎么办？

**A**: 方案适配：

| 功能   | GitLab        | GitHub 对应        |
| ------ | ------------- | ------------------ |
| Labels | Labels        | Labels（相同）     |
| MR     | Merge Request | Pull Request       |
| Board  | Issue Board   | Projects（需配置） |
| CI     | GitLab CI     | GitHub Actions     |
| 模板   | MR Templates  | PR Templates       |

**适配脚本**：将 `.gitlab-ci.yml` 改为 `.github/workflows/`

---

## 配置阶段

### Q4: Labels 创建后没人用怎么办？

**A**: 强制+激励：

1. **MR 模板强制添加**

   ```markdown
   /label ~"openspec::change" ~"openspec::status::active"
   ```

2. **CI 检查**

   ```yaml
   # .gitlab-ci.yml
   check-labels:
     script:
       - |
         if ! git log -1 --pretty=format:"%s" | grep -q "openspec::"; then
           echo "Error: MR must have openspec label"
           exit 1
         fi
   ```

3. **负责人带头使用**

### Q5: Board 配置复杂，有没有简化版？

**A**: 最小可行 Board：

```
只创建 3 列：
├── Active (正在进行的变更)
├── Review (等待审核)
└── Done (已完成)

过滤条件：
Active: label = "openspec::status::active"
Review: label = "openspec::status::review"
Done: MR 状态 = merged
```

### Q6: 现有的工作流工具（Jira/禅道）怎么办？

**A**: 两种方案：

**方案一：双轨运行（推荐）**

- OpenSpec 管理代码变更（技术侧）
- Jira/禅道管理需求和进度（业务侧）
- MR 描述中引用 Jira Issue

**方案二：完全迁移**

- 需要团队决策
- 迁移成本高，不推荐

---

## 冲突检测阶段

### Q7: CI 冲突检测误报率高怎么办？

**A**: 调整检测策略：

```yaml
# 方案一：精确匹配（减少误报）
CONFLICTS=$(git diff origin/main --name-only | grep "openspec/changes/.*/specs/")

# 方案二：忽略特定文件
EXCLUDE="*.md README.md"
CONFLICTS=$(git diff origin/main --name-only | grep -v "$EXCLUDE" | grep "openspec/")

# 方案三：只检测 specs 目录
CONFLICTS=$(git diff origin/main --name-only | grep "openspec/changes/.*/specs/")
```

### Q8: 检测到冲突后如何高效协调？

**A**: 标准协调流程：

```
┌─────────────────────────────────────────────────────────────┐
│                冲突协调工作流                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. CI 检测到冲突                                           │
│     ↓                                                       │
│  2. 自动 @ 相关开发者                                       │
│     ↓                                                       │
│  3. 协调人在 MR 评论中记录方案                               │
│     │                                                       │
│     ├─ 方案A: 谁 first，谁 rebase                          │
│     ├─ 方案B: 拆分变更                                      │
│     └─ 方案C: 合并工作分支                                  │
│     ↓                                                       │
│  4. 更新 MR 描述中的"协调记录"                              │
│     ↓                                                       │
│  5. CI 重新检测（冲突解决后自动更新标签）                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Q9: 我们团队跨时区，冲突检测通知没人看怎么办？

**A**: 多渠道通知：

```yaml
# .gitlab-ci.yml
notify-conflict:
  script:
    # 1. MR 评论
    - curl -X POST "${CI_API_V4_URL}/merge_requests/${IID}/notes" -d "body=${COMMENT}"

    # 2. Slack 通知
    - curl -X POST "${SLACK_WEBHOOK}" -d "text=${MESSAGE}"

    # 3. 邮件通知
    - curl -X POST "${EMAIL_API}" -d "to=${AUTHOR_EMAIL}&subject=${SUBJECT}"
```

**团队协议**：设置"值班开发者"轮换，负责处理跨时区冲突。

---

## 实施阶段

### Q10: 如何说服团队使用这套方案？

**A**: 分阶段证明价值：

**Week 1-2: 试点**

- 选择 1-2 个团队试点
- 只用 Labels + Board
- 收集数据（冲突次数、解决时间）

**Week 3-4: 展示成果**

```markdown
试点成果：

- 冲突发现时间：从 2 天 → 30 分钟
- 平均解决时间：从 4 小时 → 1 小时
- 团队满意度：4.2/5
```

**Month 2+: 扩大范围**

- 全团队推广
- 收集反馈，优化流程

### Q11: 团队抵触新流程怎么办？

**A**: 常见抵触原因和解决方案：

| 抵触原因     | 解决方案                     |
| ------------ | ---------------------------- |
| "太麻烦"     | 展示省时数据，提供脚本自动化 |
| "没必要"     | 用试点数据证明价值           |
| "习惯旧方式" | 设置过渡期，允许逐步迁移     |
| "没人教"     | 提供培训，写操作文档         |

**沟通模板**：

> "这套方案不是增加工作量，而是把原来混乱的协调过程标准化。
> 以前：冲突了才发现，花 4 小时协调
> 现在：事前可见，30 分钟定位，1 小时解决"

### Q12: 实施到一半发现不适用怎么办？

**A**: 降级策略：

```
完整方案
    ↓ 发现 CI 配置复杂
简化方案：只用 Board + Labels
    ↓ 发现团队规模小
最小方案：只用 MR 模板
```

**原则**：先推行最低可行方案，再逐步增强。

---

## 团队协作问题

### Q13: 两个人同时修改同一个 specs 文件怎么办？

**A**: 推荐协调方案：

**优先级规则**：

```
1. 功能优先级高的先合并
2. 修改范围小的先合并
3. 创建时间早的先合并
```

**具体步骤**：

```bash
# 开发者 A（先合并）
git checkout feature/A
git push origin feature/A
# 创建 MR，合并到 main

# 开发者 B（后合并）
git checkout feature/B
git fetch origin main
git rebase origin/main
# 解决冲突
git push origin feature/B
# 创建 MR
```

### Q14: 团队成员忘记更新 MR 标签怎么办？

**A**: 自动化方案：

```yaml
# .gitlab-ci.yml
update-labels:
  script:
    # 创建时自动添加
    - curl -X PUT "${API_URL}/merge_requests/${IID}" -d "add_labels=openspec::change,openspec::status::active"

    # 检测到冲突时自动更新
    - curl -X PUT "${API_URL}/merge_requests/${IID}" -d "add_labels=openspec::conflict::warn"

    # 合并时自动清理
    - curl -X PUT "${API_URL}/merge_requests/${IID}" -d "remove_labels=openspec::status::active,openspec::conflict::warn"
```

### Q15: 如何处理紧急变更（hotfix）？

**A**: Hotfast 通道：

```yaml
# 紧急变更标签
openspec::priority::p0  # 紧急：系统不可用
openspec::priority::p1  # 高：核心功能损坏
openspec::priority::p2  # 中：非核心问题
openspec::priority::p3  # 低：轻微问题

# CI 跳过检测
only:
  variables:
    - $CI_MERGE_REQUEST_LABELS =~ /openspec::priority::p0/
```

**事后流程**：

1. 创建 hotfix MR
2. 合并后 24 小时内补充 spec 文档
3. 添加回归测试

---

## 技术问题

### Q16: GitLab CI 配置报错怎么办？

**A**: 常见错误排查：

| 错误                | 原因              | 解决方案           |
| ------------------- | ----------------- | ------------------ |
| `Permission denied` | CI_TOKEN 权限不足 | 添加 API scope     |
| ` Branch not found` | 分支名错误        | 检查分支名是否正确 |
| `YAML syntax error` | 缩进错误          | 使用 YAML 校验器   |
| ` Job failed`       | 脚本执行失败      | 查看 job 日志      |

**调试技巧**：

```yaml
# 添加调试输出
script:
  - echo "Current branch: ${CI_MERGE_REQUEST_SOURCE_BRANCH_NAME}"
  - echo "Current MR: ${CI_MERGE_REQUEST_IID}"
  - git status
  - git branch -a
```

### Q17: Board 不显示我的 MR 怗么办？

**A**: 检查清单：

- [ ] MR 是否有 `openspec::change` 标签？
- [ ] Board 过滤条件是否正确？
- [ ] MR 状态是否是 "opened"（非 merged/closed）？
- [ ] 你是否有权限看到这个 Board？

**调试命令**：

```bash
# 使用 GitLab CLI
glab mr list --label="openspec::change" --state=opened

# 检查 API
curl "${CI_API_V4_URL}/projects/${PROJECT_ID}/merge_requests?state=opened&labels=openspec::change"
```

### Q18: 如何在 CI 中检测 specs 文件变更？

**A**: 检测脚本：

```yaml
openspec-check:
  script:
    # 获取变更的 specs 文件
    - SPEC_FILES=$(git diff origin/main --name-only | grep "openspec/changes/.*/specs/")

    # 如果有 specs 变更，运行额外检查
    - |
      if [ ! -z "$SPEC_FILES" ]; then
        echo "检测到 specs 变更："
        echo "$SPEC_FILES"

        # 检查格式
        for file in $SPEC_FILES; do
          if ! grep -q "^# " "$file"; then
            echo "错误: $file 缺少标题"
            exit 1
          fi
        done
      fi
```

### Q19: 多个 MR 检测到循环冲突怎么办？

**A**: 循环冲突场景：

```
MR-A 依赖 MR-B
MR-B 依赖 MR-C
MR-C 依赖 MR-A
```

**解决方案**：

1. **识别循环依赖**

   ```bash
   # 检测脚本
   for mr in $ALL_MRS; do
     deps=$(grep "Depends on" "$mr" || true)
     # 构建依赖图，检测环
   done
   ```

2. **重建依赖链**

   ```
   原计划：A → B → C → A（循环）

   调整为：C → B → A（线性）
   或：A、B、C 合并到一个 MR
   ```

3. **协调优先级**
   - 最小依赖的先合并
   - 或合并多个 MR 为一个

### Q20: Swagger 同步脚本报错怎么办？

**A**: 常见错误：

| 错误               | 原因             | 解决方案                 |
| ------------------ | ---------------- | ------------------------ |
| `git clone failed` | 权限不足         | 检查 DEPLOY_KEY          |
| `YAML parse error` | Swagger 格式错误 | 使用 Swagger Editor 校验 |
| `Version conflict` | 版本号重复       | 更新版本号               |

**调试脚本**：

```bash
#!/bin/bash
# 本地调试

# 1. 测试克隆
git clone "${REGISTRY_URL}" /tmp/registry

# 2. 测试文件复制
cp swagger.yaml /tmp/registry/services/test/

# 3. 测试提交
cd /tmp/registry
git status
git commit -m "test"
```

---

## 其他问题

### Q21: 这个方案适用于敏捷开发吗？

**A**: 完全适用，且增强敏捷：

| 敏捷实践 | OpenSpec 方案       |
| -------- | ------------------- |
| 迭代规划 | Board 可视化 Sprint |
| 每日站会 | Board 状态更新      |
| 代码审查 | MR + 冲突检测       |
| 持续集成 | CI 自动检测         |

**建议**：

- Sprint 开始前检查 Active Changes
- 每日站会用 Board 展示进度
- Sprint 结束时归档完成的变更

### Q22: 如何与 Code Review 流程配合？

**A**: 集成方式：

```
OpenSpec 流程        Code Review 流程
────────────────     ────────────────
/specs 编写          → 技术方案审查
设计审查             → PR 创建
任务实施             → 代码审查
规格更新             → PR 更新
合并                 → 合并
归档                 → 完成
```

**关键点**：

- MR 描述中包含 spec 链接
- Reviewer 必须检查 spec-code 一致性
- CI 必须检测 spec 变更

### Q23: 历史项目如何迁移到这套方案？

**A**: 渐进迁移：

**Phase 1: 基础设施（Week 1）**

- 配置 Labels
- 创建 MR 模板
- 设置 Board

**Phase 2: 新功能（Week 2-4）**

- 所有新功能使用 OpenSpec
- 旧功能继续旧流程

**Phase 3: 归档历史（Month 2+）**

- 历史功能不需要补 spec
- 按需逐步补充

### Q24: 如何衡量方案实施效果？

**A**: 关键指标：

```markdown
## 量化指标

| 指标          | 实施前 | 实施后  | 目标    |
| ------------- | ------ | ------- | ------- |
| 冲突发现时间  | 2 天   | 30 分钟 | <1 小时 |
| 冲突解决时间  | 4 小时 | 1 小时  | <2 小时 |
| MR 重复打开率 | 30%    | 5%      | <10%    |
| 文档同步率    | 40%    | 90%     | >85%    |

## 团队反馈

| 评分项 | 实施2周 | 实施2月 | 目标 |
| ------ | ------- | ------- | ---- |
| 易用性 | 3.5/5   | 4.2/5   | >4.0 |
| 有效性 | 3.8/5   | 4.5/5   | >4.0 |
| 满意度 | 3.2/5   | 4.3/5   | >4.0 |
```

---

## 检查清单速查

### 实施前检查

- [ ] 团队规模评估（建议 >10 人）
- [ ] GitLab 版本确认（建议 >= 13.0）
- [ ] 管理层支持确认
- [ ] 试点团队组建

### 配置检查

- [ ] Labels 创建完成（7 个）
- [ ] MR 模板创建
- [ ] Board 创建
- [ ] CI Job 配置
- [ ] Slack 通知（可选）

### 运行检查

- [ ] 团队已培训
- [ ] 首次试点完成
- [ ] 反馈收集完成
- [ ] 问题清单建立

---

**还有问题？** 查看：

- [06 - 工具脚本](06-scripts.md) - 可直接使用的脚本
- [07 - 团队守则](07-guidelines.md) - 使用规范
