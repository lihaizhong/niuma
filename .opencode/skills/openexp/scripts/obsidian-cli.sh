#!/bin/bash

##############################################################################
# Obsidian CLI Wrapper (简化版)
# 本地应用访问速度快，无需超时和重试机制
##############################################################################

set -e

VAULT="${DEFAULT_VAULT_NAME:-Exp Vault}"

# 显示帮助
show_help() {
    cat << EOF
用法: $0 <命令> [参数]

命令:
  read <path>              读取笔记
  create <path> [content]  创建笔记
  update <path> <mode> [args...]  更新笔记 (append/overwrite)
  delete <path>            删除笔记
  list [folder]            列出笔记
  search <query>           搜索笔记
  check                    检查 obsidian 是否可用

示例:
  $0 read Preferences/test.md
  $0 create Solutions/test.md "内容"
  $0 list Preferences
  $0 search "TypeScript"
EOF
}

# 直接执行 obsidian 命令
obs() {
    obsidian "$@" vault="$VAULT"
}

# 主函数
main() {
    [[ $# -eq 0 ]] && { show_help; exit 0; }

    case "$1" in
        -h|--help) show_help; exit 0 ;;
        check)
            command -v obsidian &> /dev/null && echo "✓ obsidian 可用" || echo "✗ obsidian 不可用"
            exit $?
            ;;
        read)
            [[ -z "$2" ]] && { echo "错误: 缺少路径"; exit 1; }
            obs read path="$2"
            ;;
        create)
            [[ -z "$2" ]] && { echo "错误: 缺少路径"; exit 1; }
            obs create path="$2" ${3:+content="$3"}
            ;;
        update)
            [[ -z "$2" || -z "$3" ]] && { echo "错误: 缺少路径或模式"; exit 1; }
            case "$3" in
                append) obs append path="$2" content="$4" ;;
                overwrite) obs create path="$2" content="$4" overwrite ;;
                frontmatter-edit) obs property:set name="$4" value="$5" path="$2" ;;
                *) echo "错误: 未知模式 $3"; exit 1 ;;
            esac
            ;;
        delete)
            [[ -z "$2" ]] && { echo "错误: 缺少路径"; exit 1; }
            obs delete path="$2"
            ;;
        list)
            obs files ${2:+folder="$2"}
            ;;
        search)
            [[ -z "$2" ]] && { echo "错误: 缺少查询"; exit 1; }
            obs search query="$2"
            ;;
        *)
            echo "错误: 未知命令 $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
