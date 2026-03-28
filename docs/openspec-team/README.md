# OpenSpec 团队协作方案

> 针对 80+ 人团队、GitLab 环境、协调困难痛点的完整解决方案

## 快速导航

本文档分为两大部分：

| 部分                      | 内容             | 适合场景     |
| ------------------------- | ---------------- | ------------ |
| 📚 [实施指南](guide/)     | 7 章完整实施手册 | 按步骤实施   |
| 🎯 [方案对比](solutions/) | 三套方案详细对比 | 选择适合方案 |

---

## 实施指南 (Guide)

7 章完整实施手册，按顺序阅读：

| 章节                                                 | 内容                        | 预计时间 |
| ---------------------------------------------------- | --------------------------- | -------- |
| [01 - 问题分析](guide/01-problem-analysis.md)        | 三大挑战深度分析            | 15 分钟  |
| [02 - GitLab 配置](guide/02-gitlab-setup.md)         | Labels、MR 模板、Board 配置 | 1-2 小时 |
| [03 - 冲突检测](guide/03-conflict-detection.md)      | CI 自动化检测配置           | 1-2 小时 |
| [04 - Swagger 集成](guide/04-swagger-integration.md) | API 统一管理方案            | 2-4 小时 |
| [05 - 实施路线图](guide/05-roadmap.md)               | 渐进式推广计划              | 30 分钟  |
| [06 - 工具脚本](guide/06-scripts.md)                 | 可直接使用的脚本            | 1 小时   |
| [07 - 团队守则](guide/07-guidelines.md)              | 使用规范和最佳实践          | 20 分钟  |
| [08 - 常见问题](guide/08-faq.md)                     | FAQ 和问题解决              | 30 分钟  |
| [09 - 跨系统协作](guide/09-cross-system.md)          | 多系统 PRD 拆分与协作       | 20 分钟  |

**新团队建议**: 按顺序阅读 01 → 02 → 05，快速启动试点。

---

## 完整示例 (Examples)

从零到一的完整案例：

| 文档                                               | 内容                       | 适合场景 |
| -------------------------------------------------- | -------------------------- | -------- |
| [团队协作完整案例](examples/team-collaboration.md) | 20 人团队 3 个月实施全过程 | 实施参考 |

---

## 方案对比 (Solutions)

三套可选方案，根据需求选择：

| 方案                                                  | 特点                   | 实施成本 | 推荐度     |
| ----------------------------------------------------- | ---------------------- | -------- | ---------- |
| [方案一：GitLab 原生](solutions/solution-1-gitlab.md) | 零额外工具，快速上手   | 1-2 天   | ⭐⭐⭐⭐⭐ |
| [方案二：增强看板](solutions/solution-2-notion.md)    | Notion/Trello + 自动化 | 3-5 天   | ⭐⭐⭐⭐   |
| [方案三：实时协作](solutions/solution-3-realtime.md)  | WebSocket 实时同步     | 2-3 个月 | ⭐⭐⭐     |

**快速对比** → 查看 [方案总览](solutions/README.md)

---

## 核心理念

```
本地变更 ──▶ MR 创建 ──▶ 团队可见 ──▶ 自动协调
```

- **MR 即状态**: 创建 MR 即宣告"我在处理这个"
- **Label 即分类**: 通过标签快速识别变更类型和状态
- **Board 即看板**: 可视化所有 active changes
- **CI 即检测**: 自动发现潜在冲突

---

## 快速开始

### 今天可做（30 分钟）

1. [配置 GitLab Labels](guide/02-gitlab-setup.md#11-创建-label-体系)
2. [创建 MR 模板](guide/02-gitlab-setup.md#12-创建-mr-模板)
3. [创建 Board 视图](guide/02-gitlab-setup.md#13-创建-board-视图)

### 本周实施

1. [添加 CI 冲突检测](guide/03-conflict-detection.md)
2. [试点一个功能](guide/05-roadmap.md#第一阶段试点week-1-2)

---

## 适用场景

✅ **适合使用**:

- 使用 GitLab 进行代码托管
- 团队规模 10-100 人
- 定期发布 + 不定时发布
- 部分团队有 Code Review 习惯
- 后端服务各自维护 Swagger

❌ **不适用**:

- 需要实时协作编辑（考虑 CRDT 方案）
- 高频冲突需要自动合并（考虑 Weave 等工具）
- 已有完善的 API Gateway + Schema Registry

---

## 目录结构

```
docs/openspec-team/
├── README.md                           # 本文档（导航页）
├── guide/                              # 实施指南
│   ├── 01-problem-analysis.md         # 问题分析
│   ├── 02-gitlab-setup.md             # GitLab 配置
│   ├── 03-conflict-detection.md       # 冲突检测
│   ├── 04-swagger-integration.md      # Swagger 集成
│   ├── 05-roadmap.md                  # 实施路线图
│   ├── 06-scripts.md                  # 工具脚本
│   ├── 07-guidelines.md               # 团队守则
│   ├── 08-faq.md                      # 常见问题
│   └── 09-cross-system.md             # 跨系统协作
├── examples/                           # 完整示例
│   └── team-collaboration.md          # 团队协作案例
└── solutions/                          # 方案对比
    ├── README.md                       # 方案总览
    ├── solution-1-gitlab.md           # 方案一：GitLab 原生
    ├── solution-2-notion.md           # 方案二：增强看板
    └── solution-3-realtime.md         # 方案三：实时协作
```

---

## 下一步

**如果你刚接触这个方案**:

1. 阅读 [01 - 问题分析](guide/01-problem-analysis.md) 了解背景
2. 查看 [方案总览](solutions/README.md) 选择适合方案
3. 按 [05 - 实施路线图](guide/05-roadmap.md) 开始试点

**如果你准备实施**:

1. 直接跳到 [02 - GitLab 配置](guide/02-gitlab-setup.md) 开始配置
2. 复制 [06 - 工具脚本](guide/06-scripts.md) 中的代码
3. 制定推广计划
