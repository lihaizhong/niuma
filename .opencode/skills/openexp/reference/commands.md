# 命令参考

## 脚本路径查找

执行命令前，先动态查找脚本位置：

```bash
# 查找脚本目录
OPENEXP_SCRIPTS=$(find . -path "*/skills/openexp/scripts/obsidian-cli.sh" -type f 2>/dev/null | head -1 | xargs dirname 2>/dev/null)

# 后续使用 $OPENEXP_SCRIPTS/obsidian-cli.sh 调用
```

## 环境变量配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DEFAULT_VAULT_NAME` | Exp Vault | 默认 Vault 名称 |

**示例：**
```bash
# 指定其他 Vault
export DEFAULT_VAULT_NAME="My Vault"
$OPENEXP_SCRIPTS/obsidian-cli.sh search pnpm
```

## Obsidian CLI Wrapper

**基本语法：**
```bash
$OPENEXP_SCRIPTS/obsidian-cli.sh [选项] <命令> [参数]
```

**选项：**
- `--vault, -v <name>` - 指定 Vault 名称（默认：Exp Vault）
- `--help, -h` - 显示帮助信息

---

## 完整命令列表

| 命令 | 参数 | 说明 | 示例 |
|------|------|------|------|
| `search` | `<query> [mode]` | 搜索笔记 | `$OPENEXP_SCRIPTS/obsidian-cli.sh search CORS content` |
| `create` | `<path> [content] [mode]` | 创建笔记 | `$OPENEXP_SCRIPTS/obsidian-cli.sh create Preferences/test.md '内容'` |
| `update` | `<path> <mode> [content] [key] [value]` | 更新笔记 | `$OPENEXP_SCRIPTS/obsidian-cli.sh update Preferences/test.md frontmatter-edit usage_count 10` |
| `read` | `<path>` | 读取笔记 | `$OPENEXP_SCRIPTS/obsidian-cli.sh read Preferences/test.md` |
| `list` | `[directory]` | 列出笔记 | `$OPENEXP_SCRIPTS/obsidian-cli.sh list Preferences` |
| `frontmatter` | `<path> <mode> [key] [value]` | 操作 properties | `$OPENEXP_SCRIPTS/obsidian-cli.sh frontmatter Preferences/test.md print` |
| `delete` | `<path> <confirm>` | 删除笔记 | `$OPENEXP_SCRIPTS/obsidian-cli.sh delete Preferences/test.md Preferences/test.md` |
| `open` | `<path>` | 在 Obsidian 中打开 | `$OPENEXP_SCRIPTS/obsidian-cli.sh open Preferences/test.md` |
| `move` | `<old> <new>` | 移动或重命名 | `$OPENEXP_SCRIPTS/obsidian-cli.sh move old.md new.md` |
| `version` | - | 获取 obsidian 版本 | `$OPENEXP_SCRIPTS/obsidian-cli.sh version` |
| `check` | - | 检查 obsidian 是否可用 | `$OPENEXP_SCRIPTS/obsidian-cli.sh check` |

---

## 使用模式

### 搜索模式

- `content` - 搜索内容（默认）
- `fuzzy` - 模糊搜索

**示例：**
```bash
$OPENEXP_SCRIPTS/obsidian-cli.sh search pnpm content
$OPENEXP_SCRIPTS/obsidian-cli.sh search pnpm fuzzy
```

### 创建模式

- `create` - 创建新笔记（默认）
- `append` - 追加到笔记
- `overwrite` - 覆盖笔记

**示例：**
```bash
# 创建新笔记
$OPENEXP_SCRIPTS/obsidian-cli.sh create Preferences/test.md '测试内容'

# 追加内容
$OPENEXP_SCRIPTS/obsidian-cli.sh create Preferences/test.md '## 新增内容' append

# 覆盖笔记
$OPENEXP_SCRIPTS/obsidian-cli.sh create Preferences/test.md '新内容' overwrite
```

### 更新模式

- `append` - 追加内容
- `overwrite` - 覆盖内容
- `frontmatter-edit` - 编辑 properties 键值
- `frontmatter-delete` - 删除 properties 键
- `frontmatter-print` - 打印 properties

**示例：**
```bash
# 追加内容
$OPENEXP_SCRIPTS/obsidian-cli.sh update Preferences/test.md append '## 新增内容'

# 覆盖内容
$OPENEXP_SCRIPTS/obsidian-cli.sh update Preferences/test.md overwrite '新内容'

# 编辑 frontmatter
$OPENEXP_SCRIPTS/obsidian-cli.sh update Preferences/test.md frontmatter-edit 'tags' 'test, updated'
$OPENEXP_SCRIPTS/obsidian-cli.sh update Preferences/test.md frontmatter-edit usage_count 10

# 删除 frontmatter 键
$OPENEXP_SCRIPTS/obsidian-cli.sh update Preferences/test.md frontmatter-delete 'old_key'

# 打印 frontmatter
$OPENEXP_SCRIPTS/obsidian-cli.sh update Preferences/test.md frontmatter-print
```

---

## 经验库维护脚本

**基本用法：**
```bash
python3 $OPENEXP_SCRIPTS/maintain-experience-vault.py
```

**功能：**
1. 扫描所有经验文件
2. 计算影响力（usage_count × 5 + confidence × 50 + backlinks × 10 + referenced_weight）
3. 更新索引地图
4. 识别低影响力经验

**配置：**
- Vault 路径：`~/Exp Vault`
- 影响力阈值：30.0
- 新经验保护期：30 天

**运行频率：** 每周一次
