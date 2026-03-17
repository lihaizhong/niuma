---
name: openexp
description: |
  经验管理技能 - AI 记忆系统的核心，学习、积累和应用用户偏好与解决方案。
  
  强制触发场景（必须主动使用此 skill）：
  - 用户表达偏好："我喜欢..."、"习惯..."、"偏好..."、"不要用..."
  - 问题解决后：主动询问"是否记录这条经验？"
  - 用户提到历史："之前怎么..."、"以前..."、"曾经..."、"上次..."
  - 任务开始时：主动搜索相关偏好和约定
  - 显式学习："记住这个"、"下次这样处理"、"学到了"
  
  即使没有明确提到"经验"，只要涉及学习、记忆、应用历史知识的场景，都必须使用此 skill。
license: MIT
compatibility: iFlow CLI
metadata:
  author: niuma
  version: "2.7"
  tags: [learning, memory, experience, knowledge-base, obsidian]
---

# 经验管理技能

从用户交互中学习和积累经验，建立经验库，并在未来的对话中应用这些经验以提供更智能、更个性化的响应。

## 触发条件

**用户明确请求以下内容时触发：**

- 表达偏好："我喜欢用 pnpm"、"我习惯使用..."
- 遇到问题寻求经验："遇到过 CORS 问题吗？有什么经验？"
- 查找特定经验："搜索关于 TypeScript 的经验"
- 管理经验："这个经验很有效"、"查看经验索引地图"
- 显式学习指令："记住这些..."

## 主动应用经验

在以下场景，**主动查询并应用经验**（无需用户明确请求）：

- 开始新任务时 → 搜索相关关键词，应用已知的偏好和解决方案
- 遇到问题时 → 搜索类似问题的解决方案
- 生成代码时 → 应用已知的编码偏好（如包管理器、命名风格）
- 用户做决策时 → 提醒相关的偏好或约定

**示例：** 用户说"创建一个新项目"，主动查询是否有"偏好框架"、"偏好包管理器"等经验。

## 快速示例

**场景：** 用户说"我喜欢用 pnpm，不要用 npm"

**步骤：**
```bash
# 1. 创建经验（OPENEXP_SCRIPTS 已通过自动查找设置）
$OPENEXP_SCRIPTS/obsidian-cli.sh create Preferences/exp_preference_20260317_001.md '---
id: exp_preference_20260317_001
type: preference
tags: [preference, package-manager]
created: 2026-03-17T10:00:00+08:00
---
# 用户偏好：使用 pnpm

用户明确表示喜欢使用 pnpm 而非 npm 作为包管理器。
在项目中优先使用 pnpm install、pnpm add 等命令。
'

# 2. 告知用户
"已记录您的偏好到经验库。"
```

**场景：** 开始新任务前主动查询

```bash
# 搜索相关经验
$OPENEXP_SCRIPTS/obsidian-cli.sh search "preference"
$OPENEXP_SCRIPTS/obsidian-cli.sh search "convention"

# 根据结果应用已知的偏好和约定
```

## 脚本路径自动查找

脚本位置不固定，使用通配符动态查找，支持任意 CLI/IDE 工具：

```bash
# 动态查找：匹配所有 */skills/openexp/scripts/obsidian-cli.sh
OPENEXP_SCRIPTS=$(find . -path "*/skills/openexp/scripts/obsidian-cli.sh" -type f 2>/dev/null | head -1 | xargs dirname 2>/dev/null)

# 后续使用 $OPENEXP_SCRIPTS/obsidian-cli.sh 调用
```

**查找范围：**
- 自动发现所有符合 `*/skills/openexp/scripts/` 结构的目录
- 支持 `.iflow`、`.claude`、`.cursor`、`.aider`、`.continue`、`.cline`、`.windsurf` 等任意配置目录
- 无需维护工具列表，新增工具自动兼容

## 操作流程

1. **查找经验**：执行 `$OPENEXP_SCRIPTS/obsidian-cli.sh search <query>`，返回最相关的经验
2. **添加经验**：执行 `$OPENEXP_SCRIPTS/obsidian-cli.sh create <path> '<content>'`，告知用户已记录
3. **更新经验**：执行 `$OPENEXP_SCRIPTS/obsidian-cli.sh update <path> frontmatter-edit usage_count <n>`
4. **维护经验库**：执行 `python3 $OPENEXP_SCRIPTS/maintain-experience-vault.py`（建议每周）

## 常用命令

| 命令 | 用途 | 示例 |
|------|------|------|
| `search <query>` | 搜索经验 | `search CORS` |
| `create <path> <content>` | 创建经验 | `create Preferences/test.md '内容'` |
| `update <path> frontmatter-edit <key> <value>` | 更新字段 | `update test.md frontmatter-edit usage_count 10` |
| `read <path>` | 读取经验 | `read Preferences/test.md` |

> 详细命令参考：见 reference/commands.md

## 文件规范

### 经验类型

| 类型 | 说明 | 目录 | 模板 |
|------|------|------|------|
| `preference` | 用户偏好、设置和习惯 | Preferences/ | `preference-template.md` |
| `workflow` | 固定的操作步骤和流程 | Workflows/ | `workflow-template.md` |
| `solution` | 问题和解决方案 | Solutions/ | `solution-template.md` |
| `knowledge` | 技术概念、API、工具等知识 | Knowledge/ | `knowledge-template.md` |
| `experience` | 完整的问题解决过程 | Experience/ | `experience-template.md` |
| `convention` | 命名、格式、结构等规则 | Conventions/ | `convention-template.md` |

**创建经验时**：参考 `templates/` 目录下对应的模板文件，确保格式一致。

### 文件命名

**格式：** `exp_<type>_<YYYYMMDD_HHMMSS>_<seq>.md`

**示例：**
- ✅ 正确：`exp_preference_20260311_130245_001.md`
- ❌ 错误：`my-preference.md`（不符合命名格式）

### Frontmatter 必填字段

```yaml
---
id: exp_preference_20260311_001
type: preference
tags: [preference, package-manager]
created: 2026-03-11T13:02:45+08:00
---
```

**必填字段：**
- `id` - 必须与文件名一致
- `type` - 经验类型
- `tags` - 标签列表
- `created` - 创建时间

> 其他字段（confidence, usage_count, impact_score 等）由维护脚本自动计算，无需手动填写。

## 核心原则

### 通过 CLI 操作
所有经验库操作必须通过 `obsidian-cli.sh` 完成。原因：
- **可追溯**：操作被正确记录，支持变更历史
- **格式一致**：自动填充 frontmatter，避免人为错误
- **健壮性**：内置超时和重试机制，避免 Obsidian 响应慢导致失败

### 敏感信息保护
不要记录密码、API 密钥、token 等敏感信息。原因：经验库以明文存储，不适合保存机密数据。

### 质量优先于数量
只记录与实际任务相关的经验。原因：过度泛化或无实际价值的经验会降低整个经验库的实用性和检索效率。

### 经验捕获时机
主动捕获经验的时机：
- 用户明确表达偏好（"我喜欢..."、"不要用..."）
- 重复出现的模式（相同问题多次出现）
- 成功或失败的问题解决（失败经验同样有价值）
- 显式学习指令（"记住这些..."）

## 错误恢复

当 Obsidian CLI 不可用或操作失败时：

1. **告知用户**：说明 CLI 暂不可用及原因
2. **临时存储**：在内存中记录经验内容，告知用户"将在下次可用时同步"
3. **检查修复**：
   ```bash
   $OPENEXP_SCRIPTS/obsidian-cli.sh check
   ```
4. **绕过 CLI**：仅在用户明确要求时，可直接操作 `~/Exp Vault` 目录

## 错误处理

当 CLI 操作失败时：

1. 向用户报告具体错误信息
2. 检查 obsidian CLI 是否正确安装：
   ```bash
   $OPENEXP_SCRIPTS/obsidian-cli.sh check
   ```
3. 如果 CLI 不可用，告知用户并建议检查 Obsidian 设置
4. **不要尝试绕过 CLI 直接操作文件**

## 数据存储

**Vault 路径：** `~/Exp Vault`（包含 Preferences/, Workflows/, Solutions/, Knowledge/, Experience/, Conventions/）

## 影响力计算

**公式：** `impact_score = usage_count × 5 + confidence × 50 + backlinks × 10 + referenced_weight`

> 详细说明：见 reference/impact-calculation.md

## 注意事项

1. **运行维护脚本前建议备份 Vault 目录**
2. **确保已安装 Python 3.9+ 和依赖库（pyyaml）**
3. **新经验有 30 天保护期，不会被识别为低影响力**