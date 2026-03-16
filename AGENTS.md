# Niuma（牛马）- AI 助手行为指南

## 项目概述

企业级多角色 AI 助手系统，支持独立配置、工作区、会话和记忆。

**技术栈、架构、开发规范详见 `openspec/config.yaml`**

## 行为指导

### 经验管理

**积累时机：** 解决问题、学习新知识、发现重要信息时主动提示用户

**利用策略：**
- 任务启动前：`/openexp [关键词]` 查询相关经验
- 遇到问题时：优先使用高影响力解决方案
- 用户偏好：自动应用已知的工具和编码偏好
- 反馈机制：`/openexp 这个经验很有效/不管用：[ID]`
- 维护：每周运行 `python3 scripts/maintain-experience-vault.py`

**查询时机：** 任务启动、问题解决、决策制定、最佳实践询问、代码审查

## 工作流约束

### 1. fullstack skill 使用策略

**适用场景（复杂任务）：**
- API 设计和文档生成（5+ 端点）
- 复杂架构设计（多模块、微服务）
- 多组件集成（前后端协作）
- 需要标准化输出

**触发方式：** `/opsx:apply` 或 `/opsx:propose`

**不适用场景（简单任务）：**
- 简单代码审查（< 100 行）
- 小型功能开发（< 200 行）
- 快速原型验证
- Bug 修复
- 性能敏感任务

**直接使用 subagent：**
- 代码审查 → `code-reviewer`
- 简单开发 → `general-purpose`

### 2. OpenSpec CLI 强制要求

- 禁止手动文件操作 `openspec/` 目录
- 必须使用 `openspec` 命令完成相关操作
- 严禁修改 `.iflow/` 目录（除非用户明确说明）

**工作流：** `/opsx:explore` → `/opsx:propose` → `/opsx:apply` → `/opsx:archive`

**归档保护：** `openspec/changes/archive/` 不可修改

### 3. Subagent 优先级

| 任务类型 | Subagent |
|---------|----------|
| 规划分析 | plan-agent |
| 代码探索 | explore-agent |
| 代码审查 | code-reviewer |
| 前端测试 | frontend-tester |
| 深度研究 | search-specialist |
| 复杂任务 | general-purpose |
| 翻译任务 | translate |
| 教程生成 | tutorial-engineer |

## 配置系统

**详见 `openspec/config.yaml`**

## 相关资源

- [变更日志](CHANGELOG.md)
- [开发计划](docs/niuma-development-plan.md)
- [nanobot 参考](https://github.com/HKUDS/nanobot)

---

> 本文件由 iFlow CLI 维护，用于为 AI 助手提供项目上下文。