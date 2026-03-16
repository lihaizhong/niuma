#!/bin/bash

##############################################################################
# Obsidian CLI Wrapper
# 用于简化 obsidian 命令的调用，提供更友好的接口
##############################################################################

set -e

# 默认 Vault 名称
DEFAULT_VAULT_NAME="${DEFAULT_VAULT_NAME:-Exp Vault}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

##############################################################################
# 工具函数
##############################################################################

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

check_obsidian_cli() {
    if ! command -v obsidian &> /dev/null; then
        error "obsidian 未安装"
        echo "请按照以下步骤安装："
        echo "1. 打开 Obsidian 桌面应用"
        echo "2. 进入 设置 → 帮助 → Obsidian CLI"
        echo "3. 按照说明安装 CLI"
        exit 1
    fi
}

##############################################################################
# Obsidian CLI 命令封装
##############################################################################

read_note() {
    local vault_name="$1"
    local note_path="$2"
    obsidian read path="$note_path" vault="$vault_name"
}

create_note() {
    local vault_name="$1"
    local note_path="$2"
    local content="$3"
    local mode="${4:-create}"

    case "$mode" in
        "create")
            if [[ -n "$content" ]]; then
                obsidian create path="$note_path" vault="$vault_name" content="$content"
            else
                obsidian create path="$note_path" vault="$vault_name"
            fi
            ;;
        "append")
            obsidian append path="$note_path" vault="$vault_name" content="$content"
            ;;
        "overwrite")
            obsidian create path="$note_path" vault="$vault_name" content="$content" overwrite
            ;;
        *)
            error "未知的创建模式: $mode"
            exit 1
            ;;
    esac

    info "已创建笔记: $note_path"
}

update_note() {
    local vault_name="$1"
    local note_path="$2"
    local mode="$3"
    local content="${4:-}"
    local key="${5:-}"
    local value="${6:-}"

    case "$mode" in
        "append")
            obsidian append path="$note_path" vault="$vault_name" content="$content"
            ;;
        "overwrite")
            obsidian create path="$note_path" vault="$vault_name" content="$content" overwrite
            ;;
        "frontmatter-edit")
            if [[ -z "$key" || -z "$value" ]]; then
                error "编辑 properties 需要指定 key 和 value"
                exit 1
            fi
            obsidian property:set name="$key" value="$value" path="$note_path" vault="$vault_name"
            ;;
        "frontmatter-delete")
            if [[ -z "$key" ]]; then
                error "删除 properties 需要指定 key"
                exit 1
            fi
            obsidian property:remove name="$key" path="$note_path" vault="$vault_name"
            ;;
        "frontmatter-print")
            obsidian properties path="$note_path" vault="$vault_name"
            return
            ;;
        *)
            error "未知的更新模式: $mode"
            exit 1
            ;;
    esac

    info "已更新笔记: $note_path (模式: $mode)"
}

delete_note() {
    local vault_name="$1"
    local note_path="$2"
    local confirm="$3"

    if [[ "$confirm" != "$note_path" ]]; then
        error "确认路径不匹配，删除已取消"
        exit 1
    fi

    obsidian delete path="$note_path" vault="$vault_name"
    info "已删除笔记: $note_path"
}

list_notes() {
    local vault_name="$1"
    local directory="${2:-}"

    if [[ -n "$directory" ]]; then
        obsidian files folder="$directory" vault="$vault_name"
    else
        obsidian files vault="$vault_name"
    fi
}

search_notes() {
    local vault_name="$1"
    local query="$2"
    local mode="${3:-content}"

    case "$mode" in
        "content"| "fuzzy")
            obsidian search query="$query" vault="$vault_name"
            ;;
        *)
            error "未知的搜索模式: $mode"
            exit 1
            ;;
    esac
}

get_frontmatter() {
    local vault_name="$1"
    local note_path="$2"
    obsidian properties path="$note_path" vault="$vault_name"
}

open_note() {
    local vault_name="$1"
    local note_path="$2"
    obsidian open path="$note_path" vault="$vault_name"
}

move_note() {
    local vault_name="$1"
    local old_path="$2"
    local new_path="$3"
    obsidian move path="$old_path" to="$new_path" vault="$vault_name"
    info "已移动笔记: $old_path → $new_path"
}

daily_note() {
    local vault_name="$1"
    local date="${2:-}"
    if [[ -n "$date" ]]; then
        obsidian create path="Daily Notes/$date.md" vault="$vault_name"
    else
        local today
        today=$(date +"%Y-%m-%d")
        obsidian create path="Daily Notes/$today.md" vault="$vault_name"
    fi
}

get_version() {
    check_obsidian_cli
    obsidian version
}

is_available() {
    check_obsidian_cli > /dev/null 2>&1
    return $?
}

get_default_vault() {
    check_obsidian_cli
    obsidian vaults verbose
}

set_default_vault() {
    local vault_name="$1"
    info "提示: 使用 vault=\"$vault_name\" 参数来指定 Vault"
}

##############################################################################
# 主函数
##############################################################################

main() {
    local vault_name="$DEFAULT_VAULT_NAME"
    local command=""

    while [[ $# -gt 0 ]]; do
        case $1 in
            --vault|-v)
                vault_name="$2"
                shift 2
                ;;
            --help|-h)
                echo "用法: $0 [选项] <命令> [参数]"
                echo ""
                echo "选项:"
                echo "  --vault, -v <name>  指定 Vault 名称 (默认: $DEFAULT_VAULT_NAME)"
                echo "  --help, -h          显示此帮助信息"
                echo ""
                echo "命令: read, create, update, delete, list, search, frontmatter, open, move, daily, default, set-default, version, check"
                echo ""
                echo "使用 $0 --help 查看详细帮助"
                exit 0
                ;;
            read|create|update|delete|list|search|frontmatter|open|move|daily|default|set-default|version|check)
                command="$1"
                shift
                break
                ;;
            *)
                error "未知参数: $1"
                exit 1
                ;;
        esac
    done

    case "$command" in
        read)
            if [[ $# -lt 1 ]]; then error "缺少笔记路径"; exit 1; fi
            read_note "$vault_name" "$1"
            ;;
        create)
            if [[ $# -lt 1 ]]; then error "缺少笔记路径"; exit 1; fi
            create_note "$vault_name" "$1" "${2:-}" "${3:-create}"
            ;;
        update)
            if [[ $# -lt 2 ]]; then error "缺少笔记路径或更新模式"; exit 1; fi
            update_note "$vault_name" "$1" "$2" "${3:-}" "${4:-}" "${5:-}"
            ;;
        delete)
            if [[ $# -lt 2 ]]; then error "缺少笔记路径或确认路径"; exit 1; fi
            delete_note "$vault_name" "$1" "$2"
            ;;
        list)
            list_notes "$vault_name" "${1:-}"
            ;;
        search)
            if [[ $# -lt 1 ]]; then error "缺少搜索查询"; exit 1; fi
            search_notes "$vault_name" "$1" "${2:-content}"
            ;;
        frontmatter)
            if [[ $# -lt 2 ]]; then error "缺少笔记路径或操作模式"; exit 1; fi
            case "$2" in
                print)
                    get_frontmatter "$vault_name" "$1"
                    ;;
                edit|delete)
                    if [[ $# -lt 4 ]]; then error "编辑或删除 frontmatter 需要指定 key"; exit 1; fi
                    update_note "$vault_name" "$1" "frontmatter-$2" "" "$3" "$4"
                    ;;
                *)
                    error "未知的 frontmatter 操作: $2"
                    exit 1
                    ;;
            esac
            ;;
        open)
            if [[ $# -lt 1 ]]; then error "缺少笔记路径"; exit 1; fi
            open_note "$vault_name" "$1"
            ;;
        move)
            if [[ $# -lt 2 ]]; then error "缺少源路径和目标路径"; exit 1; fi
            move_note "$vault_name" "$1" "$2"
            ;;
        daily)
            daily_note "$vault_name" "${1:-}"
            ;;
        default)
            get_default_vault
            ;;
        set-default)
            if [[ $# -lt 1 ]]; then error "缺少 Vault 名称"; exit 1; fi
            set_default_vault "$1"
            ;;
        version)
            get_version
            ;;
        check)
            if is_available; then
                echo "✓ obsidian 可用"
                exit 0
            else
                echo "✗ obsidian 不可用"
                exit 1
            fi
            ;;
        *)
            error "未指定命令"
            echo "使用 --help 查看帮助信息"
            exit 1
            ;;
    esac
}

main "$@"