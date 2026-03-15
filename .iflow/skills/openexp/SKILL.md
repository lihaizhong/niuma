---
name: openexp
description: 经验管理技能，从对话中学习和积累经验，并在未来交互中应用这些经验以提供更智能的响应。数据存储在 Obsidian Vault 中。
license: MIT
compatibility: iFlow CLI
metadata:
  author: niuma
  version: "2.2"
  tags: [learning, memory, experience, knowledge-base, obsidian]
---

# 经验管理技能

从用户交互中学习和积累经验，建立经验库，并在未来的对话中应用这些经验以提供更智能、更个性化的响应。

## 核心特性
- ✅ 支持单次交互生成 0-x 条经验记录（动态数量）
- ✅ 智能识别用户偏好、工作流程、解决方案等多种经验类型
- ✅ 使用 Obsidian Markdown 格式存储，支持双向链接和标签
- ✅ 根据使用频率、置信度和关联关系自动计算影响力
- ✅ 只展示影响力最大的前 20 条经验

**数据存储：** `~/Exp Vault` 目录

## 快速开始

```bash
/openexp 我喜欢用 pnpm 而不是 npm
/openexp 遇到了 CORS 问题，有什么经验吗？
/openexp 查看经验索引地图
```

## 经验类型和存储

| 类型 | 描述 | 目录 | 命名格式 |
|------|------|------|----------|
| preference | 用户偏好、设置和习惯 | Preferences/ | `exp_preference_YYYYMMDD_XXX.md` |
| workflow | 固定的操作步骤和流程 | Workflows/ | `exp_workflow_YYYYMMDD_XXX.md` |
| solution | 问题和解决方案 | Solutions/ | `exp_solution_YYYYMMDD_XXX.md` |
| knowledge | 技术概念、API、工具等知识 | Knowledge/ | `exp_knowledge_YYYYMMDD_XXX.md` |
| experience | 完整的问题解决过程 | Experience/ | `exp_experience_YYYYMMDD_XXX.md` |
| convention | 命名、格式、结构等规则 | Conventions/ | `exp_convention_YYYYMMDD_XXX.md` |

**目录结构：** `~/Exp Vault/{Preferences, Workflows, Solutions, Knowledge, Experience, Conventions}/`  
**命名规范：** `exp_<type>_<YYYYMMDD>_<seq>.md`（序列号 3 位）  
**过滤规则：** Poetry 目录和隐藏目录自动过滤

## 工作流程

```
用户交互 → 有价值？→ 分析并提取经验 → 创建笔记 → 更新索引 → 完成
                ↓ 否
            正常响应 → 完成
```

## 索引地图

展示"技巧"、"原则"、"模型"三个核心维度之间的关系。影响力 = usage_count * 5 + confidence * 50 + backlinks * 10 + referenced_weight。

```bash
python3 scripts/maintain-experience-vault.py  # 自动维护
```

## 使用方法

```bash
# 添加经验
/openexp 我喜欢用 pnpm 而不是 npm
/openexp 记住这些：项目使用 TypeScript、strict mode

# 查找经验
/openexp 搜索 CORS 相关的经验
/openexp 遇到了 CORS 问题，有什么经验吗？

# 管理经验
/openexp 这个经验很有效：exp_preference_20260311_130245_1.md
/openexp 查看经验索引地图
```

## 文件规范

### Frontmatter 示例
```yaml
---
id: exp_preference_20260311_001
title: 包管理偏好
type: preference
tags: [preference, package-manager]
created: 2026-03-11T13:02:45+08:00
confidence: 0.9
usage_count: 5
---
```

**必填字段：** `id`（必须与文件名一致）、`type`、`tags`、`created`

### 文件命名
- ✅ 正确：`exp_preference_20260311_001.md`
- ❌ 错误：`exp_convention_openspec_20260315_094611_1.md`（序列号应为 3 位）
- ❌ 错误：`my-preference.md`（不符合命名格式）

## 捕获时机

- ✅ 用户明确表达偏好（"我喜欢..."）
- ✅ 重复出现的模式
- ✅ 成功的问题解决
- ✅ 显式学习指令（"记住这些..."）
- ✅ 综合场景分析

## 约束和限制

### 必须
- ✅ 只捕获与实际任务相关的经验
- ✅ 维护经验的置信度机制
- ✅ 文件格式必须使用标准 YAML frontmatter
- ✅ ID 字段必须与文件名一致
- ✅ 定期运行维护脚本更新影响力（建议每周）

### 禁止
- ❌ 不要捕获敏感信息（密码、密钥等）
- ❌ 不要过度泛化个别情况
- ❌ 不要在没有足够证据时推断经验

## 集成方式

**Obsidian CLI：** `./scripts/obsidian-cli.sh create Preferences/test.md '# 内容'`  
**MCP Server：** `create_note`, `search_vault`, `update_note`

## 相关资源

- [模板使用指南](reference/template-guide.md)
- [影响力计算逻辑](reference/impact-calculation.md)
- [Obsidian 文档](https://help.obsidian.md)

---

**版本信息**：v2.2 | **更新日期**：2026-03-15 | **详细版本历史**：[VERSION.md](VERSION.md)