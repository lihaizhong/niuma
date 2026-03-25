# OpenExp 版本历史

## 版本记录

- **v2.8** (2026-03-17)
  - 简化 obsidian-cli.sh：
    - 移除超时处理机制（本地应用访问速度快，无需超时）
    - 移除重试机制（简化代码逻辑）
    - 移除 `OBSIDIAN_TIMEOUT` 和 `OBSIDIAN_RETRIES` 环境变量
  - 更新 SKILL.md：
    - 移除"内置超时和重试机制"描述
    - 改为"简洁高效：本地应用访问速度快，无需复杂的重试机制"
  - 更新 reference/commands.md：
    - 移除已废弃的环境变量配置说明

- **v2.7** (2026-03-17)
  - 增强 Description 触发力度：
    - 使用更"pushy"的措辞
    - 明确列出强制触发场景
    - 添加"强制使用"关键词
  - 优化 SKILL.md 内容结构：
    - 核心原则添加"为什么"解释
    - 新增错误恢复指南章节
    - 说明 CLI 操作的三大好处
  - 精简所有模板文件：
    - solution-template.md: 50+ 行 → 25 行
    - experience-template.md: 50+ 行 → 25 行
    - workflow-template.md: 50+ 行 → 25 行
    - knowledge-template.md: 50+ 行 → 25 行
    - convention-template.md: 80+ 行 → 30 行
    - preference-template.md: 30+ 行 → 20 行

- **v2.6** (2026-03-17)
  - 优化 maintain-experience-vault.py：
    - 添加 argparse 命令行参数支持
    - 支持 `--vault-path` 指定 Vault 路径
    - 支持 `--dry-run` 预览模式
    - 支持 `--backup` 修改前备份
    - 优化更新逻辑，跳过无变化的文件
  - 优化 obsidian-cli.sh：
    - 添加超时处理（默认 30 秒，可通过 `OBSIDIAN_TIMEOUT` 配置）
    - 添加重试机制（默认 2 次，可通过 `OBSIDIAN_RETRIES` 配置）
    - 新增 `run_obsidian()` 统一执行函数
  - 精简所有模板 frontmatter：
    - 移除自动计算字段（impact_score, backlinks, referenced_weight 等）
    - 统一 ID 命名格式示例
    - 添加注释说明其他字段由脚本自动计算

- **v2.5** (2026-03-17)
  - 增强 Description，添加详细触发场景说明，提高触发准确率
  - 添加"主动应用经验"章节，指导模型主动查询和应用经验
  - 添加"快速示例"章节，提供端到端的工作流示例
  - 添加模板使用说明，在经验类型表格中关联对应模板
  - 添加"错误处理"章节，明确 CLI 失败时的处理流程
  - 精简 Frontmatter 字段说明，自动计算字段移到备注
  - 人性化约束规则，用"核心原则"替代命令式约束

- **v2.4** (2026-03-16)
  - 优化 token 效率，减少约 52% 的 token 消耗
  - 精简 SKILL.md，移除详细命令参考到 reference/commands.md
  - 删除 template-guide.md，内容已整合到 SKILL.md
  - 简化 impact-calculation.md，保留核心公式
  - 简化脚本注释（obsidian-cli.sh 和 maintain-experience-vault.py）
  - 移除 MCP 集成，只保留 CLI

- **v2.3** (2026-03-16)
  - 添加 CLI 操作约束
  - 优化为操作手册格式
  - 添加脚本使用说明

- **v2.2** (2026-03-15)
  - 优化文件格式规范，强制使用标准 YAML frontmatter
  - 添加文件命名规范：`exp_<type>_<timestamp>_<seq>.md`
  - 添加 Poetry 目录和隐藏目录过滤
  - 新增验证和清理部分
  - 优化维护脚本说明

- **v2.1** (2026-03-11)
  - 优化影响力计算，考虑使用频率、置信度和关联关系
  - 添加自动化维护脚本

- **v2.0** (2026-03-11)
  - 聚焦核心功能，简化文档结构
  - 移除冗余内容

- **v1.6** (2026-03-11)
  - 优化目录结构，将模板文件移至 `templates/` 目录

- **v1.5** (2026-03-11)
  - 新增经验索引地图，支持技巧、原则、模型关系展示

- **v1.4** (2026-03-11)
  - 拆分多种经验类型模板

- **v1.0** (2026-03-11)
  - 初始版本