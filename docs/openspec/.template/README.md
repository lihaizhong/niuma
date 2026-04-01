# OpenSpec 项目模板

本目录包含一个完整的 OpenSpec Harness 配置模板，可直接复制到新项目中使用。

## 模板结构

```
.template/
├── openspec/
│   ├── config.yaml              # 项目主配置
│   └── schemas/
│       ├── spec-driven/         # 新功能开发工作流
│       │   ├── schema.yaml
│       │   └── templates/
│       │       ├── proposal.md
│       │       ├── specs/spec.md
│       │       ├── design.md
│       │       └── tasks.md
│       ├── bugfix/              # Bug 修复工作流
│       │   ├── schema.yaml
│       │   └── templates/
│       │       ├── bug-report.md
│       │       ├── fix.md
│       │       └── regression-test.md
│       └── spike/               # 技术调研工作流
│           ├── schema.yaml
│           └── templates/
│               ├── research-question.md
│               ├── exploration-log.md
│               └── decision.md
├── custom/                      # AI 助手配置模板（安装时根据工具替换）
│   ├── commands/                # 斜杠命令定义
│   │   ├── opsx-explore.md
│   │   ├── opsx-spike.md
│   │   ├── opsx-propose.md
│   │   ├── opsx-bugfix.md
│   │   ├── opsx-apply.md
│   │   └── opsx-archive.md
│   └── skills/                  # 技能定义
│       ├── openspec-explore/
│       ├── openspec-spike/
│       ├── openspec-propose/
│       ├── openspec-bugfix/
│       ├── openspec-apply-change/
│       └── openspec-archive-change/
└── AGENTS.md                    # AI 行为指南
```

**注意**：`custom/` 目录是 AI 助手配置模板，安装时会根据你使用的 AI 工具（OpenCode、Claude Code、Cursor 等）复制到对应的配置目录。


## 使用方法

### 1. 复制模板

```bash
# 复制完整的模板目录到项目根目录
cp -r docs/openspec/.template/openspec ./
cp -r docs/openspec/.template/custom ./
cp docs/openspec/.template/AGENTS.md ./
```

安装时，AI 助手会将 `custom/` 目录内容复制到具体的 AI 工具配置目录：

| AI 工具       | 目标目录        |
|--------------|----------------|
| OpenCode     | `.opencode/`   |
| Claude Code  | `.claude/`     |
| Cursor       | `.cursor/`     |
| GitHub Copilot | `.github/copilot/` |
| 其他工具      | 按工具文档配置  |

### 2. 编辑配置文件

根据你的项目情况，编辑以下文件中的占位符（如 PROJECT_NAME, PACKAGE_MANAGER 等）：

- `openspec/config.yaml` - 项目配置
- `AGENTS.md` - AI 行为指南
- `custom/commands/*.md` - AI 命令定义（可选，根据需要修改）
- `custom/skills/*/SKILL.md` - AI 技能定义（可选，根据需要修改）

### 3. 验证配置

```bash
openspec validate
```

## 占位符说明

模板中使用以下占位符，需要替换为实际值：

| 占位符              | 说明         | 示例                     |
| ------------------- | ------------ | ------------------------ |
| PROJECT_NAME        | 项目名称     | MyApp                    |
| PROJECT_DESCRIPTION | 项目描述     | A web application for... |
| LANGUAGE            | 编程语言     | TypeScript               |
| RUNTIME             | 运行时       | Node.js >=22.0.0         |
| PACKAGE_MANAGER     | 包管理器     | pnpm                     |
| TEST_FRAMEWORK      | 测试框架     | vitest                   |
| WEB_FRAMEWORK       | Web 框架     | Next.js 15               |
| UI_FRAMEWORK        | UI 框架      | React 19 + Tailwind CSS  |
| MODULE_NAME         | 模块名称     | src, lib                 |
| MODULE_PURPOSE      | 模块用途     | Core implementation      |
| MODULE_SCOPE        | 模块范围     | Business logic           |
| MODULE_TESTS_PATH   | 模块测试路径 | src/tests/               |
| TEST_DIR            | 测试目录     | src/tests/               |
| SRC_DIR             | 源码目录     | src/                     |
| AI_CONFIG_DIR       | AI 配置目录  | .opencode / .claude / .cursor |

## 文件说明

### openspec/config.yaml

项目主配置文件，定义：

- 默认 schema
- 技术栈信息
- 项目模块结构
- 开发约定
- 常用命令

### openspec/schemas/\*/schema.yaml

工作流定义文件，描述：

- 工作流的 artifacts（产物）
- 依赖关系
- 验证规则

### openspec/schemas/\_/templates/\_.md

Markdown 模板文件，用于生成各阶段文档。

### AGENTS.md

AI 助手行为指南，定义角色、工作流程和约束。

### custom/

AI 助手配置目录模板，包含命令定义和技能定义。安装时会根据使用的 AI 工具复制到对应目录：

- **OpenCode** → `.opencode/`
- **Claude Code** → `.claude/`
- **Cursor** → `.cursor/`
- **其他 AI 工具** → 按相应文档配置路径

#### custom/commands/

斜杠命令定义文件（如 `opsx-propose.md`），描述命令的用途和基本流程。

#### custom/skills/

技能定义目录，包含 AI 执行命令的具体逻辑（如 `openspec-propose/SKILL.md`）。

## 快速开始

1. 复制模板
2. 搜索并替换所有占位符
3. 运行 `openspec validate` 验证配置
4. 开始创建你的第一个变更：
   ```bash
   openspec schema init my-change --artifacts "proposal,specs,design,tasks"
   ```
