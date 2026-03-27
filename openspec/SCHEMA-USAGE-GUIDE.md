# OpenSpec 多 Schema 使用指南

## 概述

本项目现在支持三种工作流 schema：

```
openspec/schemas/
├── spec-driven.yaml   # 新功能开发（已存在）
├── bugfix.yaml        # Bug 修复（已创建）
└── spike.yaml         # 技术调研（可选添加）
```

## Schema 选择决策树

```
用户请求
   │
   ├─ "有个 bug / 报错了 / 出问题了"
   │     → 使用 bugfix schema
   │     → 命令: /opsx-bugfix <bug-id>
   │
   ├─ "想加功能 / 要实现 / 新增"
   │     → 使用 spec-driven schema
   │     → 命令: /opsx-propose <feature-name>
   │
   ├─ "不确定 / 能不能 / 是否可行"
   │     → 使用 spike schema
   │     → 命令: /opsx-spike <question>
   │
   └─ "思考 / 讨论 / 看看"
         → 使用 explore mode
         → 命令: /opsx-explore
```

## 详细使用指南

### 1. Bugfix Schema

**适用场景**：

- 生产环境问题
- 功能异常
- 用户反馈的缺陷
- 测试失败的修复

**工作流程**：

```bash
# 1. 启动 bugfix 流程
/opsx-bugfix login-button-error

# 2. AI 引导填写 bug-report.md
#    - Symptom: 登录按钮点击无响应
#    - Steps_to_Reproduce: 1. 访问首页 2. 点击登录...
#    - Expected_Behavior: 弹出登录框
#    - Actual_Behavior: 无反应，控制台报错
#    - Environment: Chrome 120, macOS

# 3. 复现验证
#    - 创建最小复现环境
#    - 确认问题存在

# 4. 修复实现
#    - 定位根因
#    - 编写回归测试
#    - 实现最小修复

# 5. 验证关闭
#    - 运行所有测试
#    - 合并后自动归档
```

**关键原则**：

- ✅ 必须有回归测试
- ✅ 改变最小化（只修 bug，不重构）
- ✅ 记录根因（用于后续流程改进）
- ⚡ P0 级别支持 hotfix 快速通道

---

### 2. Spec-Driven Schema

**适用场景**：

- 新功能开发
- 大型重构
- 架构升级
- 需要完整设计的改动

**工作流程**：

```bash
# 1. 探索需求（可选）
/opsx-explore

# 2. 创建提案
/opsx-propose add-user-auth
# 产出: proposal.md, design.md, specs/, tasks.md

# 3. 实现任务
/opsx-apply
# 遵循: Red → Green → Refactor

# 4. 验证归档
# pre-commit 自动验证
# post-merge 自动归档
```

**关键原则**：

- ✅ TDD 循环（Red→Green→Refactor）
- ✅ 先写测试，后写实现
- ✅ 完整的设计文档
- ✅ 可验证的任务列表

---

### 3. Spike Schema（未来添加）

**适用场景**：

- 技术可行性验证
- 方案对比
- 性能基准测试
- 新技术调研

**工作流程**：

```bash
# 1. 启动调研
/opsx-spike "WebRTC 实时协作可行性"

# 2. 明确问题
#    - 需要回答什么？
#    - 成功标准是什么？

# 3. 快速探索
#    - 原型验证
#    - 收集证据

# 4. 得出结论
#    - 可行 → 转为 spec-driven 正式开发
#    - 不可行 → 记录原因，寻找替代方案
```

**关键原则**：

- ✅ 有时间盒（比如 4 小时）
- ✅ 明确成功标准
- ✅ 记录所有发现
- ✅ 快速失败也可以接受

---

## 命令对照表

| 意图     | 命令                     | Schema      | 产出                               |
| -------- | ------------------------ | ----------- | ---------------------------------- |
| 修复 bug | `/opsx-bugfix <id>`      | bugfix      | bug-report.md, fix.md              |
| 新功能   | `/opsx-propose <name>`   | spec-driven | proposal, design, specs, tasks     |
| 技术调研 | `/opsx-spike <question>` | spike       | question, findings, recommendation |
| 自由探索 | `/opsx-explore`          | -           | 无固定产出                         |
| 实施任务 | `/opsx-apply`            | 当前激活的  | 代码实现                           |

## 目录结构

```
openspec/
├── schemas/                    # 工作流定义
│   ├── spec-driven.yaml
│   ├── bugfix.yaml
│   └── spike.yaml
│
├── changes/                    # spec-driven 变更
│   ├── my-feature/
│   │   ├── .openspec.yaml
│   │   ├── proposal.md
│   │   ├── design.md
│   │   ├── specs/
│   │   └── tasks.md
│   └── archive/
│
├── bugs/                       # bugfix 记录
│   ├── 2024-001-login-error/
│   │   ├── .openspec.yaml
│   │   ├── bug-report.md
│   │   ├── fix.md
│   │   └── regression.test.ts
│   └── archive/
│
├── spikes/                     # 技术调研
│   ├── 2024-webrtc-collab/
│   │   ├── .openspec.yaml
│   │   ├── question.md
│   │   ├── findings.md
│   │   └── prototype/
│   └── archive/
│
├── config.yaml                 # 项目基础配置
└── specs/                      # 主规格库
    └── user-auth/
        └── spec.md
```

## 实际场景示例

### 场景 1：用户反馈登录问题

```
用户：用户说登录按钮点不动

AI：这是一个 bug，我来启动 bugfix 流程。
     /opsx-bugfix login-button-unresponsive

[创建 bug-report.md，记录现象、复现步骤、环境]

AI：请确认一下复现步骤：
     1. 访问首页
     2. 点击右上角登录按钮
     3. 预期弹出登录框，实际无反应

     是在 Chrome 上复现的吗？

用户：是的，Chrome 120

AI：好的，我来定位问题...
     [修复实现]

     已修复！根因是事件监听器的 this 绑定问题。
     添加了回归测试，确保不会再次出现问题。
```

### 场景 2：想添加新功能

```
用户：我想加个暗黑模式

AI：这是一个新功能，我来创建 spec-driven 提案。
     /opsx-propose add-dark-mode

[创建完整的 proposal → design → specs → tasks]

AI：提案已创建！包含：
     - 技术方案（CSS 变量 + 主题切换）
     - 设计决策（跟随系统 vs 手动切换）
     - 实现任务列表（Red→Green→Refactor）

     查看 openspec/changes/add-dark-mode/

     准备好后运行 /opsx-apply 开始实现。
```

### 场景 3：不确定技术方案

```
用户：我们的应用能不能用 WebRTC 做实时协作？

AI：这是个技术可行性问题，我来启动 spike 调研。
     /opsx-spike webrtc-realtime-collab

[创建调研计划，设定 4 小时时间盒]

AI：我会在 4 小时内验证：
     1. WebRTC 在我们的技术栈中的集成难度
     2. 信令服务器的实现方案
     3. 数据同步的基本可行性

     调研完成后给出明确建议：
     - 可行 → 转为正式项目
     - 不可行 → 推荐替代方案（如 SSE、轮询）
```

## 最佳实践

### 1. 不要混用 Schema

❌ 错误：

```
用户：有个 bug
AI：我们先用 spec-driven 设计一下...
```

✅ 正确：

```
用户：有个 bug
AI：启动 bugfix 流程，快速定位修复
```

### 2. Schema 可以升级

```
Spike 验证可行 → 转为 Spec-Driven 正式开发
Bugfix 发现需要重构 → 转为 Spec-Driven 规划设计
```

### 3. 紧急情况处理

```
P0 (Critical): System down
   → Hotfix 通道（绕过流程，事后补文档）

P1 (High): Core feature broken
   → Bugfix schema，跳过设计评审

P2/P3: Normal bug
   → 完整 bugfix 流程
```

## 下一步行动

1. **添加技能文件**：创建 `.opencode/skills/openspec-bugfix/SKILL.md`
2. **配置命令**：在 `.opencode/config.yaml` 中添加 `/opsx-bugfix` 命令
3. **创建示例**：先用一个真实 bug 测试 bugfix 流程
4. **培训团队**：分享此文档，确保团队理解不同 schema 的用途
