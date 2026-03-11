---
name: /openexp
id: openexp
category: Experience
description: 经验管理命令 - 使用自然语言描述你的需求
---

经验管理命令。使用自然语言描述你的需求，AI 会自动判断需要做什么操作。

**核心能力：**
- 🧠 自动学习用户偏好和工作模式
- 📚 存储和检索解决方案和最佳实践
- 🎯 应用历史经验优化响应
- 🔄 通过反馈不断改进经验质量
- 🔗 使用 Obsidian MCP 双向链接关联相关经验
- 🏷️ 通过标签系统分类和检索经验
- ⚡ 使用 MCP 协议提供更稳定和强大的操作

---

## 使用方法

```bash
/openexp <自然语言描述>
```

只需要用自然语言描述你的需求，AI 会自动判断需要做什么操作。

---

## 示例

### 添加经验
```bash
/openexp 我喜欢用 pnpm 而不是 npm
/openexp 记住这个：项目使用 TypeScript strict mode
/openexp 我的习惯是先运行测试再提交代码
```

### 查看经验
```bash
/openexp 显示所有经验
/openexp 列出所有关于 TypeScript 的经验
/openexp 看看有什么工作流程
```

### 搜索经验
```bash
/openexp 搜索 CORS 相关的经验
/openexp 找找关于部署的解决方案
/openexp 查询 pnpm 相关的偏好
```

### 查看详情
```bash
/openexp 显示 exp_preference_20260311_130245.md 的详情
/openexp 查看这个经验：exp_workflow_20260311_120000.md
```

### 更新经验
```bash
/openexp 把 exp_preference_20260311_130245.md 的置信度提高到 0.9
/openexp 更新 exp_preference_20260311_130245.md，内容改成：用户偏好使用 pnpm 和 strict mode
```

### 删除经验
```bash
/openexp 删除 exp_preference_20260311_130245.md
/openexp 移除这个经验：exp_old.md
```

### 提供反馈
```bash
/openexp 这个经验很有效：exp_preference_20260311_130245.md
/openexp 这个方案不管用：exp_solution_cors.md
/openexp 给 exp_preference_20260311_130245.md 一个正面反馈
```

### 查看统计
```bash
/openexp 统计一下经验库
/openexp 显示经验库的详细信息
/openexp 有多少条经验？
```

### 打开编辑
```bash
/openexp 在 Obsidian 中打开 exp_preference_20260311_130245.md
/openexp 编辑这个经验：exp_preference_20260311_130245.md
```

### 创建链接
```bash
/openexp 把 exp_preference_20260311_130245.md 和 exp_workflow_20260311_120000.md 关联起来
/openexp 在这两个经验之间创建链接：exp_preference_20260311_130245.md, exp_workflow_20260311_120000.md
```

### 应用经验
```bash
/openexp 遇到了 CORS 问题，有什么经验吗？
/openexp 怎么部署这个项目？
/openexp 根据经验，我应该用什么工具？
```

---

## AI 判断逻辑

AI 会根据你的描述自动判断需要做什么操作：

| 描述关键词 | 自动操作 |
|------------|----------|
| "我喜欢"、"记住"、"我的习惯" | 添加新经验 |
| "显示"、"列出"、"看看" | 列出经验 |
| "搜索"、"找"、"查询" | 搜索经验 |
| "详情"、"查看" | 查看经验详情 |
| "更新"、"改成"、"提高到" | 更新经验 |
| "删除"、"移除" | 删除经验 |
| "有效"、"不管用"、"反馈" | 提供反馈 |
| "统计"、"多少条" | 查看统计 |
| "打开"、"编辑" | 在 Obsidian 中打开 |
| "关联"、"创建链接" | 创建双向链接 |
| "遇到了"、"怎么"、"应该" | 应用经验 |

---

## 模糊匹配

如果描述不够明确，AI 会询问你确认：

```bash
用户：/openexp pnpm
AI：你想对 pnpm 做什么操作？
1. 添加关于 pnpm 的经验
2. 搜索 pnpm 相关的经验
3. 其他
```

---

## 配置

### Obsidian 配置

此技能支持两种使用方式：

**方式一：使用 storks-obsidian-mcp（推荐）**

在 MCP 客户端配置文件中添加：

```json
{
  "mcpServers": {
    "storks-obsidian-mcp": {
      "description": "通过 Obsidian CLI 访问 Obsidian vault 的 MCP 服务器",
      "command": "uv",
      "args": [
        "run",
        "--directory",
        "/path/to/storks-obsidian-mcp",
        "obsidian-mcp"
      ]
    }
  }
}
```

**方式二：直接使用 Obsidian CLI（无需 MCP 服务器）**

此技能内置了对 Obsidian CLI 的支持，可以直接调用 Obsidian CLI 命令来操作 vault。这种方式更轻量，无需配置额外的 MCP 服务器。

### 前置要求

**使用 storks-obsidian-mcp：**
1. Obsidian 桌面应用（版本 1.12+）需要运行
2. 安装 Python 和 uv
3. 克隆 storks-obsidian-mcp 仓库

**直接使用 Obsidian CLI：**
1. Obsidian 桌面应用（版本 1.12+）需要运行
2. Obsidian CLI 已安装（从 Obsidian 设置中安装）
3. Vault 路径：`~/Exp Vault`

---

## 存储结构

### 目录结构
```
~/Exp Vault/
├── Preferences/         # 用户偏好
├── Workflows/          # 工作流程
├── Solutions/          # 解决方案
├── Knowledge/          # 知识点
├── Conventions/        # 约定规范
└── Styles/             # 沟通风格
```

### 经验类型

| 类型 | 说明 | 目录 |
|------|------|------|
| `preference` | 用户偏好 | Preferences/ |
| `workflow` | 工作流程 | Workflows/ |
| `solution` | 解决方案 | Solutions/ |
| `knowledge` | 知识点 | Knowledge/ |
| `style` | 沟通风格 | Styles/ |
| `convention` | 约定规范 | Conventions/ |

---

## 标签系统

- `#experience` - 所有经验笔记
- `#preference` - 用户偏好
- `#workflow` - 工作流程
- `#solution` - 解决方案
- `#knowledge` - 知识点
- `#convention` - 约定规范
- `#style` - 沟通风格
- `#project:<name>` - 项目标签

---

## MCP 工具

Experience Skill 使用以下 MCP 工具与 Obsidian 交互：

| 工具 | 用途 |
|------|------|
| `create_note` | 创建新的经验笔记 |
| `read_note` | 读取单个经验笔记 |
| `read_multiple_notes` | 批量读取多个笔记 |
| `update_note` | 更新笔记内容或 frontmatter |
| `search_vault` | 全文搜索经验 |
| `list_notes` | 列出指定目录的笔记 |
| `delete_note` | 删除经验笔记 |
| `move_note` | 移动或重命名笔记 |
| `manage_folder` | 管理经验文件夹 |
| `auto_backlink_vault` | 自动生成双向链接 |
| `notes_insight` | AI 驱动的经验分析 |

---

## 注意事项

- ⚠️ 需要配置 Obsidian（MCP 服务器或直接使用 CLI）
- ⚠️ 不会捕获敏感信息（密码、密钥等）
- ⚠️ 低置信度的经验会被自动清理
- ⚠️ 过时的经验需要手动删除
- ✅ 支持两种访问方式：MCP 服务器或直接使用 Obsidian CLI
- ✅ 所有经验都可以在 Obsidian 中查看和管理
- ✅ 支持 Obsidian 的双向链接和标签功能
- ✅ 可以使用 Obsidian 的搜索和图谱功能
- ✅ 支持批量操作和高级分析
- ✅ 自然语言交互，无需记忆命令参数

---

## 相关文档

- [Skill 规范](../skills/openexp/SKILL.md)
- [Obsidian CLI Shell 脚本](../skills/openexp/scripts/obsidian-cli.sh)