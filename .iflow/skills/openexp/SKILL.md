---
name: openexp
description: 经验管理技能，从对话中学习和积累经验，并在未来交互中应用这些经验以提供更智能的响应。数据存储在 Obsidian Vault 中。
license: MIT
compatibility: iFlow CLI
metadata:
  author: niuma
  version: "2.4"
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

1. **查找经验**：执行 `./scripts/obsidian-cli.sh search <query>`，返回最相关的经验
2. **添加经验**：执行 `./scripts/obsidian-cli.sh create <path> '<content>'`，告知用户已记录
3. **更新经验**：执行 `./scripts/obsidian-cli.sh update <path> frontmatter-edit usage_count <n>`
4. **维护经验库**：执行 `python3 scripts/maintain-experience-vault.py`（建议每周）

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

| 类型 | 说明 | 目录 |
|------|------|------|
| `preference` | 用户偏好、设置和习惯 | Preferences/ |
| `workflow` | 固定的操作步骤和流程 | Workflows/ |
| `solution` | 问题和解决方案 | Solutions/ |
| `knowledge` | 技术概念、API、工具等知识 | Knowledge/ |
| `experience` | 完整的问题解决过程 | Experience/ |
| `convention` | 命名、格式、结构等规则 | Conventions/ |

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

**可选字段（自动计算或可选）：**
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
✅ **必须使用 CLI 操作经验库**（禁止直接读写文件）  
✅ **如果 CLI 操作失败，直接告知用户并不执行后续操作**

### 禁止

❌ 不要捕获敏感信息（密码、密钥等）  
❌ 不要过度泛化个别情况  
❌ 不要在没有足够证据时推断经验  
❌ **禁止直接读写 Vault 目录下的文件**（必须通过 CLI）

### 经验捕获时机

- ✅ 用户明确表达偏好（"我喜欢..."）
- ✅ 重复出现的模式
- ✅ 成功的问题解决
- ✅ 显式学习指令（"记住这些..."）
- ✅ 综合场景分析

## 数据存储

**Vault 路径：** `~/Exp Vault`（包含 Preferences/, Workflows/, Solutions/, Knowledge/, Experience/, Conventions/）

## 影响力计算

**公式：** `impact_score = usage_count × 5 + confidence × 50 + backlinks × 10 + referenced_weight`

> 详细说明：见 reference/impact-calculation.md

## 注意事项

1. **运行维护脚本前建议备份 Vault 目录**
2. **确保已安装 Python 3.9+ 和依赖库（pyyaml）**
3. **新经验有 30 天保护期，不会被识别为低影响力**