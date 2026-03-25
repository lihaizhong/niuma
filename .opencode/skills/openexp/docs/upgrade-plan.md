# OpenExp 升级方案：版本控制 + 语义搜索

> 基于 Memoria 的 Git for Memory 理念，实现渐进式升级

## 目录结构

```
.opencode/skills/openexp/
├── SKILL.md                    # 主技能定义（升级）
├── VERSION.md                  # 版本记录
├── scripts/
│   ├── obsidian-cli.sh         # 现有 CLI
│   ├── maintain-experience-vault.py  # 现有维护脚本
│   ├── git-manager.sh          # 【新增】Git 版本控制管理器
│   └── semantic-search.sh      # 【新增】本地语义搜索
├── templates/
│   └── *-template.md           # 现有模板
└── reference/
    ├── commands.md            # 现有命令参考
    ├── impact-calculation.md   # 现有影响力计算
    └── git-commands.md         # 【新增】Git 管理命令参考
```

---

## Part 1: Git 版本控制增强

### 1.1 设计理念

参考 Memoria 的 Steering Rules，为经验库引入 **Git 工作流**：

| Memoria 概念 | OpenExp 映射 | 说明 |
|-------------|-------------|------|
| `memory_snapshot` | `git-snapshot` | 创建时间点快照 |
| `memory_branch` | `git-branch` | 创建实验分支 |
| `memory_merge` | `git-merge` | 合并分支 |
| `memory_rollback` | `git-reset` | 回滚到快照 |
| `memory_diff` | `git-diff` | 查看变更差异 |

### 1.2 新增命令

```bash
# 快照操作
$OPENEXP_SCRIPTS/git-manager.sh snapshot [name]     # 创建快照
$OPENEXP_SCRIPTS/git-manager.sh snapshots            # 列出快照
$OPENEXP_SCRIPTS/git-manager.sh rollback <snapshot>  # 回滚到快照

# 分支操作
$OPENEXP_SCRIPTS/git-manager.sh branch <name>       # 创建分支
$OPENEXP_SCRIPTS/git-manager.sh branches            # 列出分支
$OPENEXP_SCRIPTS/git-manager.sh checkout <branch>   # 切换分支
$OPENEXP_SCRIPTS/git-manager.sh merge <branch>      # 合并分支
$OPENEXP_SCRIPTS/git-manager.sh diff [branch]       # 查看差异

# 状态查询
$OPENEXP_SCRIPTS/git-manager.sh status              # 查看状态
$OPENEXP_SCRIPTS/git-manager.sh log [n]            # 查看最近 n 条提交
```

### 1.3 脚本实现：`git-manager.sh`

```bash
#!/bin/bash
##############################################################################
# Git 版本控制管理器
# 封装 Vault 的 Git 操作，提供快照、分支、回滚等高级功能
##############################################################################

set -e

VAULT_PATH="${VAULT_PATH:-$(find ~ -name "Exp Vault" -type d 2>/dev/null | head -1)}"

[[ -z "$VAULT_PATH" ]] && { echo "错误: 找不到 Exp Vault"; exit 1; }
[[ ! -d "$VAULT_PATH/.git" ]] && { echo "错误: Vault 未初始化 Git"; exit 1; }

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 显示帮助
show_help() {
    cat << EOF
用法: $0 <命令> [参数]

Vault: $VAULT_PATH

快照命令:
  snapshot [name]           创建命名快照（等同于 git commit）
  snapshots                列出所有快照（tag 列表）
  rollback <snapshot>      回滚到指定快照

分支命令:
  branch <name>            创建实验分支
  branches                 列出所有分支
  checkout <branch>        切换分支
  merge <branch>           合并分支到当前分支
  delete <branch>          删除分支

变更命令:
  diff [branch]            查看未提交的变更
  status                   查看当前状态
  log [n]                  查看最近 n 条提交（默认 10）

示例:
  $0 snapshot "添加 pnpm 偏好"
  $0 snapshot              # 自动命名：snapshot_YYYYMMDD_HHMMSS
  $0 branches
  $0 branch "test_new_template"
  $0 merge "test_new_template"
  $0 rollback snapshot_20260317
EOF
}

# 确保在 Vault 目录执行
cd "$VAULT_PATH"

case "$1" in
    -h|--help) show_help; exit 0 ;;
    
    snapshot)
        SNAPSHOT_NAME="${2:-snapshot_$(date +%Y%m%d_%H%M%S)}"
        log_info "创建快照: $SNAPSHOT_NAME"
        git add -A
        git commit -m "🧠 $SNAPSHOT_NAME"
        git tag "$SNAPSHOT_NAME"
        log_success "快照已创建: $SNAPSHOT_NAME"
        ;;
        
    snapshots)
        log_info "快照列表:"
        git tag -l "snapshot_*" --format='%(refname:short) (%(creatordate:short)) %(subject)'
        ;;
        
    rollback)
        [[ -z "$2" ]] && { log_error "请指定快照名称"; exit 1; }
        SNAPSHOT="$2"
        git checkout "$SNAPSHOT" -- .
        git checkout "$SNAPSHOT"
        log_success "已回滚到: $SNAPSHOT"
        ;;
        
    branch)
        [[ -z "$2" ]] && { log_error "请指定分支名称"; exit 1; }
        BRANCH="$2"
        log_info "创建分支: $BRANCH"
        git checkout -b "exp/$BRANCH"
        log_success "已切换到分支: exp/$BRANCH"
        ;;
        
    branches)
        log_info "经验分支:"
        git branch -a | grep -v "remotes" | grep "exp/" || echo "  无实验分支"
        log_info "当前分支:"
        echo "  $(git branch --show-current)"
        ;;
        
    checkout)
        [[ -z "$2" ]] && { log_error "请指定分支名称"; exit 1; }
        git checkout "$2"
        log_success "已切换到: $2"
        ;;
        
    merge)
        [[ -z "$2" ]] && { log_error "请指定要合并的分支"; exit 1; }
        git merge "$2" -m "合并经验分支: $2"
        log_success "已合并: $2"
        ;;
        
    delete)
        [[ -z "$2" ]] && { log_error "请指定要删除的分支"; exit 1; }
        git branch -d "$2"
        log_success "已删除分支: $2"
        ;;
        
    diff)
        git diff --stat
        echo ""
        git diff
        ;;
        
    status)
        git status
        ;;
        
    log)
        COUNT="${2:-10}"
        git log --oneline -n "$COUNT"
        ;;
        
    *)
        show_help
        exit 1
        ;;
esac
```

---

## Part 2: 本地语义搜索

### 2.1 技术选型

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **engram** (本地 LibSQL) | 完全离线，无需 API | 需 Node.js 依赖 | ⭐⭐⭐⭐⭐ |
| Smart Context 插件 | Obsidian 原生 | 仅 Obsidian 内使用 | ⭐⭐⭐ |
| Ollama + embedding | 完全本地 | 配置复杂 | ⭐⭐⭐ |
| OpenAI API | 效果好 | 需 API Key，有成本 | ⭐⭐⭐ |

**推荐**：采用 **engram** 方案，因其：
- 零 API 成本
- 完全本地运行
- 支持向量 + FTS 混合搜索
- 提供 MCP 协议（未来可扩展）

### 2.2 engram 集成方案

engram 架构：
```
AI Agent → engram CLI → LibSQL/SQLite (向量 + FTS)
```

**数据同步流程**：
```
Obsidian Vault (经验文件)
       ↓ 同步脚本
  engram 索引库
       ↓ 搜索
  语义搜索结果
```

### 2.3 新增命令

```bash
# 语义搜索（使用本地 embedding）
$OPENEXP_SCRIPTS/semantic-search.sh search "我想用 pnpm"  # 语义搜索
$OPENEXP_SCRIPTS/semantic-search.sh sync                 # 同步 Vault 到索引
$OPENEXP_SCRIPTS/semantic-search.sh status               # 查看索引状态
```

### 2.4 脚本实现：`semantic-search.sh`

```bash
#!/bin/bash
##############################################################################
# 本地语义搜索管理器
# 使用 engram 或备用方案提供语义搜索能力
##############################################################################

set -e

VAULT_PATH="${VAULT_PATH:-$(find ~ -name "Exp Vault" -type d 2>/dev/null | head -1)}"
ENGRAM_PATH="${HOME}/.local/share/engram"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 显示帮助
show_help() {
    cat << EOF
用法: $0 <命令> [参数]

语义搜索命令（优先级：engram > 备用搜索）:

  search <query>          语义搜索经验
  sync                    同步 Vault 到语义索引
  status                  查看索引状态
  index <file>            索引单个文件
  rebuild                 重建索引

示例:
  $0 search "包管理工具偏好"
  $0 sync
  $0 status
EOF
}

# 检查 engram 是否可用
check_engram() {
    command -v engram &> /dev/null
}

# 备用搜索：基于关键词 + 文件内容
fallback_search() {
    QUERY="$1"
    log_info "使用备用搜索: $QUERY"
    
    cd "$VAULT_PATH"
    grep -r -l "$QUERY" --include="*.md" . 2>/dev/null | head -10 | while read file; do
        echo "📄 $(basename "$file")"
        grep -n "$QUERY" "$file" 2>/dev/null | head -3
        echo "---"
    done
}

# engram 搜索
engram_search() {
    QUERY="$1"
    log_info "使用 engram 语义搜索: $QUERY"
    engram recall "$QUERY" --limit 5
}

# engram 同步
engram_sync() {
    log_info "同步 Vault 到 engram..."
    
    # 查找所有经验文件
    find "$VAULT_PATH" -name "exp_*.md" -type f | while read file; do
        # 提取内容（去除 frontmatter）
        content=$(sed '1,/^---$/d' "$file" 2>/dev/null)
        id=$(basename "$file" .md)
        
        # 添加到 engram
        engram add --id "$id" --type "experience" --content "$content" 2>/dev/null || true
    done
    
    log_success "同步完成"
}

# 主逻辑
case "$1" in
    -h|--help) show_help; exit 0 ;;
    
    search)
        [[ -z "$2" ]] && { log_error "请提供搜索关键词"; exit 1; }
        if check_engram; then
            engram_search "$2"
        else
            log_warn "engram 未安装，使用备用搜索"
            fallback_search "$2"
        fi
        ;;
        
    sync)
        if check_engram; then
            engram_sync
        else
            log_error "engram 未安装，请先安装："
            echo "  npm install -g engram-ai-memory"
        fi
        ;;
        
    status)
        if check_engram; then
            engram stats
        else
            echo "engram 未安装"
            echo "索引文件数: $(find "$VAULT_PATH" -name "exp_*.md" 2>/dev/null | wc -l)"
        fi
        ;;
        
    index)
        [[ -z "$2" ]] && { log_error "请指定文件"; exit 1; }
        if check_engram; then
            engram add --file "$2"
        else
            log_error "engram 未安装"
        fi
        ;;
        
    rebuild)
        log_info "重建索引（删除并重新同步）..."
        rm -rf "$ENGRAM_PATH" 2>/dev/null || true
        $0 sync
        ;;
        
    *)
        show_help
        exit 1
        ;;
esac
```

---

## Part 3: Obsidian CLI 升级

### 3.1 集成新命令

更新 `obsidian-cli.sh`，添加对 git 和 semantic 的封装：

```bash
#!/bin/bash
# ... 现有代码保持不变 ...

case "$1" in
    # 现有命令...
    
    # 【新增】Git 管理
    git)
        shift
        GIT_MANAGER=$(dirname "$0")/git-manager.sh
        exec "$GIT_MANAGER" "$@"
        ;;
        
    # 【新增】语义搜索
    semantic)
        shift
        SEMANTIC=$(dirname "$0")/semantic-search.sh
        exec "$SEMANTIC" "$@"
        ;;
esac
```

### 3.2 扩展命令参考文档

新建 `reference/git-commands.md`：

```markdown
# Git 版本控制命令参考

## 快速开始

```bash
# 查找脚本
OPENEXP_SCRIPTS=$(find . -path "*/skills/openexp/scripts/obsidian-cli.sh" -type f | xargs dirname)

# 1. 创建快照（记录当前状态）
$OPENEXP_SCRIPTS/obsidian-cli.sh git snapshot "添加新经验前的备份"

# 2. 创建实验分支
$OPENEXP_SCRIPTS/obsidian-cli.sh git branch test_new_template

# 3. 在分支上工作...
$OPENEXP_SCRIPTS/obsidian-cli.sh create Preferences/test.md "测试内容"

# 4. 合并分支
$OPENEXP_SCRIPTS/obsidian-cli.sh git merge test_new_template

# 5. 如果出问题，回滚
$OPENEXP_SCRIPTS/obsidian-cli.sh git rollback snapshot_20260317
```

## 快照管理

| 命令 | 说明 | 示例 |
|------|------|------|
| `git snapshot [name]` | 创建命名快照 | `git snapshot "添加 pnpm 偏好"` |
| `git snapshots` | 列出所有快照 | - |
| `git rollback <name>` | 回滚到快照 | `git rollback snapshot_20260317` |

## 分支管理

| 命令 | 说明 | 示例 |
|------|------|------|
| `git branch <name>` | 创建实验分支 | `git branch test_ui_changes` |
| `git branches` | 列出所有分支 | - |
| `git checkout <name>` | 切换分支 | `git checkout main` |
| `git merge <name>` | 合并分支 | `git merge test_ui_changes` |
| `git delete <name>` | 删除分支 | `git delete old_branch` |

## 状态查看

| 命令 | 说明 |
|------|------|
| `git status` | 查看当前状态 |
| `git diff` | 查看未提交的变更 |
| `git log [n]` | 查看最近 n 条提交 |
```

---

## Part 4: SKILL.md 升级

### 4.1 新增触发条件

在触发条件中添加：

```markdown
## 触发条件（扩展）

**版本控制触发：**
- 用户要求"保存当前状态"、"创建备份"
- 实验性操作前（"我想试试..."）
- 需要回滚时（"回到之前的状态"）

**语义搜索触发：**
- 传统关键词搜索找不到结果时
- 用户用自然语言描述而非关键词
- 需要理解语义而非字面匹配时
```

### 4.2 新增工作流

```markdown
## 版本控制工作流

当用户需要进行实验性操作时：

1. **创建快照**
   ```bash
   $OPENEXP_SCRIPTS/obsidian-cli.sh git snapshot "操作前的备份"
   ```

2. **创建实验分支**（可选）
   ```bash
   $OPENEXP_SCRIPTS/obsidian-cli.sh git branch experiment_<名称>
   ```

3. **执行操作**，记录经验

4. **评估结果**
   - 成功：合并到主分支
   - 失败：回滚到快照

## 语义搜索工作流

当关键词搜索效果不佳时：

1. **尝试语义搜索**
   ```bash
   $OPENEXP_SCRIPTS/obsidian-cli.sh semantic search "自然语言描述"
   ```

2. **结合使用**
   - 语义搜索找相关
   - 关键词搜索精确匹配
   - 两者结果合并去重
```

---

## Part 5: 实施计划

### Phase 1: Git 版本控制（1天）

- [ ] 创建 `git-manager.sh`
- [ ] 更新 `obsidian-cli.sh`
- [ ] 创建 `reference/git-commands.md`
- [ ] 更新 `SKILL.md`
- [ ] 测试完整工作流

### Phase 2: 语义搜索集成（2天）

- [ ] 评估 engram 安装
- [ ] 创建 `semantic-search.sh`
- [ ] 实现 Vault → engram 同步
- [ ] 与现有搜索集成
- [ ] 测试搜索效果

### Phase 3: 自动化增强（1天）

- [ ] 集成到 `maintain-experience-vault.py`
- [ ] 添加自动快照触发
- [ ] 优化索引更新策略

---

## 附录：依赖清单

| 依赖 | 安装命令 | 用途 |
|------|----------|------|
| Git | 系统自带 | 版本控制 |
| obsidian CLI | 见 Obsidian 设置 | Vault 操作 |
| Node.js (可选) | `brew install node` | engram 运行时 |
| engram (可选) | `npm install -g engram-ai-memory` | 语义搜索 |

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2026-03-22 | 初始设计方案 |
