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

# 打印信息
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# 打印警告
warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 打印错误
error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# 检查 obsidian 是否可用
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

# 读取笔记
read_note() {
    local vault_name="$1"
    local note_path="$2"

    obsidian read path="$note_path" vault="$vault_name"
}

# 创建笔记
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

# 更新笔记
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

# 删除笔记
delete_note() {
    local vault_name="$1"
    local note_path="$2"
    local confirm="$3"

    # 确认删除
    if [[ "$confirm" != "$note_path" ]]; then
        error "确认路径不匹配，删除已取消"
        exit 1
    fi

    obsidian delete path="$note_path" vault="$vault_name"
    info "已删除笔记: $note_path"
}

# 列出笔记
list_notes() {
    local vault_name="$1"
    local directory="${2:-}"

    if [[ -n "$directory" ]]; then
        obsidian files folder="$directory" vault="$vault_name"
    else
        obsidian files vault="$vault_name"
    fi
}

# 搜索笔记
search_notes() {
    local vault_name="$1"
    local query="$2"
    local mode="${3:-content}"

    case "$mode" in
        "content")
            obsidian search query="$query" vault="$vault_name"
            ;;
        "fuzzy")
            obsidian search query="$query" vault="$vault_name"
            ;;
        *)
            error "未知的搜索模式: $mode"
            exit 1
            ;;
    esac
}

# 获取 properties (frontmatter)
get_frontmatter() {
    local vault_name="$1"
    local note_path="$2"

    obsidian properties path="$note_path" vault="$vault_name"
}

# 打开笔记
open_note() {
    local vault_name="$1"
    local note_path="$2"

    obsidian open path="$note_path" vault="$vault_name"
}

# 移动笔记
move_note() {
    local vault_name="$1"
    local old_path="$2"
    local new_path="$3"

    obsidian move path="$old_path" to="$new_path" vault="$vault_name"
    info "已移动笔记: $old_path → $new_path"
}

# 创建或打开每日笔记
daily_note() {
    local vault_name="$1"
    local date="${2:-}"

    # Obsidian 新版本没有 daily 命令，使用 create 代替
    if [[ -n "$date" ]]; then
        obsidian create path="Daily Notes/$date.md" vault="$vault_name"
    else
        local today
        today=$(date +"%Y-%m-%d")
        obsidian create path="Daily Notes/$today.md" vault="$vault_name"
    fi
}

# 获取版本
get_version() {
    check_obsidian_cli
    obsidian version
}

# 检查可用性
is_available() {
    check_obsidian_cli > /dev/null 2>&1
    return $?
}

# 获取 vault 列表
get_default_vault() {
    check_obsidian_cli
    obsidian vaults verbose
}

# 设置默认 vault (使用环境变量或配置文件)
set_default_vault() {
    local vault_name="$1"
    # Obsidian 新版本通过 vault 参数指定，不需要设置默认
    info "提示: 使用 vault=\"$vault_name\" 参数来指定 Vault"
}

##############################################################################
# 主函数
##############################################################################

main() {
    local vault_name="$DEFAULT_VAULT_NAME"
    local command=""

    # 解析参数
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
                echo "命令:"
                echo "  read <path>              读取笔记内容"
                echo "  create <path> [content] [mode]  创建笔记"
                echo "  update <path> <mode> [content] [key] [value]  更新笔记"
                echo "  delete <path> <confirm>  删除笔记"
                echo "  list [directory]         列出笔记"
                echo "  search <query> [mode]    搜索笔记"
                echo "  frontmatter <path> <mode> [key] [value]  操作 properties"
                echo "  open <path>              在 Obsidian 中打开笔记"
                echo "  move <old> <new>         移动或重命名笔记"
                echo "  daily [date]             创建每日笔记"
                echo "  default                  获取 Vault 列表"
                echo "  set-default <name>       设置默认 Vault (提示信息)"
                echo "  version                  获取 obsidian 版本"
                echo "  check                    检查 obsidian 是否可用"
                echo ""
                echo "创建模式 (mode):"
                echo "  create                  创建新笔记（默认）"
                echo "  append                  追加到笔记"
                echo "  overwrite               覆盖笔记"
                echo ""
                echo "更新模式 (mode):"
                echo "  append                  追加内容"
                echo "  overwrite               覆盖内容"
                echo "  frontmatter-edit        编辑 properties 键值"
                echo "  frontmatter-delete      删除 properties 键"
                echo "  frontmatter-print       打印 properties"
                echo ""
                echo "搜索模式 (mode):"
                echo "  content                 搜索内容（默认）"
                echo "  fuzzy                   模糊搜索"
                echo ""
                echo "示例:"
                echo "  $0 read Preferences/exp_preference.md"
                echo "  $0 create Preferences/test.md '测试内容'"
                echo "  $0 create Preferences/test.md '新内容' append"
                echo "  $0 update Preferences/test.md append '## 新增内容'"
                echo "  $0 update Preferences/test.md frontmatter-edit 'tags' 'test, updated'"
                echo "  $0 update Preferences/test.md frontmatter-print"
                echo "  $0 delete Preferences/test.md Preferences/test.md"
                echo "  $0 list Preferences"
                echo "  $0 search pnpm content"
                echo "  $0 search pnpm fuzzy"
                echo "  $0 frontmatter Preferences/test.md print"
                echo "  $0 open Preferences/test.md"
                echo "  $0 move old.md new.md"
                echo "  $0 daily"
                echo "  $0 default"
                echo "  $0 set-default 'My Vault'"
                echo "  $0 check"
                echo "  $0 version"
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

    # 执行命令
    case "$command" in
        read)
            if [[ $# -lt 1 ]]; then
                error "缺少笔记路径"
                exit 1
            fi
            read_note "$vault_name" "$1"
            ;;
        create)
            if [[ $# -lt 1 ]]; then
                error "缺少笔记路径"
                exit 1
            fi
            create_note "$vault_name" "$1" "${2:-}" "${3:-create}"
            ;;
        update)
            if [[ $# -lt 2 ]]; then
                error "缺少笔记路径或更新模式"
                exit 1
            fi
            update_note "$vault_name" "$1" "$2" "${3:-}" "${4:-}" "${5:-}"
            ;;
        delete)
            if [[ $# -lt 2 ]]; then
                error "缺少笔记路径或确认路径"
                exit 1
            fi
            delete_note "$vault_name" "$1" "$2"
            ;;
        list)
            list_notes "$vault_name" "${1:-}"
            ;;
        search)
            if [[ $# -lt 1 ]]; then
                error "缺少搜索查询"
                exit 1
            fi
            search_notes "$vault_name" "$1" "${2:-content}"
            ;;
        frontmatter)
            if [[ $# -lt 2 ]]; then
                error "缺少笔记路径或操作模式"
                exit 1
            fi
            case "$2" in
                print)
                    get_frontmatter "$vault_name" "$1"
                    ;;
                edit|delete)
                    if [[ $# -lt 4 ]]; then
                        error "编辑或删除 frontmatter 需要指定 key"
                        exit 1
                    fi
                    update_note "$vault_name" "$1" "frontmatter-$2" "" "$3" "$4"
                    ;;
                *)
                    error "未知的 frontmatter 操作: $2"
                    exit 1
                    ;;
            esac
            ;;
        open)
            if [[ $# -lt 1 ]]; then
                error "缺少笔记路径"
                exit 1
            fi
            open_note "$vault_name" "$1"
            ;;
        move)
            if [[ $# -lt 2 ]]; then
                error "缺少源路径和目标路径"
                exit 1
            fi
            move_note "$vault_name" "$1" "$2"
            ;;
        daily)
            daily_note "$vault_name" "${1:-}"
            ;;
        default)
            get_default_vault
            ;;
        set-default)
            if [[ $# -lt 1 ]]; then
                error "缺少 Vault 名称"
                exit 1
            fi
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

# 执行主函数
main "$@"