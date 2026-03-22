# OpenExp CLI 设计方案

> 统一入口、确定性格式、Git 版本控制

## 设计原则

1. **单一入口**：一个脚本处理所有操作
2. **确定输出**：机器可读的格式，便于 AI 解析
3. **最小依赖**：仅依赖 bash + git + obsidian CLI
4. **人类可读**：输出同时便于人类查看

---

## 命令结构

```bash
openexp <命令> [参数]
```

### 核心命令

| 命令 | 说明 | AI 使用频率 |
|------|------|------------|
| `search <query>` | 搜索经验 | ⭐⭐⭐⭐⭐ |
| `add <type> <content>` | 添加经验 | ⭐⭐⭐⭐⭐ |
| `bump <id>` | 使用计数 +1 | ⭐⭐⭐⭐ |
| `feedback <id> <vote>` | 反馈（useful/useless） | ⭐⭐⭐ |
| `get <id>` | 获取经验详情 | ⭐⭐⭐ |
| `update <id> <content>` | 更新内容 | ⭐⭐⭐ |
| `delete <id>` | 删除经验 | ⭐⭐ |

### 维护命令

| 命令 | 说明 | 使用频率 |
|------|------|----------|
| `status` | 查看状态 | ⭐⭐⭐ |
| `list [type]` | 列出经验 | ⭐⭐ |
| `stats` | 统计信息 | ⭐⭐ |
| `snapshot [msg]` | 创建快照 | ⭐ |
| `snapshots` | 列出快照 | ⭐ |

---

## 输出格式

### 成功响应

```
OK: <操作描述>
<数据>
---
```

### 错误响应

```
ERROR: <错误描述>
<详情>
---
```

### 搜索结果

```
FOUND: <数量> results
---
[<序号>] <id>
    type: <类型>
    content: <内容摘要>
    tags: [<标签>]
    impact: <影响力分数>
---
```

### 状态响应

```
EXPERIENCE_VAULT: <vault路径>
TOTAL: <总数>
BY_TYPE:
  preference: <数量>
  solution: <数量>
  workflow: <数量>
  knowledge: <数量>
  convention: <数量>
  experience: <数量>
TOP_IMPACT: <最高影响力id> (<分数>)
LAST_SNAPSHOT: <最后快照>
UNCOMMITTED: <未提交变更数>
---
```

---

## 经验类型

| 类型 | 目录 | 说明 |
|------|------|------|
| `preference` | Preferences/ | 用户偏好 |
| `solution` | Solutions/ | 问题解决方案 |
| `workflow` | Workflows/ | 工作流程 |
| `knowledge` | Knowledge/ | 技术知识 |
| `convention` | Conventions/ | 规范约定 |
| `experience` | Experience/ | 完整经验 |

---

## 文件命名

```
exp_<type>_<YYYYMMDD>_<HHMMSS>_<序号>.md
```

示例：
- `exp_preference_20260322_143052_001.md`
- `exp_solution_20260322_143100_001.md`

---

## Frontmatter 结构

```yaml
---
id: exp_preference_20260322_143052_001
type: preference
tags: [preference, package-manager]
created: 2026-03-22T14:30:52+08:00
updated: 2026-03-22T14:30:52+08:00
usage_count: 0
confidence: 0.8
impact_score: 0
---
```

---

## 脚本实现

```bash
#!/bin/bash
##############################################################################
# OpenExp CLI - 经验库统一管理工具
# 
# 用法: openexp <命令> [参数]
# 
# 环境变量:
#   OPENEXP_VAULT    - Vault 路径 (默认: ~/Exp Vault)
#   OPENEXP_SILENT   - 静默模式 (true/false)
##############################################################################

set -e

# ============== 配置 ==============
VAULT_PATH="${OPENEXP_VAULT:-$(find ~ -name "Exp Vault" -type d 2>/dev/null | head -1)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 经验类型映射
declare -A TYPE_DIRS=(
    ["preference"]="Preferences"
    ["solution"]="Solutions"
    ["workflow"]="Workflows"
    ["knowledge"]="Knowledge"
    ["convention"]="Conventions"
    ["experience"]="Experience"
)

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============== 工具函数 ==============

log() {
    [[ "$OPENEXP_SILENT" == "true" ]] && return
    echo -e "$@"
}

error() {
    echo -e "${RED}ERROR:${NC} $1" >&2
    exit 1
}

ok() {
    echo -e "${GREEN}OK:${NC} $1"
}

info() {
    echo -e "${BLUE}INFO:${NC} $1"
}

# 检查 Vault
check_vault() {
    [[ -z "$VAULT_PATH" ]] && error "找不到 Exp Vault"
    [[ ! -d "$VAULT_PATH" ]] && error "Vault 不存在: $VAULT_PATH"
}

# 初始化 Vault
init_vault() {
    check_vault
    
    # 确保目录存在
    for dir in "${TYPE_DIRS[@]}"; do
        mkdir -p "$VAULT_PATH/$dir"
    done
    
    # 初始化 Git
    if [[ ! -d "$VAULT_PATH/.git" ]]; then
        cd "$VAULT_PATH"
        git init -q
        git add -A
        git commit -q -m "Initialize experience vault"
    fi
}

# 生成 ID
generate_id() {
    local type="$1"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local seq=$(printf "%03d" $((RANDOM % 1000)))
    echo "exp_${type}_${timestamp}_${seq}"
}

# 生成 frontmatter
generate_frontmatter() {
    local id="$1"
    local type="$2"
    local tags="${3:-}"
    local confidence="${4:-0.8}"
    
    cat << EOF
---
id: $id
type: $type
tags: [$tags]
created: $(date +%Y-%m-%dT%H:%M:%S%z)
updated: $(date +%Y-%m-%dT%H:%M:%S%z)
usage_count: 0
confidence: $confidence
impact_score: 0
---
EOF
}

# 提取 frontmatter 字段
get_field() {
    local file="$1"
    local field="$2"
    grep -m1 "^${field}:" "$file" | sed 's/^[^:]*: *//' | tr -d ' '
}

# ============== 命令实现 ==============

cmd_search() {
    check_vault
    
    local query="$1"
    [[ -z "$query" ]] && error "请提供搜索关键词"
    
    log "${BLUE}FOUND:${NC} searching in $VAULT_PATH..."
    
    local results=()
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        
        local id=$(basename "$file" .md)
        local type=$(get_field "$file" "type")
        local tags=$(get_field "$file" "tags")
        local impact=$(get_field "$file" "impact_score")
        
        # 获取内容摘要（前 100 字符）
        local content=$(sed '1,/^---$/d' "$file" | head -c 200 | tr '\n' ' ' | sed 's/  */ /g')
        
        results+=("$file|$id|$type|$tags|$impact|$content")
    done < <(grep -r -l "$query" "$VAULT_PATH" --include="*.md" 2>/dev/null | head -20)
    
    local count=${#results[@]}
    echo ""
    echo "FOUND: $count results"
    echo "---"
    
    for i in "${!results[@]}"; do
        local IFS='|'
        read -ra parts <<< "${results[$i]}"
        echo "[$((i+1))] ${parts[1]}"
        echo "    type: ${parts[2]}"
        echo "    tags: ${parts[3]}"
        echo "    impact: ${parts[4]}"
        echo "    content: ${parts[5]:0:150}..."
        echo ""
    done
    echo "---"
}

cmd_add() {
    check_vault
    
    local type="$1"
    local content="$2"
    
    [[ -z "$type" ]] && error "请指定类型 (preference/solution/workflow/knowledge/convention/experience)"
    [[ -z "$content" ]] && error "请提供内容"
    [[ -z "${TYPE_DIRS[$type]}" ]] && error "未知类型: $type"
    
    local dir="${TYPE_DIRS[$type]}"
    local id=$(generate_id "$type")
    local filepath="$VAULT_PATH/$dir/${id}.md"
    
    # 生成内容
    {
        generate_frontmatter "$id" "$type" ""
        echo ""
        echo "# ${id}"
        echo ""
        echo "$content"
    } > "$filepath"
    
    # Git 提交
    cd "$VAULT_PATH"
    git add "$filepath" 2>/dev/null || true
    
    ok "已创建: $id"
    echo "PATH: $filepath"
}

cmd_bump() {
    check_vault
    
    local id="$1"
    [[ -z "$id" ]] && error "请指定经验 ID"
    
    # 查找文件
    local file=$(find "$VAULT_PATH" -name "${id}.md" 2>/dev/null | head -1)
    [[ -z "$file" ]] && error "找不到: $id"
    
    # 更新 usage_count
    local count=$(get_field "$file" "usage_count")
    count=$((count + 1))
    
    # 更新 frontmatter
    sed -i.bak "s/^usage_count:.*/usage_count: $count/" "$file"
    sed -i "s/^updated:.*/updated: $(date +%Y-%m-%dT%H:%M:%S%z)/" "$file"
    rm -f "${file}.bak"
    
    # Git 提交
    cd "$VAULT_PATH"
    git add "$file" 2>/dev/null || true
    
    ok "已更新: $id (usage_count: $count)"
}

cmd_feedback() {
    check_vault
    
    local id="$1"
    local vote="$2"
    
    [[ -z "$id" ]] && error "请指定经验 ID"
    [[ -z "$vote" ]] && error "请指定反馈 (useful/useless)"
    
    # 查找文件
    local file=$(find "$VAULT_PATH" -name "${id}.md" 2>/dev/null | head -1)
    [[ -z "$file" ]] && error "找不到: $id"
    
    # 更新 confidence
    local current=$(get_field "$file" "confidence")
    local new_conf
    case "$vote" in
        useful)   new_conf=$(echo "scale=2; $current + 0.1" | bc | sed 's/^\./0./') ;;
        useless)  new_conf=$(echo "scale=2; $current - 0.1" | bc | sed 's/^\./0./') ;;
        *) error "未知反馈: $vote (可用: useful/useless)" ;;
    esac
    
    # 限制范围
    new_conf=$(echo "$new_conf" | awk '{if($1>1)print 1; else if($1<0)print 0; else print $1}')
    
    # 更新
    sed -i.bak "s/^confidence:.*/confidence: $new_conf/" "$file"
    sed -i "s/^updated:.*/updated: $(date +%Y-%m-%dT%H:%M:%S%z)/" "$file"
    rm -f "${file}.bak"
    
    cd "$VAULT_PATH"
    git add "$file" 2>/dev/null || true
    
    ok "已更新: $id (confidence: $new_conf)"
}

cmd_get() {
    check_vault
    
    local id="$1"
    [[ -z "$id" ]] && error "请指定经验 ID"
    
    local file=$(find "$VAULT_PATH" -name "${id}.md" 2>/dev/null | head -1)
    [[ -z "$file" ]] && error "找不到: $id"
    
    cat "$file"
}

cmd_status() {
    check_vault
    
    local total=0
    declare -A counts
    
    for type in "${!TYPE_DIRS[@]}"; do
        local dir="${TYPE_DIRS[$type]}"
        local count=$(find "$VAULT_PATH/$dir" -name "exp_*.md" 2>/dev/null | wc -l)
        counts[$type]=$count
        total=$((total + count))
    done
    
    # 最近快照
    local last_snapshot=$(cd "$VAULT_PATH" && git tag -l "snapshot_*" 2>/dev/null | tail -1)
    [[ -z "$last_snapshot" ]] && last_snapshot="none"
    
    # 未提交变更
    local uncommitted=$(cd "$VAULT_PATH" && git status -s 2>/dev/null | wc -l)
    
    # 最高影响力
    local top_impact=$(find "$VAULT_PATH" -name "exp_*.md" -exec grep -h "impact_score:" {} \; 2>/dev/null | sort -t: -k2 -rn | head -1 | sed 's/impact_score: //')
    [[ -z "$top_impact" ]] && top_impact="0"
    
    echo ""
    echo "EXPERIENCE_VAULT: $VAULT_PATH"
    echo "TOTAL: $total"
    echo "BY_TYPE:"
    for type in preference solution workflow knowledge convention experience; do
        echo "  $type: ${counts[$type]:-0}"
    done
    echo "TOP_IMPACT: $top_impact"
    echo "LAST_SNAPSHOT: $last_snapshot"
    echo "UNCOMMITTED: $uncommitted"
    echo "---"
}

cmd_list() {
    check_vault
    
    local type="$1"
    
    echo ""
    if [[ -n "$type" ]]; then
        [[ -z "${TYPE_DIRS[$type]}" ]] && error "未知类型: $type"
        local dir="${TYPE_DIRS[$type]}"
        find "$VAULT_PATH/$dir" -name "exp_*.md" -printf "%f\n" 2>/dev/null | sort
    else
        for type in "${!TYPE_DIRS[@]}"; do
            local dir="${TYPE_DIRS[$type]}"
            echo "=== $type ==="
            find "$VAULT_PATH/$dir" -name "exp_*.md" -printf "%f\n" 2>/dev/null | sort
            echo ""
        done
    fi
}

cmd_snapshot() {
    check_vault
    
    local msg="${1:-auto snapshot}"
    local tag="snapshot_$(date +%Y%m%d_%H%M%S)"
    
    cd "$VAULT_PATH"
    git add -A
    git commit -q -m "🧠 $msg"
    git tag "$tag" 2>/dev/null || true
    
    ok "快照已创建: $tag"
}

cmd_snapshots() {
    check_vault
    
    cd "$VAULT_PATH"
    echo ""
    echo "SNAPSHOTS:"
    git tag -l "snapshot_*" --format='  %(refname:short) (%(creatordate:short))' 2>/dev/null
    echo "---"
}

cmd_git() {
    check_vault
    cd "$VAULT_PATH"
    shift
    git "$@"
}

# ============== 帮助 ==============

show_help() {
    cat << EOF
OpenExp CLI - 经验库统一管理工具

用法: openexp <命令> [参数]

核心命令:
  search <query>        搜索经验
  add <type> <content> 添加经验
  bump <id>            使用计数 +1
  feedback <id> <vote> 反馈 (useful/useless)
  get <id>             获取经验详情
  update <id> <content> 更新内容
  delete <id>          删除经验

维护命令:
  status               查看状态
  list [type]          列出经验
  snapshot [msg]       创建快照
  snapshots            列出快照

类型: preference | solution | workflow | knowledge | convention | experience

示例:
  openexp search "pnpm"
  openexp add preference "用户偏好使用 pnpm"
  openexp bump exp_preference_20260322_143052_001
  openexp feedback exp_preference_20260322_143052_001 useful
  openexp status
  openexp snapshot "添加新经验"

环境变量:
  OPENEXP_VAULT    Vault 路径
  OPENEXP_SILENT   静默模式
EOF
}

# ============== 主入口 ==============

main() {
    [[ $# -eq 0 ]] && { show_help; exit 0; }
    
    case "$1" in
        -h|--help) show_help; exit 0 ;;
        search)    shift; cmd_search "$@" ;;
        add)       shift; cmd_add "$@" ;;
        bump)      shift; cmd_bump "$@" ;;
        feedback)  shift; cmd_feedback "$@" ;;
        get)       shift; cmd_get "$@" ;;
        update)    shift; cmd_update "$@" ;;
        delete)    shift; cmd_delete "$@" ;;
        status)    cmd_status ;;
        list)      shift; cmd_list "$@" ;;
        snapshot)  shift; cmd_snapshot "$@" ;;
        snapshots) cmd_snapshots ;;
        git)       shift; cmd_git "$@" ;;
        *)         error "未知命令: $1"; show_help; exit 1 ;;
    esac
}

main "$@"
```

---

## 集成到 SKILL.md

更新触发条件：

```markdown
## AI 操作命令

使用统一的 openexp CLI：

```bash
# 查找脚本
OPENEXP_CLI=$(find . -name "openexp.sh" -path "*/skills/openexp/*" 2>/dev/null | head -1)

# 1. 任务开始时搜索相关经验
$OPENEXP_CLI search "<任务关键词>"

# 2. 记录新经验
$OPENEXP_CLI add <type> "<内容>"

# 3. 使用后更新计数
$OPENEXP_CLI bump <id>

# 4. 用户反馈
$OPENEXP_CLI feedback <id> useful/useless

# 5. 查看状态
$OPENEXP_CLI status
```
```

---

## 实施计划

### Phase 1: 核心 CLI（0.5天）
- [ ] 创建 `scripts/openexp.sh`
- [ ] 实现 search/add/bump/feedback 命令
- [ ] 测试基本功能

### Phase 2: Git 集成（0.5天）
- [ ] 添加 snapshot/snapshots 命令
- [ ] 自动 Git 提交

### Phase 3: 文档（0.5天）
- [ ] 更新 SKILL.md
- [ ] 更新触发条件

