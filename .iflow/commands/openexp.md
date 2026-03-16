---
name: /openexp
id: openexp
category: Experience
description: 经验管理命令 - 使用自然语言描述你的需求
---

经验管理命令。使用自然语言描述你的需求，AI 会自动判断需要做什么操作。

**核心能力：**
- 自动学习用户偏好和工作模式
- 存储和检索解决方案和最佳实践
- 应用历史经验优化响应
- 通过反馈不断改进经验质量
- 使用 Obsidian 双向链接关联相关经验

---

## 使用方法

```bash
/openexp <自然语言描述>
```

---

## 示例

| 操作 | 示例 |
|------|------|
| 添加 | `/openexp 我喜欢用 pnpm 而不是 npm` |
| 搜索 | `/openexp 搜索 CORS 相关的经验` |
| 查看详情 | `/openexp 显示 exp_preference_20260311_130245.md 的详情` |
| 更新 | `/openexp 把 exp_xxx.md 的置信度提高到 0.9` |
| 删除 | `/openexp 删除 exp_xxx.md` |
| 反馈 | `/openexp 这个经验很有效：exp_xxx.md` |
| 统计 | `/openexp 有多少条经验？` |
| 编辑 | `/openexp 在 Obsidian 中打开 exp_xxx.md` |

---

## AI 判断逻辑

| 描述关键词 | 自动操作 |
|------------|----------|
| "我喜欢"、"记住"、"我的习惯" | 添加新经验 |
| "显示"、"列出"、"看看" | 列出经验 |
| "搜索"、"找"、"查询" | 搜索经验 |
| "详情"、"查看" | 查看经验详情 |
| "更新"、"改成"、"提高到" | 更新经验 |
| "删除"、"移除" | 删除经验 |
| "有效"、"不管用"、"反馈" | 提供反馈 |
| "遇到了"、"怎么"、"应该" | 应用经验 |

---

## 前置要求

1. Obsidian 桌面应用（版本 1.12+）需要运行
2. Obsidian CLI 已安装（从 Obsidian 设置中安装）
3. Vault 路径：`~/Exp Vault`

---

## 存储结构

```
~/Exp Vault/
├── Preferences/         # 用户偏好
├── Workflows/           # 工作流程
├── Solutions/           # 解决方案
├── Knowledge/           # 知识点
├── Experience/          # 完整的问题解决过程
└── Conventions/         # 约定规范
```

| 类型 | 说明 |
|------|------|
| `preference` | 用户偏好、设置和习惯 |
| `workflow` | 固定的操作步骤和流程 |
| `solution` | 问题和解决方案 |
| `knowledge` | 技术概念、API、工具等知识 |
| `experience` | 完整的问题解决过程 |
| `convention` | 命名、格式、结构等规则 |

---

## 注意事项

- 不会捕获敏感信息（密码、密钥等）
- 必须通过 CLI 操作经验库（禁止直接读写文件）
- 定期运行维护脚本更新影响力（建议每周）

---

## 相关文档

- [Skill 规范](../skills/openexp/SKILL.md)
- [命令参考](../skills/openexp/reference/commands.md)
- [影响力计算](../skills/openexp/reference/impact-calculation.md)