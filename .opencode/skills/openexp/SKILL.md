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
  version: "3.0"
  tags: [learning, memory, experience, knowledge-base]
---

# 经验管理技能

从用户交互中学习和积累经验，建立经验库，并在未来的对话中应用这些经验以提供更智能、更个性化的响应。

## 触发条件

**用户明确请求以下内容时触发：**

- 表达偏好："我喜欢用 pnpm"、"我习惯使用..."
- 遇到问题寻求经验："遇到过 CORS 问题吗？有什么经验？"
- 查找特定经验："搜索关于 TypeScript 的经验"
- 管理经验："这个经验很有效"、"查看经验库状态"
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
# 1. 查找 openexp CLI
OPENEXP=$(find . -name "openexp.sh" -path "*/skills/openexp/*" 2>/dev/null | head -1)

# 2. 添加偏好经验
$OPENEXP add preference "用户明确表示喜欢使用 pnpm 而非 npm 作为包管理器。在项目中优先使用 pnpm install、pnpm add 等命令。"

# 3. 告知用户
"已记录您的偏好到经验库。"
```

**场景：** 开始新任务前主动查询

```bash
# 搜索相关经验
$OPENEXP search "preference"
$OPENEXP search "convention"

# 根据结果应用已知的偏好和约定
```

## 脚本路径自动查找

脚本位置不固定，使用通配符动态查找：

```bash
# 动态查找 openexp.sh
OPENEXP=$(find . -name "openexp.sh" -path "*/skills/openexp/*" -type f 2>/dev/null | head -1)

# 后续使用 $OPENEXP 调用
```

## 命令参考

使用统一的 `openexp` CLI：

| 命令 | 说明 | 示例 |
|------|------|------|
| `search <query>` | 搜索经验 | `search pnpm` |
| `add <type> <content>` | 添加经验 | `add preference "内容"` |
| `bump <id>` | 使用计数 +1 | `bump exp_preference_xxx` |
| `feedback <id> <vote>` | 反馈 | `feedback exp_xxx useful` |
| `get <id>` | 获取详情 | `get exp_xxx` |
| `update <id> <content>` | 更新内容 | `update exp_xxx "新内容"` |
| `status` | 查看状态 | `status` |
| `list [type]` | 列出经验 | `list preference` |
| `snapshot [msg]` | 创建快照 | `snapshot "备份"` |
| `snapshots` | 列出快照 | `snapshots` |

### 经验类型

| 类型 | 说明 |
|------|------|
| `preference` | 用户偏好、设置和习惯 |
| `workflow` | 固定的操作步骤和流程 |
| `solution` | 问题和解决方案 |
| `knowledge` | 技术概念、API、工具等知识 |
| `experience` | 完整的问题解决过程 |
| `convention` | 命名、格式、结构等规则 |

### 完整用法

```bash
# 搜索
openexp search "关键词"

# 添加经验
openexp add preference "用户偏好：使用 pnpm"
openexp add solution "CORS 问题解决方案"
openexp add workflow "部署流程"

# 使用后更新计数
openexp bump exp_preference_xxx

# 用户反馈
openexp feedback exp_solution_xxx useful
openexp feedback exp_xxx useless

# 获取详情
openexp get exp_xxx

# 更新内容
openexp update exp_xxx "更新后的内容"

# 查看状态
openexp status

# 列出经验
openexp list                    # 列出所有
openexp list preference          # 只列出偏好

# Git 版本控制
openexp snapshot "添加新经验"     # 创建快照
openexp snapshots                # 列出快照
openexp git log                 # 查看历史

# 直接 git 操作
openexp git branch experiment_xxx
openexp git checkout experiment_xxx
openexp git merge experiment_xxx
```

## 操作流程

1. **任务开始**：执行 `openexp search <关键词>`，加载相关经验
2. **记录新经验**：执行 `openexp add <类型> <内容>`
3. **使用后**：执行 `openexp bump <id>` 增加使用计数
4. **用户反馈**：执行 `openexp feedback <id> useful/useless`
5. **定期维护**：执行 `openexp snapshot "备份"` 创建快照

## 文件规范

### 文件命名

**格式：** `exp_<type>_<YYYYMMDD>_<HHMMSS>_<seq>.md`

### Frontmatter 结构

```yaml
---
id: exp_preference_20260322_143052_001
type: preference
tags: []
created: 2026-03-22T14:30:52+08:00
updated: 2026-03-22T14:30:52+08:00
usage_count: 0
confidence: 0.8
impact_score: 0
---
```

### 字段说明

| 字段 | 说明 | 自动更新 |
|------|------|----------|
| `id` | 唯一标识 | 创建时生成 |
| `type` | 经验类型 | 创建时指定 |
| `tags` | 标签 | 手动维护 |
| `usage_count` | 使用次数 | `bump` 命令更新 |
| `confidence` | 置信度 | `feedback` 命令更新 |
| `impact_score` | 影响力 | 定期计算 |

## 核心原则

### 通过 CLI 操作
所有经验库操作必须通过 `openexp` CLI 完成：
- **可追溯**：操作记录在 Git 历史中
- **格式一致**：自动填充 frontmatter
- **确定性**：机器可读的输出格式

### Git 版本控制
每个经验库都是一个 Git 仓库：
- `snapshot` 命令创建带标签的快照
- 支持分支进行实验性操作
- 可随时回滚到任意快照

### 敏感信息保护
不要记录密码、API 密钥、token 等敏感信息。

### 质量优先于数量
只记录与实际任务相关的经验。

## 影响力计算

**公式：** `impact_score = usage_count × 5 + confidence × 50`

> 详细说明：见 reference/impact-calculation.md

## 注意事项

1. **新经验有 30 天保护期**，不会被识别为低影响力
2. **定期执行 `openexp snapshot`** 保存快照
3. **Vault 路径**：可通过 `OPENEXP_VAULT` 环境变量自定义

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `OPENEXP_VAULT` | `~/Exp Vault` | Vault 路径 |
| `OPENEXP_SILENT` | `false` | 静默模式 |
