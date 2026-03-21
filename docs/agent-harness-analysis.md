# Agent Harness 操作系统改造分析

> 基于 "Agent Harness：2026年AI架构师必须掌握的'操作系统级'技术，万字长文深度解析！" 文章分析

## 一、什么是 Harness 操作系统

### 1.1 核心定义

**LangChain 权威定义：**
> **Agent = Model + Harness**
> "If you're not the model, you're the harness."

Harness 是包裹 AI 模型的软件基础设施，负责管理其生命周期、上下文、以及与外部世界的交互。

### 1.2 系统类比

```
模型 = CPU（提供原始算力）
上下文窗口 = RAM（有限的易失性工作内存）
Agent Harness = 操作系统（管理上下文、提供驱动、调度资源）
Agent = 应用程序（运行业务逻辑）
```

没有操作系统，CPU 再强也无法运行应用。同理，没有 Harness，模型再智能也无法完成长期复杂任务。

### 1.3 六大核心组件

| 组件 | 功能 | 解决的核心问题 |
|------|------|---------------|
| **文件系统** | 持久化存储、工作空间 | 跨会话状态保持 |
| **Bash + 代码执行** | 通用问题解决器 | 自主工具创建 |
| **沙箱环境** | 安全执行保障 | 危险操作隔离 |
| **工具集成层** | 连接外部世界 | 能力扩展 |
| **内存与搜索** | 持续学习系统 | 知识积累 |
| **上下文工程** | 对抗 Context Rot | 长任务性能保持 |
| **验证与防护** | 确保正确性 | 自验证与错误恢复 |

### 1.4 与 Framework 的区别

| 维度 | Agent Framework | Agent Harness |
|------|------------------|---------------|
| **抽象层级** | 低层构建块 | 高层封装 |
| **定位** | 开发工具包（零件库） | 运行时系统（操作系统） |
| **特点** | 模块化、可组合、需自行组装 | 开箱即用、内置默认配置 |
| **代表产品** | LangChain、LlamaIndex | Claude Code、OpenAI Codex、DeepAgents |
| **用户** | 开发者 | Agent 本身 |

**比喻：**
- **Framework** 像是乐高积木，给你零件自己搭建
- **Harness** 像是成品玩具，拿来就能用

---

## 二、Harness 核心能力详解

### 2.1 文件系统

**核心价值：**
1. **工作空间** - Agent 可以读取数据、代码和文档
2. **上下文卸载** - 将中间结果和状态持久化，避免占用上下文窗口
3. **协作表面** - 多个 Agent 和人类可以通过共享文件协作

**典型 Harness 文件结构：**
```
project/
├── AGENTS.md      # Agent 指令文件（持续学习规则）
├── PLAN.md        # 任务计划
├── PROGRESS.json  # 进度追踪
├── src/           # 源代码
├── tests/         # 测试文件
└── .git/          # 版本控制
```

**AGENTS.md 模式：** 每当发现 Agent 失败模式，就添加一条规则。文件随时间增长，形成组织的 Agent 知识库。

### 2.2 Bash + 代码执行

**核心理念：** 与其为每个可能的动作预定义工具，不如给 Agent 一个通用工具——Bash。

**优势：**
- **自主性** - 模型可以按需编写并执行代码，自行设计工具
- **通用性** - 几乎可以完成任何任务
- **生态** - 可以调用现有 CLI 工具、脚本和程序

**安全要求：**
- 必须在沙箱环境中执行
- 实施命令白名单
- 网络隔离
- 资源限制（CPU、内存、时间）

### 2.3 沙箱环境

**解决的问题：** 在本地执行 Agent 生成的代码极其危险。一个恶意或错误的命令可能摧毁整个系统。

**沙箱的核心能力：**
- 隔离的代码执行环境
- 预装运行时（Python、Node.js 等）
- 预装工具链（git、测试框架、浏览器等）
- 按需创建和销毁
- 可扩展到大规模并行执行

**主流方案：**
- Docker 容器
- E2B 沙箱
- Modal Labs
- AWS Firecracker

### 2.4 上下文工程

**Context Rot 问题：** 随着工具调用和历史记录的累积，上下文窗口被填满，模型逐渐"忘记"原始指令。

**Harness 的三大策略：**

1. **压缩（Compaction）**
   - 将早期对话摘要为简短笔记
   - 保留关键决策和结果
   - 丢弃中间推理步骤

2. **工具输出卸载（Tool Call Offloading）**
   - 保留输出的头部和尾部（各 N 个 token）
   - 将完整输出写入文件系统
   - 仅在 Agent 需要时检索

3. **技能（Skills）：渐进式披露**
   - 初始阶段仅加载核心工具
   - 当 Agent 需要特定能力时动态加载对应 Skill
   - Skill 包含工具、提示词前缀和示例

### 2.5 验证与防护

**自验证循环：**
```python
def execute_with_verification(self, task: Task):
    # 1. Agent 执行
    result = self.agent.execute(task)
    # 2. 运行测试
    test_result = self.test_runner.run(task.test_suite)
    # 3. 验证失败则循环
    if not test_result.passed:
        error_msg = f"Tests failed: {test_result.errors}"
        self.context.inject(error_msg)
        return self.execute_with_verification(task)
    return result
```

**Ralph Loops：** 当 Agent 尝试退出时，Harness 拦截并在干净的上下文窗口中重新注入原始提示，强制 Agent 继续工作直到完成目标。

**Human-in-the-Loop：** 对于敏感操作（生产数据库写入、外部通信），Harness 应暂停并等待人类批准。

---

## 三、Niuma vs Harness 操作系统对比

### 3.1 能力矩阵

| 组件 | Harness 标准能力 | Niuma 当前状态 | 差距分析 |
|------|-----------------|---------------|---------|
| **文件系统** | PROGRESS.json、AGENTS.md 渐进规则 | MEMORY.md/HISTORY.md 双层记忆 | 🟡 部分实现 |
| **Bash/代码执行** | 沙箱隔离执行 | exec 工具+黑名单 | 🟡 有但不安全 |
| **沙箱环境** | Docker/E2B/Modal 隔离 | ❌ 完全缺失 | 🔴 重大缺失 |
| **工具集成** | 工具注册表+Skills 按需加载 | 基础工具注册表 | 🟡 待增强 |
| **内存系统** | 三层记忆+RAG | 双层记忆 | 🟡 待增强 |
| **上下文工程** | Compaction/卸载/渐进披露 | ❌ 缺失 | 🔴 重大缺失 |
| **验证机制** | 自验证循环+Ralph Loops | ❌ 缺失 | 🔴 重大缺失 |
| **Human-in-Loop** | 敏感操作审批 | ❌ 缺失 | 🔴 重大缺失 |
| **架构模式** | Initializer-Executor 分离 | 单代理模式 | 🟡 待升级 |
| **多代理协调** | 专业角色分工 | 基础 SubAgent | 🟡 待增强 |

### 3.2 详细差距分析

#### 🔴 重大缺失项

**1. 沙箱环境**
- Niuma: 直接在主机执行命令，危险命令黑名单不足以保证安全
- Harness: Docker/E2B 隔离执行，按需创建销毁

**2. 上下文压缩**
- Niuma: 固定 memoryWindow，无智能压缩
- Harness: Compaction、Tool Output Offloading、渐进披露

**3. 自验证循环**
- Niuma: 无测试驱动验证
- Harness: 任务执行后自动运行测试，失败重试

**4. Human-in-the-Loop**
- Niuma: 无审批机制
- Harness: 敏感操作暂停等待批准

#### 🟡 待增强项

**1. 任务进度追踪**
- Niuma: 会话管理，无任务队列
- Harness: PROGRESS.json 持久化任务状态

**2. 渐进规则学习**
- Niuma: 无失败规则积累
- Harness: AGENTS.md 从失败中学习

**3. 架构模式**
- Niuma: 单代理循环模式
- Harness: Initializer-Executor 分离模式

---

## 四、Harness 操作系统改造开发计划

### Phase 1: 核心基础设施（P0-P1）

#### 1.1 沙箱执行环境

**目标:** 实现隔离的代码执行环境

**技术方案:**
- Docker API 集成
- 备选: E2B/Modal Labs SDK

**工作流程:**
1. 按需创建沙箱容器
2. 预装运行时 (Python, Node.js, Git)
3. 工具调用拦截与转发
4. 执行后清理

**文件结构:**
```
niuma/agent/sandbox/
├── manager.ts      # 沙箱生命周期管理
├── container.ts    # Docker 容器封装
└── interceptor.ts   # 工具调用拦截器
```

#### 1.2 自验证循环

**目标:** 测试驱动确保正确性

**流程:**
1. Agent 执行任务
2. 运行测试套件
3. 验证失败 → 注入错误 → 重新执行
4. 最多重试 N 次

#### 1.3 任务进度追踪系统

**目标:** 支持长周期任务的持久化

**实现:**
- PROGRESS.json 格式
- 任务队列管理
- 断点续执行

**数据结构:**
```json
{
  "project": "项目名",
  "tasks": [
    {"id": 1, "name": "任务", "status": "pending|in_progress|completed"}
  ],
  "current": 0,
  "completed": []
}
```

#### 1.4 AGENTS.md 渐进规则系统

**目标:** 从失败中学习，积累规则

**机制:**
- 每次 Agent 失败后，添加规则到 AGENTS.md
- 规则格式:
  ```
  ## Rules (accumulated from failures)
  1. Always run tests after writing code
  2. Use JSON for state files, not Markdown
  ```

### Phase 2: 上下文工程（P2）

#### 2.1 上下文压缩机制

**目标:** 对抗 Context Rot

**触发条件:** 上下文 > 80% 阈值

**策略:**
1. **Compaction** - 历史摘要
2. **Tool Call Offloading** - 大输出卸载
3. **渐进式披露** - Skills 按需加载

#### 2.2 Human-in-the-Loop

**目标:** 敏感操作审批

**敏感操作:**
- 数据库写操作
- 外部网络请求
- 生产环境部署
- 文件删除

**机制:**
- 暂停执行
- 请求人类批准
- 超时取消

#### 2.3 Ralph Loops

**目标:** 长周期任务持续工作

**机制:**
- Agent 尝试退出时拦截
- 在新鲜上下文中重新注入原始提示
- 强制继续直到完成

### Phase 3: 架构升级（P3）

#### 3.1 Initializer-Executor 模式

**Initializer (运行一次):**
- 创建目录结构
- 初始化配置文件
- 初始 Git 提交

**Executor (多次运行):**
- 读取进度状态
- 执行单个任务
- 测试验证
- Git 提交更新

#### 3.2 多代理协调增强

**架构:**
```
├── Orchestrator  (总调度)
├── Researcher    (研究代理)
├── Coder         (编码代理)
├── Reviewer      (审核代理)
└── Tester        (测试代理)
```

**机制:**
- 任务分派
- 上下文交接
- 结果汇总

---

## 五、优先级与时间估算

| 优先级 | 功能 | 复杂度 | 影响 |
|--------|------|--------|------|
| P0 | 沙箱执行环境 | 高 | 安全性 |
| P0 | 自验证循环 | 中 | 可靠性 |
| P1 | PROGRESS.json 任务追踪 | 低 | 长期任务支持 |
| P1 | AGENTS.md 渐进规则 | 低 | 智能学习 |
| P1 | Human-in-Loop | 中 | 安全性 |
| P2 | 上下文压缩 | 高 | 长任务性能 |
| P2 | 工具输出卸载 | 中 | 上下文优化 |
| P2 | Ralph Loops | 中 | 长任务可靠性 |
| P3 | Initializer-Executor | 高 | 架构升级 |
| P3 | 多代理协调增强 | 高 | 复杂任务支持 |

---

## 六、参考资源

### 权威来源

- [LangChain - The Anatomy of an Agent Harness](https://blog.langchain.com/the-anatomy-of-an-agent-harness/)
- [OpenAI - Harness Engineering](https://openai.com)
- [Harness Engineering Academy](https://harnessengineering.academy)

### 工具生态

- **Framework 层:** LangChain、LlamaIndex、Microsoft Semantic Kernel、CrewAI
- **Harness 层:** Claude Agent SDK、OpenAI Agents SDK、LangChain DeepAgents
- **工具集成:** Firecrawl（Web 数据）、E2B（沙箱）、MCP Servers

---

## 七、总结

**Harness Engineering 的本质：** 我们不再编写确定性的程序，而是设计围绕非确定性智能体的系统。

**核心公式：**
```
Agent = Model + Harness
Harness Engineering = 将失败转化为系统规则
```

**2026年趋势：**
- 从 Prompt Engineering 到 Harness Engineering
- 模型是商品，Harness 是护城河
- 构建优秀 Harness 的团队将保持优势

---

*文档生成日期: 2026-03-21*
*基于文章: "Agent Harness：2026年AI架构师必须掌握的'操作系统级'技术，万字长文深度解析！"*
