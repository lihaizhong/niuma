---
name: openexp
description: 经验管理技能，从对话中学习和积累经验，并在未来交互中应用这些经验以提供更智能的响应。数据存储在 Obsidian Vault 中。
license: MIT
compatibility: iFlow CLI
metadata:
  author: niuma
  version: "2.3"
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

## 操作流程

### 1. 查找经验

**场景：用户遇到问题或询问经验**

```
用户："遇到了 CORS 问题，有什么经验吗？"
  ↓
执行：./scripts/obsidian-cli.sh search CORS content
  ↓
分析结果：找出影响力最高的相关经验
  ↓
返回：向用户展示最相关的经验
```

### 2. 添加经验

**场景：用户表达偏好或成功解决问题**

```
用户："我喜欢用 pnpm 而不是 npm"
  ↓
判断：这是偏好类型经验
  ↓
创建：./scripts/obsidian-cli.sh create Preferences/exp_preference_YYYYMMDD_XXX.md '# 内容'
  ↓
内容：包含 frontmatter 和经验描述
  ↓
完成：告知用户已记录
```

### 3. 更新经验

**场景：用户反馈经验有效性**

```
用户："这个经验很有效：exp_preference_20260311_001.md"
  ↓
执行：./scripts/obsidian-cli.sh update Preferences/exp_preference_20260311_001.md frontmatter-edit usage_count [当前值+1]
  ↓
完成：经验影响力已更新
```

### 4. 维护经验库

**场景：定期维护（建议每周）**

```
执行：python3 scripts/maintain-experience-vault.py
  ↓
功能：
  1. 扫描所有经验文件
  2. 计算影响力
  3. 更新索引地图
  4. 识别低影响力经验
  ↓
完成：经验库已更新
```

## 命令参考

### Obsidian CLI Wrapper

**路径：** `./scripts/obsidian-cli.sh`

**基本语法：**
```bash
./scripts/obsidian-cli.sh [选项] <命令> [参数]
```

**选项：**
- `--vault, -v <name>` - 指定 Vault 名称（默认：Exp Vault）
- `--help, -h` - 显示帮助信息

**核心命令：**

| 命令 | 参数 | 说明 | 示例 |
|------|------|------|------|
| `search` | `<query> [mode]` | 搜索笔记 | `./scripts/obsidian-cli.sh search CORS content` |
| `create` | `<path> [content] [mode]` | 创建笔记 | `./scripts/obsidian-cli.sh create Preferences/test.md '内容'` |
| `update` | `<path> <mode> [content] [key] [value]` | 更新笔记 | `./scripts/obsidian-cli.sh update Preferences/test.md frontmatter-edit usage_count 10` |
| `read` | `<path>` | 读取笔记 | `./scripts/obsidian-cli.sh read Preferences/test.md` |
| `list` | `[directory]` | 列出笔记 | `./scripts/obsidian-cli.sh list Preferences` |
| `frontmatter` | `<path> <mode> [key] [value]` | 操作 properties | `./scripts/obsidian-cli.sh frontmatter Preferences/test.md print` |

**常用模式：**

**搜索模式：**
- `content` - 搜索内容（默认）
- `fuzzy` - 模糊搜索

**创建模式：**
- `create` - 创建新笔记（默认）
- `append` - 追加到笔记
- `overwrite` - 覆盖笔记

**更新模式：**
- `append` - 追加内容
- `overwrite` - 覆盖内容
- `frontmatter-edit` - 编辑 properties 键值
- `frontmatter-delete` - 删除 properties 键
- `frontmatter-print` - 打印 properties

### 经验库维护脚本

**路径：** `scripts/maintain-experience-vault.py`

**基本用法：**
```bash
python3 scripts/maintain-experience-vault.py
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

## 文件规范

### 经验类型

| 类型 | 说明 | 目录 |
|------|------|------|
| `preference` | 用户偏好、设置和习惯 | Preferences/ |
| `workflow` | 固定的操作步骤和流程 | Workflows/ |
| `solution` | 问题和解决方案 | Solutions/ |
| `knowledge` | 技术概念、API、工具等知识 | Knowledge/ |
| `experience` | 完整的问题解决过程 | Experience/ |
| `convention` | 命名、格式、结构等规则 | Conventions/ |

### 文件命名

**格式：** `exp_<type>_<YYYYMMDD>_<seq>.md`

**示例：**
- ✅ 正确：`exp_preference_20260311_001.md`
- ❌ 错误：`my-preference.md`（不符合命名格式）

### Frontmatter 模板

```yaml
---
id: exp_preference_20260311_001
title: 包管理偏好
type: preference
tags: [preference, package-manager]
created: 2026-03-11T13:02:45+08:00
confidence: 0.9
usage_count: 5
impact_score: 85.5
backlinks: 3
referenced_weight: 12.5
last_impact_update: 2026-03-11T13:02:45+08:00
---
```

**必填字段：**
- `id` - 必须与文件名一致
- `type` - 经验类型
- `tags` - 标签列表
- `created` - 创建时间

**可选字段：**
- `confidence` - 置信度（0-1，默认 0.5）
- `usage_count` - 使用次数（默认 0）
- `impact_score` - 影响力（自动计算）
- `backlinks` - 反向链接数（自动计算）
- `referenced_weight` - 引用权重（自动计算）
- `last_impact_update` - 最后更新时间（自动维护）

## 约束和规则

### 必须

✅ 只捕获与实际任务相关的经验  
✅ 维护经验的置信度机制  
✅ 文件格式必须使用标准 YAML frontmatter  
✅ ID 字段必须与文件名一致  
✅ 定期运行维护脚本更新影响力（建议每周）  
✅ **必须使用 MCP 或 CLI 操作经验库**（禁止直接读写文件）  
✅ **如果 MCP 或 CLI 操作失败，直接告知用户并不执行后续操作**

### 禁止

❌ 不要捕获敏感信息（密码、密钥等）  
❌ 不要过度泛化个别情况  
❌ 不要在没有足够证据时推断经验  
❌ **禁止直接读写 Vault 目录下的文件**（必须通过 MCP 或 CLI）

### 经验捕获时机

- ✅ 用户明确表达偏好（"我喜欢..."）
- ✅ 重复出现的模式
- ✅ 成功的问题解决
- ✅ 显式学习指令（"记住这些..."）
- ✅ 综合场景分析

## 数据存储

**Vault 路径：** `~/Exp Vault`

**目录结构：**
```
~/Exp Vault/
├── Preferences/      # 用户偏好
├── Workflows/        # 工作流程
├── Solutions/        # 解决方案
├── Knowledge/        # 知识点
├── Experience/       # 完整经验
└── Conventions/      # 约定规范
```

**过滤规则：**
- Poetry 目录自动过滤
- 隐藏目录自动过滤

## 注意事项

1. **运行维护脚本前建议备份 Vault 目录**
2. **确保已安装 Python 3.9+ 和依赖库（pyyaml）**
3. **首次运行维护脚本可能需要较长时间**
4. **新经验有 30 天保护期，不会被识别为低影响力**
5. **经验库会自动计算影响力，手动编辑 frontmatter 时注意保持一致性**