# OpenExp 升级方案 v2.0：Obsidian 原生能力 + Git 版本控制

> 充分利用 Obsidian Bases、Properties、Canvas 等原生功能，简化架构

## 目录结构

```
.opencode/skills/openexp/
├── SKILL.md                      # 主技能定义（升级）
├── VERSION.md                    # 版本记录
├── scripts/
│   ├── obsidian-cli.sh           # 现有 CLI（增强）
│   └── git-manager.sh            # 【新增】Git 版本控制
├── templates/
│   ├── *.md                      # 现有模板
│   └── exp-base.md               # 【新增】经验库 Base 定义
├── bases/
│   └── experience-index.base     # 【新增】经验索引视图
└── reference/
    └── git-commands.md           # 【新增】Git 命令参考
```

---

## Part 1: Obsidian Bases 替代维护脚本

### 1.1 经验库 Base 定义

创建 `bases/experience-index.base`：

```yaml
name: 经验索引
type: experience-index

# 过滤器：显示所有经验文件
filters:
  and:
    - file.name.contains("exp_")

# 显示的属性
properties:
  - file.name           # 文件名
  - type                # 经验类型
  - tags                # 标签
  - impact_score        # 影响力
  - usage_count         # 使用次数
  - confidence          # 置信度
  - created             # 创建时间

# 视图定义
views:
  - type: table
    name: 全部经验
    
  - type: table
    name: 高影响力
    filters:
      and:
        - impact_score >= 50
    order:
      - impact_score DESC
        
  - type: table
    name: 按类型
    groupBy: type
        
  - type: table
    name: 最近创建
    order:
      - created DESC
    limit: 20
        
  - type: table
    name: 低价值（待清理）
    filters:
      and:
        - impact_score < 30
        - file.mtime < date - 30d
```

### 1.2 创建 Base 的 Obsidian 命令

在 Obsidian 中执行：
1. 设置 → 核心插件 → 启用 **Bases**
2. 右键 `Exp Vault` 文件夹 → **New base**
3. 命名为 `经验索引.base`
4. 粘贴上述 YAML 配置

### 1.3 移除的脚本功能

| 原脚本功能 | Base 替代方案 |
|-----------|--------------|
| 影响力统计 | Base 表格视图 + 排序 |
| 索引地图 | Base 的 groupBy 功能 |
| 低价值识别 | Base 过滤视图 |
| 内联编辑 | Base 支持内联修改属性 |

**保留的脚本功能**：
- `obsidian-cli.sh` - 创建/读取笔记
- `git-manager.sh` - 版本控制

---

## Part 2: Properties 属性标准化

### 2.1 统一属性定义

Obsidian 1.0+ 的 Properties 是 frontmatter 的升级版：

```yaml
---
id: exp_preference_20260322_001
type: preference
tags: [preference, package-manager]
created: 2026-03-22
impact_score: 75
usage_count: 5
confidence: 0.9
---
```

### 2.2 模板更新

更新 `preference-template.md`，使用 Properties 语法：

```markdown
---
id: {{date:exp_preference_YYYYMMDD}}_{{time:HHMMSS}}_001
type: preference
tags: [preference, ]
created: {{date}}
impact_score: 0
usage_count: 0
confidence: 0.5
---

# 用户偏好：[标题]

## 描述
[详细描述]

## 上下文
- **来源**：显式声明 / 观察推断
- **场景**：[适用场景]

## 关联
- [[exp_xxx]] - 相关经验

## 反馈记录
- [日期]: [反馈]
```

---

## Part 3: Git 版本控制

### 3.1 脚本实现：`git-manager.sh`

```bash
#!/bin/bash
##############################################################################
# Git 版本控制管理器
# 为经验库提供快照、分支、回滚等 Git 功能
##############################################################################

set -e

VAULT_PATH="${VAULT_PATH:-$(find ~ -name "Exp Vault" -type d 2>/dev/null | head -1)}"

[[ -z "$VAULT_PATH" ]] && { echo "错误: 找不到 Exp Vault"; exit 1; }
[[ ! -d "$VAULT_PATH/.git" ]] && {
    echo "Vault 未初始化 Git，正在初始化..."
    cd "$VAULT_PATH"
    git init
    echo "# Exp Vault" > README.md
    git add README.md
    git commit -m "初始化经验库"
}

cd "$VAULT_PATH"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

case "$1" in
    snapshot|snap)
        NAME="${2:-snapshot_$(date +%Y%m%d_%H%M%S)}"
        info "创建快照: $NAME"
        git add -A
        git commit -m "🧠 $NAME" || true
        git tag "$NAME" 2>/dev/null || true
        ok "快照已创建: $NAME"
        ;;
        
    snapshots|snapshots)
        info "快照列表:"
        git tag -l "snapshot_*" --format='%(refname:short) (%(creatordate:short)) %(subject)' 2>/dev/null || echo "  无快照"
        ;;
        
    rollback)
        [[ -z "$2" ]] && { echo "用法: $0 rollback <snapshot_name>"; exit 1; }
        SNAP="$2"
        info "回滚到: $SNAP"
        git checkout "$SNAP" -- .
        git checkout "$SNAP"
        ok "已回滚"
        ;;
        
    branch)
        [[ -z "$2" ]] && { echo "用法: $0 branch <name>"; exit 1; }
        git checkout -b "exp/$2"
        ok "已创建并切换到分支: exp/$2"
        ;;
        
    branches)
        info "经验分支:"
        git branch -a | grep "exp/" || echo "  无实验分支"
        info "当前: $(git branch --show-current)"
        ;;
        
    checkout)
        [[ -z "$2" ]] && { echo "用法: $0 checkout <branch>"; exit 1; }
        git checkout "$2"
        ok "已切换到: $2"
        ;;
        
    merge)
        [[ -z "$2" ]] && { echo "用法: $0 merge <branch>"; exit 1; }
        git merge "$2" -m "合并: $2"
        ok "已合并: $2"
        ;;
        
    diff)
        git diff --stat && echo && git diff
        ;;
        
    status)
        git status -s
        ;;
        
    log)
        git log --oneline -n "${2:-10}"
        ;;
        
    *)
        cat << EOF
用法: $0 <命令> [参数]

快照:
  snapshot [name]      创建命名快照
  snapshots           列出快照
  rollback <name>     回滚到快照

分支:
  branch <name>       创建实验分支
  branches            列出分支
  checkout <branch>   切换分支
  merge <branch>      合并分支

状态:
  diff                查看变更
  status              当前状态
  log [n]             最近 n 条提交

示例:
  $0 snapshot "添加偏好前的备份"
  $0 branch test_new_template
  $0 merge test_new_template
EOF
        ;;
esac
```

---

## Part 4: Obsidian CLI 增强

### 4.1 更新 `obsidian-cli.sh`

```bash
#!/bin/bash
set -e

VAULT="${DEFAULT_VAULT_NAME:-Exp Vault}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

obs() { obsidian "$@" vault="$VAULT"; }

case "$1" in
    # 现有命令...
    check|read|create|update|delete|list|search)
        [[ "$1" == "check" ]] && command -v obsidian &>/dev/null && echo "✓ obsidian 可用" || exit 1
        ;;
        
    # 【新增】Git 版本控制
    git)
        shift
        exec "$SCRIPT_DIR/git-manager.sh" "$@"
        ;;
        
    # 【新增】查看 Base
    base|bases)
        case "$2" in
            list) obs files folder="bases" ;;
            *) echo "用法: $0 base [list]" ;;
        esac
        ;;
        
    *)
        cat << EOF
用法: $0 <命令>

基础命令:
  search <query>       搜索笔记
  create <path> [c]   创建笔记
  read <path>         读取笔记
  list [folder]       列出笔记

Git 命令:
  git snapshot [n]   创建快照
  git snapshots       列出快照
  git rollback <n>   回滚
  git branch <n>     创建分支
  git merge <n>      合并分支
  git status          查看状态

Base 命令:
  base list           列出视图
EOF
        exit 1
        ;;
esac
```

---

## Part 5: SKILL.md 更新

### 5.1 新增触发条件

```markdown
## 触发条件（扩展）

**版本控制触发：**
- 用户要求"保存当前状态"、"创建备份"
- 实验性操作前（"我想试试..."）
- 需要回滚时（"回到之前的状态"）
```

### 5.2 新增工作流

```markdown
## 版本控制工作流

1. **创建快照**
   bash
   $OPENEXP_SCRIPTS/obsidian-cli.sh git snapshot "操作前的备份"
   ```

2. **创建实验分支**（可选）
   bash
   $OPENEXP_SCRIPTS/obsidian-cli.sh git branch experiment_ui
   ```

3. **执行操作**，记录经验

4. **评估结果**
   - 成功：合并到主分支
   - 失败：回滚到快照

## 经验库查看

使用 Obsidian 的 Bases 视图查看经验库：

1. 打开 `Exp Vault/经验索引.base`
2. 切换不同视图：高影响力/按类型/最近创建/低价值
3. 直接在表格中编辑属性
```

---

## Part 6: 实施清单

### Phase 1: Git 版本控制（0.5天）

- [ ] 创建 `scripts/git-manager.sh`
- [ ] 更新 `obsidian-cli.sh`
- [ ] 测试 Git 工作流

### Phase 2: Obsidian Bases（0.5天）

- [ ] 创建 `bases/experience-index.base`
- [ ] 更新模板使用 Properties
- [ ] 简化 `maintain-experience-vault.py`（仅保留必要功能）

### Phase 3: 文档更新（0.5天）

- [ ] 更新 `SKILL.md`
- [ ] 创建 `reference/git-commands.md`

---

## 对比总结

| 项目 | v1 方案 | v2 方案（优化后） |
|------|---------|------------------|
| 维护脚本 | 复杂 Python 脚本 | 移除，Base 替代 |
| 索引地图 | 手动生成 Markdown | Base 动态视图 |
| 统计功能 | 脚本计算 | Base 内置排序/过滤 |
| 语义搜索 | 需集成 engram | 可选（当前保持现有搜索） |
| 版本控制 | Git 封装 | Git 封装（不变） |
| 复杂度 | 高 | **低** |

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2026-03-22 | 初始方案 |
| 2.0 | 2026-03-22 | 引入 Obsidian Bases 简化架构 |
