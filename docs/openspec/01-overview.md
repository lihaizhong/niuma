# 01 - 系统概览

> 理解 OpenSpec Harness 的整体架构和核心概念

## 什么是 Harness Engineering？

**Harness** 原意是"马具"，在这里比喻为**将 AI 能力 harness（驾驭）到软件开发流程中**。

传统开发：

```mermaid
flowchart LR
    A[思考] --> B[写代码]
    B --> C[测试]
    C --> D[调试]
    D --> E[重构]
    E -.-> B

    style A fill:#ffe1e1
    style E fill:#ffe1e1
```

Harness Engineering：

```mermaid
flowchart TD
    A[人: 思考] --> B[写规格]
    B --> C[讨论确认]
    C --> D[AI: 理解规格]
    D --> E[生成代码]
    E --> F[运行测试]
    F --> G[反馈结果]
    G --> H{确认/调整}
    H -.-> C

    style A fill:#e1f5e1
    style B fill:#e1f5e1
    style H fill:#e1f5e1
    style D fill:#e1e5ff
    style E fill:#e1e5ff
    style F fill:#e1e5ff
    style G fill:#e1e5ff
```

**核心转变**：人专注于"做什么"和"为什么"，AI 协助"怎么做"。

## 系统架构

### 整体架构图

```mermaid
flowchart LR
    subgraph Developer["开发者（你）"]
        direction LR
        D1[思考]
        D2[决策]
        D3[验收]
        D4[调整]
    end

    subgraph Engine["OpenSpec Harness 引擎"]
        direction LR
        P1[/opsx-explore\n探索/]
        P2[/opsx-propose\n提案/]
        P3[/opsx-apply\n实施/]
        W1[schemas/*.yaml]
        C1[config.yaml]
        P1 --> P2 --> P3 --> W1 --> C1
    end

    subgraph AI["AI 助手"]
        direction LR
        A1[理解规格]
        A2[生成代码]
        A3[运行测试]
        A4[反馈结果]
        A1 --> A2 --> A3 --> A4
    end

    Developer -->|输入规格\n确认方案| P1
    P3 -->|生成代码\n运行测试| A1
    A4 -->|反馈| Developer

    style Developer fill:#e1f5e1
    style AI fill:#e1e5ff
    style Engine fill:#fff2cc
```

### 数据流

```mermaid
sequenceDiagram
    participant Dev as 开发者
    participant Engine as Harness引擎
    participant AI as AI助手

    Dev->>Engine: 1. 输入需求
    Note over Engine: 确定工作流类型<br/>加载 schema<br/>读取项目配置
    Engine->>AI: 2. 解析需求
    Note over AI: 理解阶段目标<br/>生成产物<br/>运行验证
    AI->>Dev: 3. 返回结果
    Note over Dev: 审核内容<br/>确认或调整<br/>进入下一阶段
```

## 核心概念

### 1. 变更（Change）

**变更**是 Harness 的基本工作单元，代表一个完整的开发任务。

三种类型的变更：

**类型 1：新功能变更 (spec-driven)**

```mermaid
flowchart TB
    SD1[openspec/changes/]
    SD2["<change-name>/"]
    SD3[".openspec.yaml"]
    SD4["proposal.md"]
    SD5["design.md"]
    SD6["specs/"]
    SD7["tasks.md"]
    SD8["archive/"]

    SD1 --> SD2
    SD2 --> SD3
    SD2 --> SD4
    SD2 --> SD5
    SD2 --> SD6
    SD2 --> SD7
    SD1 --> SD8

    style SD1 fill:#e1f5e1
    style SD2 fill:#e1f5e1
    style SD3 fill:#fff
    style SD4 fill:#fff
    style SD5 fill:#fff
    style SD6 fill:#fff
    style SD7 fill:#fff
    style SD8 fill:#fff2cc
```

**类型 2：Bug 修复 (bugfix)**

```mermaid
flowchart TB
    BF1[openspec/bugs/]
    BF2["<bug-id>/"]
    BF3[".openspec.yaml"]
    BF4["bug-report.md"]
    BF5["fix.md"]
    BF6["archive/"]

    BF1 --> BF2
    BF2 --> BF3
    BF2 --> BF4
    BF2 --> BF5
    BF1 --> BF6

    style BF1 fill:#ffe1e1
    style BF2 fill:#ffe1e1
    style BF3 fill:#fff
    style BF4 fill:#fff
    style BF5 fill:#fff
    style BF6 fill:#fff2cc
```

**类型 3：技术调研 (spike)**

```mermaid
flowchart TB
    SP1[openspec/changes/]
    SP2["<spike-name>/"]
    SP3[".openspec.yaml"]
    SP4["research-question.md"]
    SP5["exploration-log.md"]
    SP6["decision.md"]
    SP7["findings/"]
    SP8["archive/"]

    SP1 --> SP2
    SP2 --> SP3
    SP2 --> SP4
    SP2 --> SD5
    SP2 --> SP6
    SP2 --> SP7
    SP1 --> SP8

    style SP1 fill:#fff2cc
    style SP2 fill:#fff2cc
    style SP3 fill:#fff
    style SP4 fill:#fff
    style SP5 fill:#fff
    style SP6 fill:#fff
    style SP7 fill:#fff
    style SP8 fill:#e1f5e1
```

### 2. 阶段（Phase）

每个工作流由多个**阶段**组成，阶段之间有明确的顺序和检查点。

```mermaid
flowchart LR
    A[探索<br/>Explore] --> B[提案<br/>Propose]
    B --> C[实施<br/>Apply]
    C --> D[验证<br/>Validate]
    D --> E[归档<br/>Archive]

    A1[需求澄清<br/>范围界定] --> A
    B1[方案设计<br/>规格定义] --> B
    C1[代码实现<br/>测试验证] --> C
    D1[质量检查<br/>自动归档] --> D
    E1[历史记录<br/>知识沉淀] --> E

    style A fill:#e1f5e1
    style B fill:#e1f5e1
    style C fill:#e1f5e1
    style D fill:#fff2cc
    style E fill:#e1f5e1
```

### 3. 产物（Artifact）

每个阶段产生特定的**产物**，产物是阶段完成的标志。

**提案阶段产物**

```mermaid
flowchart LR
    P1["proposal.md<br/>为什么要做这个变更？"]
    P2["design.md<br/>技术方案是什么？"]
    P3["specs/*.md<br/>详细规格是什么？"]
    P4["tasks.md<br/>具体任务有哪些？"]

    P1 --> P2 --> P3 --> P4

    style P1 fill:#e1f5e1
    style P2 fill:#e1f5e1
    style P3 fill:#e1f5e1
    style P4 fill:#e1f5e1
```

**实施阶段产物**

```mermaid
flowchart LR
    I1["代码实现"]
    I2["测试用例"]
    I3["文档更新"]

    I1 --> I2 --> I3

    style I1 fill:#e1e5ff
    style I2 fill:#e1e5ff
    style I3 fill:#e1e5ff
```

### 4. 检查点（Gate）

**检查点**是阶段之间的质量控制机制，确保只有满足条件才能进入下一阶段。

```mermaid
flowchart TB
    subgraph Gates["实施阶段检查点"]
        G1["test:unit<br/><i>单元测试必须通过</i>"]
        G2["lint<br/><i>代码风格必须合规</i>"]
        G3["type-check<br/><i>TypeScript 类型必须正确</i>"]
        G4["openspec validate<br/><i>规格必须完整</i>"]
    end

    style Gates fill:#fff2cc
```

## 工作流类型

### Spec-Driven（新功能开发）

**适用场景**：新功能、架构改动、大型重构

**核心理念**：先写规格，后写代码（Specification First）

```mermaid
flowchart LR
    A[探索需求] --> B[创建提案]
    B --> C[设计架构]
    C --> D[定义规格]
    D --> E[实施任务]
    E --> F[归档]

    A1[讨论<br/>澄清] --> A
    B1[写<br/>proposal] --> B
    C1[技术<br/>方案] --> C
    D1[详细<br/>规格] --> D
    E1[TDD<br/>实施] --> E
    F1[历史<br/>记录] --> F

    style A fill:#e1f5e1
    style B fill:#e1f5e1
    style C fill:#e1f5e1
    style D fill:#e1f5e1
    style E fill:#e1f5e1
    style F fill:#e1f5e1
```

**产物**：

- proposal.md（为什么）
- design.md（怎么做 - 架构层面）
- specs/\*.md（做什么 - 详细规格）
- tasks.md（何时做 - 任务列表）

### Bugfix（Bug 修复）

**适用场景**：生产环境问题、功能异常

**核心理念**：快速定位、最小修复、回归测试

```mermaid
flowchart LR
    A[报告问题] --> B[复现验证]
    B --> C[定位根因]
    C --> D[实施修复]
    D --> E[回归测试]
    E --> F[归档]

    A1[现象<br/>描述] --> A
    B1[确认<br/>存在] --> B
    C1[分析<br/>原因] --> C
    D1[修改<br/>代码] --> D
    E1[验证<br/>通过] --> E
    F1[记录<br/>教训] --> F

    style A fill:#ffe1e1
    style B fill:#ffe1e1
    style C fill:#ffe1e1
    style D fill:#ffe1e1
    style E fill:#ffe1e1
    style F fill:#e1f5e1
```

**产物**：

- bug-report.md（问题描述）
- fix.md（修复方案）
- regression test（回归测试）

### Spike（技术调研）

**适用场景**：技术选型、可行性验证、性能调查、新技术预研

**核心理念**：时间盒限制的探索性研究，必须产出明确决策

```mermaid
flowchart LR
    A[定义问题] --> B[探索研究]
    B --> C[形成决策]
    C --> D[归档]

    A1[research-question<br/>研究问题] --> A
    B1[exploration-log<br/>探索日志] --> B
    C1[decision<br/>决策文档] --> C
    D1[知识沉淀] --> D

    style A fill:#fff2cc
    style B fill:#fff2cc
    style C fill:#fff2cc
    style D fill:#e1f5e1
```

**产物**：

- research-question.md（研究问题定义）
- exploration-log.md（探索日志）
- decision.md（决策文档）
- findings/（研究发现）

**关键特性**：

- **时间盒限制**：默认 4 小时，最长 2 天
- **必须下结论**：即使是不完整的结论也要记录
- **可丢弃代码**：Spike 代码不需要测试，标记为实验性质
- **转为实施**：调研完成后通常转为 Spec-Driven 实施

### Explore（自由探索）

**适用场景**：需求不明确、技术方案不确定、风险评估

**核心理念**：先想清楚，再动手做

```mermaid
flowchart TD
    A[提出疑问] --> B[讨论分析]
    B --> C[形成结论]
    C --> D{转为正式变更?}
    D -->|是| E[spec-driven]
    D -->|是| F[bugfix]
    D -->|否| G[结束]

    A1[开放性<br/>问题] --> A
    B1[多角度<br/>思考] --> B
    C1[决策点<br/>形成] --> C

    style A fill:#e1e5ff
    style B fill:#e1e5ff
    style C fill:#fff2cc
    style E fill:#e1f5e1
    style F fill:#ffe1e1
```

**产物**：无固定产物，可能有讨论记录或决策文档

## 配置体系

Harness 使用**三层配置**来定义如何工作：

```mermaid
flowchart TB
    subgraph Wrapper[" "]
        direction LR

        subgraph Layer1["Layer 1: AGENTS.md"]
            direction TB
            L1A["目标读者: AI 助手"]
            L1B["内容: 角色定义、工作流程、约束规则"]
            L1C["作用: 告诉 AI '怎么工作'"]
        end

        subgraph Layer2["Layer 2: openspec/config.yaml"]
            direction TB
            L2A["目标读者: 项目/开发者"]
            L2B["内容: 项目信息、技术栈、命令"]
            L2C["作用: 定义 '项目是什么'"]
        end

        subgraph Layer3["Layer 3: openspec/schemas/*.yaml"]
            direction TB
            L3A["目标读者: 工作流引擎"]
            L3B["内容: 阶段定义、产物定义、检查点"]
            L3C["作用: 定义 '任务怎么做'"]
        end

        Layer1 --> Layer2
        Layer2 --> Layer3
    end

    style Layer1 fill:#e1f5e1
    style Layer2 fill:#fff2cc
    style Layer3 fill:#e1e5ff
    style Wrapper fill:none,stroke:none
```

详细说明参见 [02-配置体系](02-config-system.md)。

## 使用示例

### 示例 1：添加用户认证功能

```bash
# 阶段 1：探索（可选）
/opsx-explore
> "我想添加用户认证功能，用什么方案比较好？"
< AI 讨论 JWT vs Session vs OAuth 的优缺点

# 阶段 2：提案
/opsx-propose add-user-auth
> AI 生成：
>   proposal.md: 为什么需要认证功能
>   design.md: 使用 JWT + Refresh Token 方案
>   specs/: 登录、注册、token 刷新等接口规格
>   tasks.md: 5 个实施任务

# 阶段 3：实施
/opsx-apply
> AI 协助完成 tasks.md 中的任务
>   - [Red] 写测试
>   - [Green] 写实现
>   - [Refactor] 重构代码

# 阶段 4：归档
# 合并到 main 后自动归档
```

### 示例 2：修复登录按钮失效

```bash
# 阶段 1：报告
/opsx-bugfix login-button-broken
> AI 引导填写 bug-report.md:
>   Symptom: 登录按钮点击无反应
>   Steps: 1. 打开首页 2. 点击登录
>   Expected: 弹出登录框
>   Actual: 无反应

# 阶段 2：修复
> AI 协助：
>   1. 定位根因：事件监听绑定问题
>   2. 实施修复：修改绑定方式
>   3. 添加回归测试

# 阶段 3：验证
> 运行测试确认修复

# 阶段 4：归档
```

## 优势总结

### 对开发者

1. **降低认知负担**：AI 协助处理细节，人专注于决策
2. **强制规格先行**：必须先想清楚做什么，才能开始做
3. **完整历史记录**：每个变更都有可追溯的完整上下文
4. **减少重复劳动**：AI 生成样板代码和文档

### 对项目

1. **知识沉淀**：所有决策和方案都记录在案
2. **新人友好**：新成员可以通过阅读 specs 快速理解系统
3. **质量保证**：检查点确保质量，不会跳过重要步骤
4. **可追溯性**：问题可以追溯到具体变更和决策

## 下一步

- **[配置体系详解](02-config-system.md)** - 理解 AGENTS.md、config.yaml、schemas 的关系
- **[工作流详解](03-workflows.md)** - 深入学习 spec-driven 和 bugfix 工作流
- **[命令参考](04-commands.md)** - 查看所有可用命令的详细用法
