# Experience Skill - Obsidian 集成说明

Experience Skill 已成功集成 Obsidian，所有经验数据存储在 `~/exp` Vault 中。

## 📁 目录结构

```
~/exp/
├── .obsidian/              # Obsidian 配置
├── Preferences/            # 用户偏好
├── Workflows/             # 工作流程
├── Solutions/             # 解决方案
├── Knowledge/             # 知识点
├── Conventions/           # 约定规范
└── Styles/                # 沟通风格
```

## 🔧 已配置

- ✅ Obsidian Vault 路径: `~/exp`
- ✅ 目录结构已创建
- ✅ 示例文件已创建: `Preferences/exp_example_preference.md`
- ✅ Obsidian MCP Server 配置示例已创建
- ✅ MCP 工具使用指南已创建

## 🚀 下一步：配置 Obsidian MCP

1. **安装 Obsidian REST API 插件**
   - 在 Obsidian 中启用 "Local REST API" 插件
   - 生成 API Token

2. **配置 MCP 服务器**
   - 复制 `mcp-config.example.json` 到你的 MCP 客户端配置
   - 替换 `your_api_token_here` 为你的实际 Token

3. **测试 MCP 连接**
   - 查看 [MCP-GUIDE.md](MCP-GUIDE.md) 了解详细使用方法

## 🎯 使用方法

### 通过命令行

```bash
# 查看所有经验
/exp list

# 搜索经验
/exp search "TypeScript"

# 添加新经验
/exp add preference "我喜欢用 pnpm"

# 打开 Obsidian 编辑
/exp open <filename>
```

### 通过 Obsidian 应用

1. 在 Obsidian 中打开 `~/exp` vault
2. 查看和编辑经验笔记
3. 使用双向链接关联相关经验
4. 使用标签分类和检索

## 📝 Markdown 格式

每个经验笔记包含：

- **Frontmatter**: 元数据（ID、类型、置信度等）
- **描述**: 经验的详细说明
- **上下文**: 场景、来源、时间
- **关联**: 双向链接到相关经验
- **反馈**: 用户反馈记录

## 🔗 双向链接

使用 `[[link]]` 语法关联相关经验：

```markdown
## 关联
- [[Workflows/exp_workflow_example]] - 相关工作流程
- [[Solutions/exp_solution_cors]] - 相关解决方案
```

## 🏷️ 标签系统

- `#experience` - 所有经验笔记
- `#preference` - 用户偏好
- `#workflow` - 工作流程
- `#solution` - 解决方案
- `#knowledge` - 知识点
- `#convention` - 约定规范
- `#style` - 沟通风格
- `#project:<name>` - 项目标签


## 🚀 快速开始

### 使用自然语言交互

只需要用自然语言描述你的需求：

```bash
# 添加经验
/exp 我喜欢用 pnpm
/exp 记住这个：项目使用 TypeScript strict mode

# 查看经验
/exp 显示所有经验
/exp 搜索 TypeScript 相关的经验

# 应用经验
/exp 遇到了 CORS 问题，有什么经验吗？
```

### 模糊匹配

如果描述不够明确，AI 会询问你确认：

```bash
用户：/exp pnpm
AI：你想对 pnpm 做什么操作？
1. 添加关于 pnpm 的经验
2. 搜索 pnpm 相关的经验
3. 其他
```- [Obsidian 文档](https://help.obsidian.md/)