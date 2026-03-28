# 06 - 工具脚本

## 概述

本章提供可直接使用的脚本和配置文件，帮助快速实施 OpenSpec 团队协作方案。

---

## 脚本清单

| 脚本                 | 用途             | 位置                               |
| -------------------- | ---------------- | ---------------------------------- |
| `check-conflicts.sh` | 本地冲突检查     | `scripts/`                         |
| `gitlab-ci.yml`      | GitLab CI 配置   | `.gitlab-ci.yml`                   |
| `sync-swagger.sh`    | Swagger 自动同步 | `scripts/`                         |
| `mr-template.md`     | MR 模板          | `.gitlab/merge_request_templates/` |

---

## 1. 本地冲突检查脚本

### 文件：`scripts/openspec-check.sh`

```bash
#!/bin/bash
# OpenSpec 本地冲突检查脚本
# 用法: ./scripts/openspec-check.sh

set -e

echo "🔍 OpenSpec 本地冲突检查"
echo "=========================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 获取当前分支
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "当前分支: ${GREEN}$CURRENT_BRANCH${NC}"

# 检查是否在 openspec 分支
if [[ ! $CURRENT_BRANCH =~ ^(feature|bugfix|refactor)/openspec- ]]; then
    echo -e "${YELLOW}⚠️  警告: 分支名不符合 openspec 规范${NC}"
    echo "建议命名: feature/openspec-<name>, bugfix/openspec-<name>"
fi

# 检查 GitLab 状态
echo ""
echo "📋 检查远程状态..."

if command -v glab &> /dev/null; then
    # 使用 glab CLI
    echo "使用 glab 获取远程 MR 列表..."
    ACTIVE_MRS=$(glab mr list --label="openspec::change" --state=opened 2>/dev/null || echo "")

    if [ -z "$ACTIVE_MRS" ]; then
        echo -e "${GREEN}✅ 没有发现其他 Active OpenSpec Changes${NC}"
    else
        echo "$ACTIVE_MRS"
    fi
else
    echo -e "${YELLOW}💡 提示: 安装 glab CLI 可查看远程 MR 列表${NC}"
    echo "   https://gitlab.com/gitlab-org/cli#installation"
fi

# 检查本地变更
echo ""
echo "📄 本地 OpenSpec 变更:"
CHANGED_SPECS=$(git diff main --name-only | grep "openspec/changes/" || true)

if [ -z "$CHANGED_SPECS" ]; then
    echo -e "${YELLOW}  无未提交的 OpenSpec 变更${NC}"
else
    echo -e "${GREEN}$CHANGED_SPECS${NC}"
fi

# 检查未跟踪文件
echo ""
echo "📁 未跟踪的 OpenSpec 文件:"
UNTRACKED=$(git ls-files --others --exclude-standard openspec/changes/ 2>/dev/null || true)

if [ -z "$UNTRACKED" ]; then
    echo -e "${GREEN}  无未跟踪文件${NC}"
else
    echo -e "${YELLOW}$UNTRACKED${NC}"
fi

# 简单冲突检查
echo ""
echo "⚠️  冲突检查:"

# 检查是否有 stash
STASH_COUNT=$(git stash list | wc -l)
if [ $STASH_COUNT -gt 0 ]; then
    echo -e "${YELLOW}  注意: 你有 $STASH_COUNT 个 stash，可能包含未提交的变更${NC}"
fi

# 检查是否落后主分支
BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "0")
if [ "$BEHIND" -gt 0 ]; then
    echo -e "${YELLOW}  警告: 落后于主分支 $BEHIND 个提交，建议先 rebase${NC}"
fi

# 检查是否有未解决的冲突
if git diff --check 2>/dev/null | grep -q "conflict"; then
    echo -e "${RED}  ❌ 发现未解决的冲突！${NC}"
    git diff --check
    exit 1
fi

# 检查 specs 文件格式
echo ""
echo "🔍 规格文件格式检查:"
SPEC_FILES=$(find openspec/changes -name "*.md" -o -name "*.yaml" 2>/dev/null || true)

for file in $SPEC_FILES; do
    if [ -f "$file" ]; then
        # 检查 Markdown 基本格式
        if [[ $file == *.md ]]; then
            # 检查是否有标题
            if ! grep -q "^# " "$file"; then
                echo -e "${YELLOW}  ⚠️  $file 缺少一级标题${NC}"
            fi
        fi
    fi
done

echo ""
echo "✅ 本地检查完成"
echo ""
echo "💡 下一步建议:"
echo "   1. 如果有变更，执行: git add . && git commit -m '[openspec] ...'"
echo "   2. 推送到远程: git push origin $CURRENT_BRANCH"
echo "   3. 创建 MR: glab mr create --label='openspec::change'"
```

### 使用方法

```bash
# 1. 保存脚本
mkdir -p scripts
cat > scripts/openspec-check.sh << 'SCRIPT'
# 粘贴上面脚本内容
SCRIPT

# 2. 添加执行权限
chmod +x scripts/openspec-check.sh

# 3. 运行检查
./scripts/openspec-check.sh

# 4. (可选) 添加到 git hooks
cp scripts/openspec-check.sh .git/hooks/pre-push
```

---

## 2. GitLab CI 配置

### 文件：`.gitlab-ci.yml`

```yaml
# OpenSpec 团队协作 CI 配置
# 将此内容追加到你的 .gitlab-ci.yml 文件

stages:
  - test
  - openspec-check
  - notify

# 变量
variables:
  OPENSPEC_ENABLED: "true"

# OpenSpec 冲突检测
openspec-conflict-check:
  stage: openspec-check
  image: alpine/git
  before_script:
    - apk add --no-cache curl jq bash
  script:
    - |
      echo "🔍 检查 OpenSpec 冲突..."

      CURRENT_BRANCH="${CI_MERGE_REQUEST_SOURCE_BRANCH_NAME}"
      TARGET_BRANCH="${CI_MERGE_REQUEST_TARGET_BRANCH_NAME}"

      echo "当前分支: $CURRENT_BRANCH"
      echo "目标分支: $TARGET_BRANCH"

      # 获取所有 open 的 OpenSpec MR
      echo "获取 Active OpenSpec Changes..."

      ACTIVE_MRS=$(curl -s --header "PRIVATE-TOKEN: ${CI_JOB_TOKEN}" \
        "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/merge_requests?state=opened&per_page=100" \
        | jq -r '.[] | select(.labels | contains(["openspec::change"])) | [.iid, .source_branch] | @tsv' \
        || echo "")

      if [ -z "$ACTIVE_MRS" ]; then
        echo -e "✅ 没有发现其他 Active OpenSpec Changes"
        echo "CONFLICT_DETECTED=false" >> build.env
        exit 0
      fi

      echo "发现以下 Active Changes:"
      echo "$ACTIVE_MRS"

      # 检查冲突
      CONFLICT_FOUND=false
      CONFLICT_DETAILS=""

      while IFS=$'\t' read -r mr_iid branch; do
        if [ "$branch" != "$CURRENT_BRANCH" ]; then
          echo ""
          echo "检查与 !${mr_iid} (${branch}) 的冲突..."

          # 获取其他分支的 specs 文件
          git fetch origin "${branch}:${branch}" 2>/dev/null || {
            echo "  无法获取分支 ${branch}，跳过"
            continue
          }

          # 检查 specs 文件重叠
          CURRENT_SPECS=$(git diff "origin/${TARGET_BRANCH}" --name-only | grep "openspec/changes/" || true)
          OTHER_SPECS=$(git diff "origin/${TARGET_BRANCH}" "${branch}" --name-only | grep "openspec/changes/" || true)

          if [ ! -z "$CURRENT_SPECS" ] && [ ! -z "$OTHER_SPECS" ]; then
            CONFLICTS=$(echo "$CURRENT_SPECS" | grep -F "$OTHER_SPECS" || true)
            if [ ! -z "$CONFLICTS" ]; then
              echo -e "  ⚠️  发现潜在冲突:"
              echo "$CONFLICTS" | sed 's/^/    /'
              CONFLICT_FOUND=true
              CONFLICT_DETAILS="${CONFLICT_DETAILS}\\n- 与 !${mr_iid} (${branch}) 冲突"
            fi
          fi
        fi
      done <<< "$ACTIVE_MRS"

      # 保存结果
      if [ "$CONFLICT_FOUND" = true ]; then
        echo "CONFLICT_DETECTED=true" >> build.env
        echo "CONFLICT_DETAILS=${CONFLICT_DETAILS}" >> build.env
        exit 1
      else
        echo "CONFLICT_DETECTED=false" >> build.env
        echo -e "✅ 未发现冲突"
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

# 添加冲突评论
openspec-comment:
  stage: notify
  image: alpine/curl
  needs:
    - openspec-conflict-check
  allow_failure: true
  script:
    - |
      if [ "$CONFLICT_DETECTED" = "true" ]; then
        echo "添加冲突警告评论..."

        COMMENT="⚠️ **OpenSpec 冲突警告**

此 MR 与其他 Active Changes 存在潜在冲突。

**可能冲突的文件**:
\`\`\`
${CONFLICT_DETAILS}
\`\`\`

**建议操作**:
1. 查看 [OpenSpec Board](${CI_PROJECT_URL}/-/boards)
2. 与相关开发者协调
3. 在 MR 描述中更新协调记录

/cc @${GITLAB_USER_LOGIN}"

        # URL encode the comment
        ENCODED_COMMENT=$(echo "$COMMENT" | jq -sRr @uri)

        curl -X POST --header "PRIVATE-TOKEN: ${CI_JOB_TOKEN}" \
          --data "body=${ENCODED_COMMENT}" \
          "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/merge_requests/${CI_MERGE_REQUEST_IID}/notes"

        # 更新标签
        curl -X PUT --header "PRIVATE-TOKEN: ${CI_JOB_TOKEN}" \
          --data "add_labels=openspec::conflict::warn" \
          "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/merge_requests/${CI_MERGE_REQUEST_IID}"

        echo -e "✅ 已添加冲突警告"
      else
        echo -e "✅ 无冲突，添加无冲突标签"

        curl -X PUT --header "PRIVATE-TOKEN: ${CI_JOB_TOKEN}" \
          --data "add_labels=openspec::conflict::none" \
          "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/merge_requests/${CI_MERGE_REQUEST_IID}"
      fi
  only:
    - merge_requests

# OpenSpec 归档检查
openspec-archive-check:
  stage: openspec-check
  image: alpine/git
  script:
    - |
      echo "检查 OpenSpec 归档条件..."

      # 检查是否完成所有 tasks
      CHANGE_DIR="openspec/changes/${CI_MERGE_REQUEST_SOURCE_BRANCH_NAME}"

      if [ -f "${CHANGE_DIR}/tasks.md" ]; then
        # 统计未完成的任务
        INCOMPLETE=$(grep -c "\- \[ \]" "${CHANGE_DIR}/tasks.md" || echo "0")

        if [ "$INCOMPLETE" -gt 0 ]; then
          echo -e "⚠️  还有 ${INCOMPLETE} 个任务未完成"
          echo "请完成所有任务后再合并"
          exit 1
        fi
      fi

      echo -e "✅ OpenSpec 检查通过"
  only:
    - merge_requests
```

---

## 3. Swagger 同步脚本

### 文件：`scripts/sync-swagger.sh`

```bash
#!/bin/bash
# Swagger 自动同步脚本
# 在服务仓库的 CI 中使用

set -e

SERVICE_NAME="${1:-}"  # 服务名作为参数
REGISTRY_URL="${2:-https://gitlab.com/your-org/swagger-registry.git}"

if [ -z "$SERVICE_NAME" ]; then
    echo "❌ 错误: 请提供服务名"
    echo "用法: $0 <service-name> [registry-url]"
    exit 1
fi

echo "🔄 同步 Swagger 到 Registry"
echo "服务: $SERVICE_NAME"
echo "Registry: $REGISTRY_URL"

# 读取版本信息
if [ -f "openspec/changes/$CI_COMMIT_BRANCH/.openspec.yaml" ]; then
    VERSION=$(cat "openspec/changes/$CI_COMMIT_BRANCH/.openspec.yaml" | grep "version:" | awk '{print $2}' || echo "")

    if [ -z "$VERSION" ]; then
        echo "❌ 错误: 无法读取版本号"
        exit 1
    fi

    echo "版本: $VERSION"
else
    echo "ℹ️  无 OpenSpec 配置，跳过同步"
    exit 0
fi

# 检查 swagger.yaml 是否存在
if [ ! -f "swagger.yaml" ] && [ ! -f "openapi.yaml" ]; then
    echo "❌ 错误: 未找到 swagger.yaml 或 openapi.yaml"
    exit 1
fi

SWAGGER_FILE="swagger.yaml"
if [ -f "openapi.yaml" ]; then
    SWAGGER_FILE="openapi.yaml"
fi

echo "Swagger 文件: $SWAGGER_FILE"

# 克隆 registry
echo "克隆 Registry..."
git clone --depth 1 "$REGISTRY_URL" /tmp/registry || {
    echo "❌ 克隆 Registry 失败"
    exit 1
}

# 创建目录结构
mkdir -p "/tmp/registry/services/${SERVICE_NAME}/versions"

# 复制文件
echo "复制 Swagger 文件..."
cp "$SWAGGER_FILE" "/tmp/registry/services/${SERVICE_NAME}/openapi.yaml"
cp "$SWAGGER_FILE" "/tmp/registry/services/${SERVICE_NAME}/versions/${VERSION}.yaml"

# 更新 registry.yaml
echo "更新 Registry 索引..."
cd /tmp/registry

if [ -f "registry.yaml" ]; then
    # 使用 yq 或其他工具更新 YAML
    # 这里使用简单的 sed 作为示例
    if grep -q "${SERVICE_NAME}:" registry.yaml; then
        # 更新现有服务
        sed -i "s/\(${SERVICE_NAME}:.*current_version:\).*/\1 ${VERSION}/" registry.yaml

        # 添加新版本（如果不存在）
        if ! grep -q "${VERSION}" registry.yaml; then
            sed -i "/${SERVICE_NAME}:.*versions:/a\      - ${VERSION}" registry.yaml
        fi
    else
        # 添加新服务
        cat >> registry.yaml << EOF

  ${SERVICE_NAME}:
    name: ${SERVICE_NAME}
    current_version: ${VERSION}
    versions:
      - ${VERSION}
    openapi: services/${SERVICE_NAME}/openapi.yaml
EOF
    fi
fi

# 提交更改
echo "提交更改..."
git config user.email "ci@example.com"
git config user.name "GitLab CI"
git add .

git diff --cached --quiet || {
    git commit -m "chore: update ${SERVICE_NAME} API to ${VERSION}

From MR: ${CI_MERGE_REQUEST_TITLE:-N/A}
Branch: ${CI_COMMIT_BRANCH}
Commit: ${CI_COMMIT_SHORT_SHA}"

    git push origin HEAD:main
    echo "✅ 同步成功！"
}
```

---

## 4. MR 模板文件

### 文件：`.gitlab/merge_request_templates/openspec_change.md`

```markdown
## OpenSpec 变更

<!-- 此模板用于 OpenSpec 工作流的标准化变更 -->

### 基本信息

- **变更名称**: %{source_branch}
- **创建人**: @%{author}
- **创建时间**: <!-- 自动填充 -->

### 变更范围

<!-- 勾选涉及的模块 -->

- [ ] 后端 API 变更
- [ ] 前端界面变更
- [ ] 数据库 Schema 变更
- [ ] 配置文件变更
- [ ] 文档更新

**影响的服务/模块**:

<!-- 列出受影响的服务或模块 -->

### 规格文档

<!-- 列出此变更涉及的规格文件 -->

- `openspec/changes/%{source_branch}/proposal.md`
- `openspec/changes/%{source_branch}/design.md`
- `openspec/changes/%{source_branch}/specs/`

### API 变更（如适用）

- **服务**: <!-- 哪个服务 -->
- **版本**: <!-- 新版本号 -->
- **变更类型**: <!-- breaking / feature / fix -->
- [ ] 已更新 Swagger 文档
- [ ] 已检查向后兼容性

### 冲突检查

<!-- CI 会自动更新此部分 -->

- [ ] 已查看 [OpenSpec Board](${CI_PROJECT_URL}/-/boards) 确认无冲突
- [ ] 已检查与其他 Active Changes 的依赖关系
- [ ] 已通知相关团队（如适用）

**冲突状态**: <!-- CI 自动更新：无冲突/潜在冲突/冲突阻塞 -->

### 协调记录

<!-- 如有冲突，在此记录协调过程和结果 -->

**相关 MR**:

<!-- 列出相关的其他 MR -->

**协调人**:

<!-- @ 协调此冲突的开发者 -->

**解决方案**:

<!-- 描述如何解决冲突 -->

### 检查清单

- [ ] 规格文档已更新
- [ ] 代码实现符合规格
- [ ] 单元测试已添加
- [ ] Swagger 文档已同步（如适用）
- [ ] 冲突已解决（如有）

---

<!-- 自动化标签 -->

/label ~openspec::change ~openspec::status::active
```

---

## 安装指南

### 快速安装

```bash
# 1. 创建目录结构
mkdir -p scripts
mkdir -p .gitlab/merge_request_templates

# 2. 复制脚本文件
# 将上述脚本内容保存到对应文件

# 3. 添加执行权限
chmod +x scripts/*.sh

# 4. 提交到仓库
git add scripts/ .gitlab/
git commit -m "chore: add OpenSpec team collaboration scripts"
git push

# 5. 验证
./scripts/openspec-check.sh
```

### 配置检查清单

- [ ] `scripts/openspec-check.sh` 可执行
- [ ] `.gitlab-ci.yml` 包含 openspec-\* jobs
- [ ] `.gitlab/merge_request_templates/openspec_change.md` 存在
- [ ] GitLab Labels 已创建
- [ ] Board 已配置

---

## 使用示例

### 日常开发流程

```bash
# 1. 开始新变更
git checkout -b feature/openspec-add-auth

# 2. 本地检查
./scripts/openspec-check.sh

# 3. 开发完成后再次检查
./scripts/openspec-check.sh

# 4. 提交并推送
git add .
git commit -m "[openspec] 添加用户认证功能"
git push origin feature/openspec-add-auth

# 5. 创建 MR（自动使用模板）
glab mr create --label="openspec::change"
```

---

## 检查清单

完成本章后，确认以下配置：

- [ ] `scripts/openspec-check.sh` 已创建并可执行
- [ ] `.gitlab-ci.yml` 包含 `openspec-conflict-check` job
- [ ] `.gitlab/merge_request_templates/openspec_change.md` 已创建
- [ ] GitLab Labels 已创建（7 个）
- [ ] Board 视图已创建
- [ ] 本地运行 `./scripts/openspec-check.sh` 成功
- [ ] CI 流水线正常触发

---

**遇到问题？** 查看 [08 - 常见问题 FAQ](08-faq.md) 或 [05 - 实施路线图](05-roadmap.md) 了解如何逐步推广。
