# 03 - 冲突检测

## 概述

本章介绍如何通过 GitLab CI 自动检测 OpenSpec 变更之间的冲突。

**预计时间**: 1-2 小时  
**前提条件**: GitLab CI/CD 配置权限

---

## 检测策略

### 冲突类型

```
文件级冲突:     specs/auth.md 被两个 MR 同时修改
章节级冲突:     specs/auth.md 的 "Requirements" 被同时修改
依赖冲突:       MR-A 依赖 MR-B，但 MR-B 未完成
API 冲突:       两个 MR 修改同一 API 端点
```

### 检测时机

```
MR 创建时 ────▶ 轻量检测（文件级）
MR 更新时 ────▶ 轻量检测（文件级）
每日定时 ────▶ 深度检测（章节级 + 依赖）
```

---

## 第一步：基础 CI 配置

### 1.1 添加 CI Job

```yaml
# .gitlab-ci.yml

stages:
  - test
  - openspec-check

# OpenSpec 冲突检测
openspec-conflict-check:
  stage: openspec-check
  image: alpine/git
  script:
    - apk add --no-cache curl jq
    - |
      echo "🔍 检查 OpenSpec 冲突..."

      # 获取当前 MR 信息
      CURRENT_MR=${CI_MERGE_REQUEST_IID}
      CURRENT_BRANCH=${CI_MERGE_REQUEST_SOURCE_BRANCH_NAME}

      # 获取所有 open 的 MR
      ACTIVE_MRS=$(curl -s --header "PRIVATE-TOKEN: ${CI_JOB_TOKEN}" \
        "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/merge_requests?state=opened&per_page=100" \
        | jq -r '.[] | select(.labels | contains(["openspec::change"])) | .source_branch')

      echo "发现 Active OpenSpec Changes:"
      echo "$ACTIVE_MRS"

      # 检查冲突
      CONFLICT_FOUND=false
      for branch in $ACTIVE_MRS; do
        if [ "$branch" != "$CURRENT_BRANCH" ]; then
          git fetch origin $branch:$branch 2>/dev/null || true
          
          # 检查 specs 文件重叠
          CURRENT_SPECS=$(git diff origin/main --name-only | grep "openspec/changes/" || true)
          OTHER_SPECS=$(git diff origin/main $branch --name-only | grep "openspec/changes/" || true)
          
          if [ ! -z "$CURRENT_SPECS" ] && [ ! -z "$OTHER_SPECS" ]; then
            CONFLICTS=$(echo "$CURRENT_SPECS" | grep -F "$OTHER_SPECS" || true)
            if [ ! -z "$CONFLICTS" ]; then
              echo "⚠️  潜在冲突与 $branch:"
              echo "$CONFLICTS"
              CONFLICT_FOUND=true
            fi
          fi
        fi
      done

      # 设置环境变量供后续步骤使用
      if [ "$CONFLICT_FOUND" = true ]; then
        echo "CONFLICT_DETECTED=true" >> build.env
        exit 1
      else
        echo "CONFLICT_DETECTED=false" >> build.env
      fi
  artifacts:
    reports:
      dotenv: build.env
    paths:
      - build.env
    expire_in: 1 hour
  only:
    - merge_requests
  except:
    variables:
      - $CI_MERGE_REQUEST_LABELS =~ /openspec::conflict::skip/
```

### 1.2 添加冲突评论

```yaml
# 在 .gitlab-ci.yml 中添加

openspec-comment:
  stage: openspec-check
  image: alpine/curl
  needs:
    - openspec-conflict-check
  script:
    - |
      if [ "$CONFLICT_DETECTED" = "true" ]; then
        echo "添加冲突评论..."

        COMMENT="⚠️ **OpenSpec 冲突警告**

此 MR 与其他 Active Changes 存在潜在冲突。

**可能冲突的文件**:
请查看 Pipeline 日志了解详情。

**建议操作**:
1. 查看 [OpenSpec Board](${CI_PROJECT_URL}/-/boards)
2. 与相关开发者协调
3. 在 MR 描述中更新协调记录

/cc @${GITLAB_USER_LOGIN}"

        curl -X POST --header "PRIVATE-TOKEN: ${CI_JOB_TOKEN}" \
          --data "body=$(echo "$COMMENT" | jq -sR .)" \
          "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/merge_requests/${CI_MERGE_REQUEST_IID}/notes"

        # 更新标签
        curl -X PUT --header "PRIVATE-TOKEN: ${CI_JOB_TOKEN}" \
          --data "add_labels=openspec::conflict::warn" \
          "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/merge_requests/${CI_MERGE_REQUEST_IID}"
      fi
  only:
    - merge_requests
```

---

## 第二步：增强检测（可选）

### 2.1 章节级冲突检测

```bash
#!/bin/bash
# scripts/openspec-deep-check.sh

echo "🔍 深度冲突检测..."

# 获取当前变更的 specs 章节
get_spec_sections() {
  local file=$1
  grep "^## " "$file" | sed 's/^## //' | sort
}

# 对比两个分支的章节变化
check_section_conflicts() {
  local branch1=$1
  local branch2=$2
  local spec_file=$3

  sections1=$(git show $branch1:$spec_file 2>/dev/null | get_spec_sections || true)
  sections2=$(git show $branch2:$spec_file 2>/dev/null | get_spec_sections || true)

  # 检查同一章节是否都被修改
  common_sections=$(comm -12 <(echo "$sections1") <(echo "$sections2"))

  if [ ! -z "$common_sections" ]; then
    echo "章节冲突在 $spec_file:"
    echo "$common_sections"
  fi
}

# 主逻辑
CURRENT_BRANCH=$1
TARGET_BRANCH=$2

# 获取当前变更的 specs 文件
SPEC_FILES=$(git diff $TARGET_BRANCH..$CURRENT_BRANCH --name-only | grep "openspec/changes/.*/specs/.*\\.md" || true)

for file in $SPEC_FILES; do
  check_section_conflicts $CURRENT_BRANCH $TARGET_BRANCH $file
done
```

### 2.2 集成到 CI

```yaml
openspec-deep-check:
  stage: openspec-check
  image: alpine/git
  script:
    - chmod +x scripts/openspec-deep-check.sh
    - scripts/openspec-deep-check.sh $CI_MERGE_REQUEST_SOURCE_BRANCH_NAME origin/main
  only:
    - merge_requests
  when: manual # 手动触发深度检测
```

---

## 第三步：本地冲突检查

### 3.1 本地脚本

```bash
#!/bin/bash
# scripts/openspec-check-local.sh

echo "🔍 OpenSpec 本地冲突检查"
echo "=========================="

# 获取当前分支
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "当前分支: $CURRENT_BRANCH"

# 检查是否安装了 glab
if command -v glab &> /dev/null; then
  echo ""
  echo "📋 GitLab 上的 Active OpenSpec Changes:"
  glab mr list --label="openspec::change" --state=opened 2>/dev/null || echo "  暂无或无法获取"
else
  echo ""
  echo "💡 提示: 安装 glab CLI 可查看远程 MR 列表"
  echo "   https://gitlab.com/gitlab-org/cli"
fi

# 本地 specs 检查
echo ""
echo "📄 你修改的 specs:"
git diff main --name-only | grep "openspec/changes/" || echo "  无"

# 简单的本地冲突检查
echo ""
echo "⚠️  潜在冲突检查:"
STASH_COUNT=$(git stash list | wc -l)
if [ $STASH_COUNT -gt 0 ]; then
  echo "  注意: 你有 $STASH_COUNT 个 stash，可能包含未提交的变更"
fi

# 检查未跟踪文件
UNTRACKED=$(git ls-files --others --exclude-standard openspec/changes/ || true)
if [ ! -z "$UNTRACKED" ]; then
  echo "  未跟踪的 OpenSpec 文件:"
  echo "$UNTRACKED" | head -5
fi

echo ""
echo "💡 提示: 提交前运行 'git diff main --name-only' 查看变更"
```

### 3.2 添加到 git hooks

```bash
# .git/hooks/pre-push
#!/bin/bash

echo "Running OpenSpec pre-push check..."

if [ -f scripts/openspec-check-local.sh ]; then
  scripts/openspec-check-local.sh
fi

exit 0
```

---

## 验证清单

- [ ] CI job 能正常触发
- [ ] 冲突检测能发现重叠的 specs 文件
- [ ] 检测到冲突后自动添加评论
- [ ] 检测到冲突后更新标签
- [ ] 本地脚本能正常运行

---

## 下一步

继续 [04 - Swagger 集成](04-swagger-integration.md) 设置 API 统一管理。
