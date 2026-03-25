#!/bin/bash
##############################################################################
# OpenExp CLI - 经验库统一管理工具
#
# 用法: openexp <命令> [参数]
#
# 环境变量:
#   OPENEXP_VAULT    Vault 路径 (默认: ~/Exp Vault)
#   OPENEXP_SILENT   静默模式 (true/false)
##############################################################################

set -e

# ============== 配置 ==============
VAULT_PATH="${OPENEXP_VAULT:-$(find ~ -name "Exp Vault" -type d 2>/dev/null | head -1)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 经验类型映射（兼容 macOS）
TYPE_DIRS_PREFERENCE="Preferences"
TYPE_DIRS_SOLUTION="Solutions"
TYPE_DIRS_WORKFLOW="Workflows"
TYPE_DIRS_KNOWLEDGE="Knowledge"
TYPE_DIRS_CONVENTION="Conventions"
TYPE_DIRS_EXPERIENCE="Experience"

# 获取类型目录
get_type_dir() {
    case "$1" in
        preference) echo "Preferences" ;;
        solution) echo "Solutions" ;;
        workflow) echo "Workflows" ;;
        knowledge) echo "Knowledge" ;;
        convention) echo "Conventions" ;;
        experience) echo "Experience" ;;
        *) return 1 ;;
    esac
}

# 验证类型
valid_type() {
    case "$1" in
        preference|solution|workflow|knowledge|convention|experience) return 0 ;;
        *) return 1 ;;
    esac
}

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
    if [[ -z "$VAULT_PATH" ]]; then
        error "找不到 Exp Vault，请设置 OPENEXP_VAULT 环境变量"
    fi
    if [[ ! -d "$VAULT_PATH" ]]; then
        error "Vault 不存在: $VAULT_PATH"
    fi
}

# 初始化 Vault
init_vault() {
    check_vault
    
    for type in preference solution workflow knowledge convention experience; do
        mkdir -p "$VAULT_PATH/$(get_type_dir $type)"
    done
    
    if [[ ! -d "$VAULT_PATH/.git" ]]; then
        cd "$VAULT_PATH"
        git init -q
        git add -A
        git commit -q -m "Initialize experience vault"
        info "已初始化 Git 仓库"
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
    grep -m1 "^${field}:" "$file" 2>/dev/null | sed 's/^[^:]*: *//' | tr -d ' '
}

# ============== 命令实现 ==============

cmd_search() {
    check_vault
    
    local query="$1"
    [[ -z "$query" ]] && error "请提供搜索关键词"
    
    local results=()
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        
        local id=$(basename "$file" .md)
        local type=$(get_field "$file" "type")
        local tags=$(get_field "$file" "tags")
        local impact=$(get_field "$file" "impact_score")
        
        # 获取内容摘要
        local content=$(sed '1,/^---$/d' "$file" 2>/dev/null | grep -v "^#" | tr '\n' ' ' | sed 's/  */ /g' | head -c 200)
        
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
    valid_type "$type" || error "未知类型: $type"
    
    local dir=$(get_type_dir "$type")
    local id=$(generate_id "$type")
    local filepath="$VAULT_PATH/$dir/${id}.md"
    
    mkdir -p "$VAULT_PATH/$dir"
    
    {
        generate_frontmatter "$id" "$type" ""
        echo ""
        echo "# ${id}"
        echo ""
        echo "$content"
    } > "$filepath"
    
    cd "$VAULT_PATH"
    git add "$filepath" 2>/dev/null || true
    
    ok "已创建: $id"
    echo "PATH: $filepath"
}

cmd_bump() {
    check_vault
    
    local id="$1"
    [[ -z "$id" ]] && error "请指定经验 ID"
    
    local file=$(find "$VAULT_PATH" -name "${id}.md" 2>/dev/null | head -1)
    [[ -z "$file" ]] && error "找不到: $id"
    
    local count=$(get_field "$file" "usage_count")
    count=$((count + 1))
    
    sed -i '' "s/^usage_count:.*/usage_count: $count/" "$file"
    sed -i '' "s/^updated:.*/updated: $(date +%Y-%m-%dT%H:%M:%S%z)/" "$file"
    
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
    
    local file=$(find "$VAULT_PATH" -name "${id}.md" 2>/dev/null | head -1)
    [[ -z "$file" ]] && error "找不到: $id"
    
    local current=$(get_field "$file" "confidence")
    
    # 简单的 confidence 更新
    local new_conf
    case "$vote" in
        useful)
            new_conf=$(echo "$current + 0.1" | bc 2>/dev/null || echo "$current + 0.1" | awk '{printf "%.1f", $1}')
            ;;
        useless)
            new_conf=$(echo "$current - 0.1" | bc 2>/dev/null || echo "$current - 0.1" | awk '{printf "%.1f", $1}')
            ;;
        *) error "未知反馈: $vote (可用: useful/useless)" ;;
    esac
    
    # 限制范围 0-1
    new_conf=$(echo "$new_conf" | awk '{if($1>1)print 1; else if($1<0)print 0; else printf "%.1f", $1}')
    
    sed -i '' "s/^confidence:.*/confidence: $new_conf/" "$file"
    sed -i '' "s/^updated:.*/updated: $(date +%Y-%m-%dT%H:%M:%S%z)/" "$file"
    
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

cmd_update() {
    check_vault
    
    local id="$1"
    shift
    local content="$*"
    
    [[ -z "$id" ]] && error "请指定经验 ID"
    [[ -z "$content" ]] && error "请提供内容"
    
    local file=$(find "$VAULT_PATH" -name "${id}.md" 2>/dev/null | head -1)
    [[ -z "$file" ]] && error "找不到: $id"
    
    # 保留 frontmatter，只更新内容
    local frontmatter=$(sed -n '/^---$/,/^---$/p' "$file")
    {
        echo "$frontmatter"
        echo ""
        echo "# ${id}"
        echo ""
        echo "$content"
    } > "$file"
    
    sed -i '' "s/^updated:.*/updated: $(date +%Y-%m-%dT%H:%M:%S%z)/" "$file"
    
    cd "$VAULT_PATH"
    git add "$file" 2>/dev/null || true
    
    ok "已更新: $id"
}

cmd_delete() {
    check_vault
    
    local id="$1"
    [[ -z "$id" ]] && error "请指定经验 ID"
    
    local file=$(find "$VAULT_PATH" -name "${id}.md" 2>/dev/null | head -1)
    [[ -z "$file" ]] && error "找不到: $id"
    
    cd "$VAULT_PATH"
    git rm -f "$file" 2>/dev/null || rm -f "$file"
    
    ok "已删除: $id"
}

cmd_status() {
    check_vault
    
    local total=0
    
    echo ""
    echo "EXPERIENCE_VAULT: $VAULT_PATH"
    echo "BY_TYPE:"
    
    for type in preference solution workflow knowledge convention experience; do
        local dir=$(get_type_dir "$type")
        local count=$(find "$VAULT_PATH/$dir" -name "exp_*.md" 2>/dev/null | wc -l | tr -d ' ')
        echo "  $type: $count"
        total=$((total + count))
    done
    
    echo "TOTAL: $total"
    
    local last_snapshot=$(cd "$VAULT_PATH" && git tag -l "snapshot_*" 2>/dev/null | tail -1)
    [[ -z "$last_snapshot" ]] && last_snapshot="none"
    echo "LAST_SNAPSHOT: $last_snapshot"
    
    local uncommitted=$(cd "$VAULT_PATH" && git status -s 2>/dev/null | wc -l | tr -d ' ')
    echo "UNCOMMITTED: $uncommitted"
    echo "---"
}

cmd_list() {
    check_vault
    
    local type="$1"
    
    echo ""
    if [[ -n "$type" ]]; then
        valid_type "$type" || error "未知类型: $type"
        local dir=$(get_type_dir "$type")
        find "$VAULT_PATH/$dir" -name "exp_*.md" -printf "%f\n" 2>/dev/null | sort
    else
        for type in preference solution workflow knowledge convention experience; do
            local dir=$(get_type_dir "$type")
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
    git tag -l "snapshot_*" --format='  %(refname:short) (%(creatordate:short))' 2>/dev/null || echo "  无快照"
    echo "---"
}

cmd_git() {
    check_vault
    cd "$VAULT_PATH"
    shift
    git "$@"
}

cmd_stats() {
    check_vault
    
    echo ""
    echo "STATS:"
    echo "  总经验数: $(find "$VAULT_PATH" -name "exp_*.md" 2>/dev/null | wc -l | tr -d ' ')"
    echo "  最高影响力: $(find "$VAULT_PATH" -name "exp_*.md" -exec grep -h "impact_score:" {} \; 2>/dev/null | sort -rn | head -1 | sed 's/impact_score: //' || echo "0")"
    echo "  Git 提交数: $(cd "$VAULT_PATH" && git rev-list --count HEAD 2>/dev/null || echo "0")"
    echo "  快照数: $(cd "$VAULT_PATH" && git tag -l "snapshot_*" 2>/dev/null | wc -l | tr -d ' ')"
    echo "---"
}

# ============== 帮助 ==============

show_help() {
    cat << EOF
OpenExp CLI - 经验库统一管理工具

用法: openexp <命令> [参数]

核心命令:
  search <query>         搜索经验
  add <type> <content>   添加经验
  bump <id>             使用计数 +1
  feedback <id> <vote>  反馈 (useful/useless)
  get <id>              获取经验详情
  update <id> <content>  更新内容
  delete <id>           删除经验

维护命令:
  status                查看状态
  list [type]           列出经验
  stats                 统计信息
  snapshot [msg]        创建快照
  snapshots             列出快照

类型: preference | solution | workflow | knowledge | convention | experience

示例:
  openexp search "pnpm"
  openexp add preference "用户偏好使用 pnpm"
  openexp bump exp_preference_xxx
  openexp feedback exp_preference_xxx useful
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
        init)      init_vault ;;
        search)    shift; cmd_search "$@" ;;
        add)       shift; cmd_add "$@" ;;
        bump)      shift; cmd_bump "$@" ;;
        feedback)  shift; cmd_feedback "$@" ;;
        get)       shift; cmd_get "$@" ;;
        update)    shift; cmd_update "$@" ;;
        delete)    shift; cmd_delete "$@" ;;
        status)    cmd_status ;;
        list)      shift; cmd_list "$@" ;;
        stats)     cmd_stats ;;
        snapshot)  shift; cmd_snapshot "$@" ;;
        snapshots) cmd_snapshots ;;
        git)       shift; cmd_git "$@" ;;
        *)         error "未知命令: $1" ;;
    esac
}

main "$@"
