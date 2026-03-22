# AI 编程模型方案规划

> 基于 GLM-5、Kimi K2.5、MiniMax M2.7、MiniMax M2.5 四模型的 Agent 与 Category 映射方案。

## 模型能力概览

| 模型 | 核心优势 | 推荐用途 |
|------|----------|----------|
| **GLM-5** | 推理最强（AIME 92.7%）、长程一致性佳 | 复杂推理任务 |
| **Kimi K2.5** | Agent Swarm 原生支持、256K 最长上下文 | 任务调度、多模态 |
| **MiniMax M2.7** | M2.5 增强版，更聪明 | 复杂编码任务 |
| **MiniMax M2.5** | 工具调用 BFCL 第一、速度快、成本低 | 常规编码、快速任务 |

## OpenCode Go 额度（$10/月 ≈ ¥70）

| 模型 | 每月额度 | 特点 |
|------|----------|------|
| GLM-5 | 5,750 次 | 推理最强 |
| Kimi K2.5 | 9,250 次 | 调度最强 |
| M2.7 | 70,000 次 | 复杂任务 |
| M2.5 | 100,000 次 | 快速任务 |

---

## Agent 映射方案

oh-my-opencode 的 Agent 是实际执行工作的角色，映射如下：

| Agent | 职责 | 推荐模型 | 原因 |
|-------|------|----------|------|
| **Sisyphus** | 主控编排 | Kimi K2.5 | Agent Swarm 原生支持，并行调度能力最强 |
| **Prometheus** | 战略规划（访谈）| GLM-5 | 深度推理，处理复杂访谈和计划制定 |
| **Atlas** | Todo 编排执行 | Kimi K2.5 | Agent Swarm 并行任务分发 |
| **Oracle** | 架构咨询 | GLM-5 | 架构决策需要强推理能力 |
| **Explore** | 快速代码检索 | M2.5 | 检索任务成本低、速度快即可 |
| **Librarian** | 文档/代码搜索 | M2.5 | 搜索任务，M2.5 工具调用 BFCL 第一 |
| **Multimodal Looker** | 视觉/截图分析 | Kimi K2.5 | 256K 最长上下文，多模态能力强 |

### Agent 配置

```jsonc
{
  "agents": {
    "sisyphus": { 
      "model": "opencode-go/kimi-k2.5",
      "ultrawork": { "model": "opencode-go/kimi-k2.5" }
    },
    "prometheus": { "model": "opencode-go/glm-5" },
    "atlas": { "model": "opencode-go/kimi-k2.5" },
    "oracle": { "model": "opencode-go/glm-5" },
    "explore": { "model": "opencode-go/minimax-m2.5" },
    "librarian": { "model": "opencode-go/minimax-m2.5" },
    "multimodal-looker": { "model": "opencode-go/kimi-k2.5" }
  }
}
```

---

## Category 映射方案

Category 是 Sisyphus 调度子任务时的路由标签：

| Category | 用途 | 推荐模型 | 原因 |
|----------|------|----------|------|
| **ultrabrain** | 复杂推理、架构设计 | GLM-5 | AIME 92.7% 推理最强 |
| **deep** | 深度编码、多文件重构 | M2.7 | 更聪明，适合复杂任务 |
| **quick** | 快速修改、简单任务 | M2.5 | 速度快、成本低 |
| **visual-engineering** | 前端/UI/视觉任务 | Kimi K2.5 | 多模态能力强 |
| **unspecified-high** | 通用高难度任务 | M2.7 | 综合能力强 |

### Category 配置

```jsonc
{
  "categories": {
    "ultrabrain": { "model": "opencode-go/glm-5" },
    "deep": { "model": "opencode-go/minimax-m2.7" },
    "quick": { "model": "opencode-go/minimax-m2.5" },
    "visual-engineering": { "model": "opencode-go/kimi-k2.5" },
    "unspecified-high": { "model": "opencode-go/minimax-m2.7" }
  }
}
```

---

## 完整工作流程

```
用户请求
    ↓
[Intent Gate] — 分类用户意图
    ↓
[Sisyphus] — Kimi K2.5 编排调度
    ↓
    ├─→ [Prometheus] — GLM-5 战略规划
    ├─→ [Atlas] — Kimi K2.5 执行编排
    ├─→ [Oracle] — GLM-5 架构咨询
    ├─→ [Explore] — M2.5 快速检索
    ├─→ [Librarian] — M2.5 文档搜索
    └─→ [Category 路由]
              ├─→ ultrabrain → GLM-5
              ├─→ deep → M2.7
              ├─→ quick → M2.5
              └─→ visual-engineering → Kimi K2.5
```

---

## 核心原则

| 模型 | 核心定位 |
|------|----------|
| **GLM-5** | 推理型任务（Prometheus、Oracle、ultrabrain）|
| **Kimi K2.5** | 调度型任务（Sisyphus、Atlas、visual-engineering）|
| **MiniMax M2.7** | 复杂执行型任务（deep、unspecified-high）|
| **MiniMax M2.5** | 快速执行型任务（Explore、Librarian、quick）|

---

## 完整配置示例

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/oh-my-opencode.schema.json",
  
  "agents": {
    "sisyphus": { 
      "model": "opencode-go/kimi-k2.5",
      "ultrawork": { "model": "opencode-go/kimi-k2.5" }
    },
    "prometheus": { "model": "opencode-go/glm-5" },
    "atlas": { "model": "opencode-go/kimi-k2.5" },
    "oracle": { "model": "opencode-go/glm-5" },
    "explore": { "model": "opencode-go/minimax-m2.5" },
    "librarian": { "model": "opencode-go/minimax-m2.5" },
    "multimodal-looker": { "model": "opencode-go/kimi-k2.5" }
  },
  "categories": {
    "ultrabrain": { "model": "opencode-go/glm-5" },
    "deep": { "model": "opencode-go/minimax-m2.7" },
    "quick": { "model": "opencode-go/minimax-m2.5" },
    "visual-engineering": { "model": "opencode-go/kimi-k2.5" },
    "unspecified-high": { "model": "opencode-go/minimax-m2.7" }
  }
}
```

---

> 最后更新：2026-03-22
