# 09 - 跨系统协作指南

> 一个 PRD 涉及多个系统时，如何让各团队独立完成各自任务

## 问题场景

```
        PRD 需求："用户下单购买商品"
            │
            │ 一个需求，涉及多个系统
            ▼
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│ 用户服务 │   │ 订单服务 │   │ 支付服务 │
│ Team A  │   │ Team B  │   │ Team C  │
│         │   │         │   │         │
│ 获取用户 │   │ 创建订单 │   │ 处理支付 │
│ 验证库存 │   │ 更新状态 │   │ 回调通知 │
└─────────┘   └─────────┘   └─────────┘
    │               │             │
    │    依赖       │    依赖      │
    └───────────────┴─────────────┘
            │
            ▼
    如何协调？
```

**典型挑战**：

| 问题         | 描述                                         |
| ------------ | -------------------------------------------- |
| **接口依赖** | 订单服务需要调用用户服务、库存服务、支付服务 |
| **时序依赖** | 必须先创建订单，才能发起支付                 |
| **数据依赖** | 支付回调需要更新订单状态                     |
| **版本兼容** | 接口变更时，调用方和被调用方需要同步         |
| **独立开发** | 各系统团队有自己的发布周期                   |

---

## 解决方案：PRD 拆分 + 接口契约

### 核心思路

```
PRD 需求
    │
    ▼
┌─────────────────────────────────────────────┐
│          PRD 拆分为接口契约                  │
├─────────────────────────────────────────────┤
│                                             │
│  用户服务契约         订单服务契约         支付服务契约
│  ┌─────────┐         ┌─────────┐         ┌─────────┐
│  │ 接口定义 │         │ 接口定义 │         │ 接口定义 │
│  │ 数据结构 │         │ 数据结构 │         │ 数据结构 │
│  │ 依赖声明 │         │ 依赖声明 │         │ 依赖声明 │
│  └─────────┘         └─────────┘         └─────────┘
│                                             │
└─────────────────────────────────────────────┘
    │                     │                     │
    ▼                     ▼                     ▼
┌─────────┐         ┌─────────┐         ┌─────────┐
│ Team A  │         │ Team B  │         │ Team C  │
│ 独立开发 │         │ 独立开发 │         │ 独立开发 │
│ 基于契约 │         │ 基于契约 │         │ 基于契约 │
└─────────┘         └─────────┘         └─────────┘
```

---

## 第一步：PRD 拆分策略

### 1.1 分析边界

从 PRD 中识别各系统的职责边界：

```markdown
## PRD 分析："用户下单购买商品"

### 功能拆解

┌─────────────────────────────────────────────────────────┐
│ 功能点 │ 负责系统 │ 接口需定义 │
├─────────────────────────────────────────────────────────┤
│ 用户登录/获取信息 │ 用户服务 │ GET /api/user │
│ 商品库存检查 │ 库存服务 │ GET /api/inventory │
│ 创建订单 │ 订单服务 │ POST /api/order │
│ 发起支付 │ 支付服务 │ POST /api/payment │
│ 支付回调 │ 支付服务 │ POST /api/callback │
│ 订单状态更新 │ 订单服务 │ PUT /api/order/{id} │
│ 用户通知 │ 通知服务 │ POST /api/notify │
└─────────────────────────────────────────────────────────┘

### 依赖关系

用户服务 ←─ 订单服务 ←─ 支付服务
库存服务 ←─ 订单服务 ←─ 通知服务

### 时序要求

1. 用户登录 → 创建订单前
2. 库存检查 → 创建订单前
3. 创建订单 → 发起支付前
4. 发起支付 → 支付回调前
```

### 1.2 创建主变更

```bash
# 主变更：PRD 本身
openspec new change "order-purchase-feature"

# 主变更目录结构
openspec/changes/order-purchase-feature/
├── .openspec.yaml        # 声明子变更和依赖
├── proposal.md           # PRD 全貌
├── design.md             # 整体架构设计
├── specs/
│   └── overall/
│       └── spec.md       # 完整功能规格
└── tasks.md              # 整体任务分解
```

**.openspec.yaml 示例**：

```yaml
schema: spec-driven
name: order-purchase-feature
status: active

# 子变更声明
sub_changes:
  - name: user-service-order
    team: TeamA
    depends_on: []

  - name: inventory-service-order
    team: TeamB
    depends_on: []

  - name: order-service-purchase
    team: TeamC
    depends_on:
      - user-service-order # 依赖用户服务
      - inventory-service-order # 依赖库存服务

  - name: payment-service-purchase
    team: TeamD
    depends_on:
      - order-service-purchase # 依赖订单服务

# 接口契约
api_contracts:
  - service: user-service
    version: 1.2.0
    endpoints:
      - GET /api/user/{id}

  - service: inventory-service
    version: 1.0.0
    endpoints:
      - GET /api/inventory/check

  - service: order-service
    version: 2.0.0
    endpoints:
      - POST /api/orders
      - PUT /api/orders/{id}/status

  - service: payment-service
    version: 1.5.0
    endpoints:
      - POST /api/payments
      - POST /api/payments/callback
```

### 1.3 拆分子变更

每个系统团队创建自己的变更：

```bash
# 用户服务团队
openspec new change "user-service-order" --parent "order-purchase-feature"

# 库存服务团队
openspec new change "inventory-service-order" --parent "order-purchase-feature"

# 订单服务团队
openspec new change "order-service-purchase" --parent "order-purchase-feature"

# 支付服务团队
openspec new change "payment-service-purchase" --parent "order-purchase-feature"
```

**子变更目录结构**：

```
openspec/changes/user-service-order/
├── .openspec.yaml        # 声明依赖
├── proposal.md           # 本系统职责
├── design.md             # 本系统设计
├── specs/
│   └── user-api/
│       └── spec.md       # API 规格
└── tasks.md              # 本系统任务

openspec/changes/order-service-purchase/
├── .openspec.yaml        # 声明对用户服务、库存服务的依赖
├── proposal.md
├── design.md
├── specs/
│   ├── order-api/
│   │   └── spec.md
│   └── dependencies/
│       ├── user-service.md    # 对用户服务的接口要求
│       └── inventory-service.md
└── tasks.md
```

---

## 第二步：接口契约管理

### 2.1 Swagger Registry

统一管理所有服务的接口定义：

```
swagger-registry/
├── services/
│   ├── user-service/
│   │   ├── openapi.yaml         # 当前版本
│   │   └── versions/
│   │       ├── 1.0.0.yaml
│   │       ├── 1.1.0.yaml
│   │       └── 1.2.0.yaml
│   ├── inventory-service/
│   │   └── openapi.yaml
│   ├── order-service/
│   │   └── openapi.yaml
│   └── payment-service/
│       └── openapi.yaml
├── registry.yaml               # 服务注册表
└── index.html                  # Swagger UI 入口
```

### 2.2 接口版本管理

```yaml
# registry.yaml
version: "1.0"
services:
  user-service:
    name: 用户服务
    current_version: 1.2.0
    owner: TeamA
    versions:
      - 1.0.0
      - 1.1.0
      - 1.2.0
    endpoints:
      - GET /api/user/{id}
    consumers:
      - order-service

  order-service:
    name: 订单服务
    current_version: 2.0.0
    owner: TeamC
    versions:
      - 1.0.0
      - 2.0.0
    endpoints:
      - POST /api/orders
      - PUT /api/orders/{id}/status
    depends_on:
      - user-service: ">=1.2.0"
      - inventory-service: ">=1.0.0"
```

### 2.3 接口变更通知

当服务接口变更时，自动通知依赖方：

```yaml
# .gitlab-ci.yml
notify-consumers:
  stage: notify
  script:
    - |
      SERVICE=$(cat openspec/changes/$CI_COMMIT_BRANCH/.openspec.yaml | grep "service:" | awk '{print $2}')
      VERSION=$(cat openspec/changes/$CI_COMMIT_BRANCH/.openspec.yaml | grep "version:" | awk '{print $2}')
      CHANGE_TYPE=$(cat openspec/changes/$CI_COMMIT_BRANCH/.openspec.yaml | grep "change_type:" | awk '{print $2}')

      # 获取依赖方列表
      CONSUMERS=$(cat swagger-registry/registry.yaml | grep "consumers:" -A 10 | grep $SERVICE)

      # 发送通知
      for consumer in $CONSUMERS; do
        curl -X POST $SLACK_WEBHOOK -d "{
          \"text\": \"📦 $SERVICE 接口变更通知
          版本: $VERSION
          变更类型: $CHANGE_TYPE
          影响服务: $consumer
          请在 24 小时内确认兼容性。\"
        }"
      done
```

---

## 第三步：依赖声明

### 3.1 在变更中声明依赖

```yaml
# openspec/changes/order-service-purchase/.openspec.yaml
schema: spec-driven
name: order-service-purchase
status: active

# 依赖声明
dependencies:
  - change: user-service-order
    version: ">=1.0.0"
    interface: GET /api/user/{id}
    required_before: implementation

  - change: inventory-service-order
    version: ">=1.0.0"
    interface: GET /api/inventory/check
    required_before: implementation

# 接口契约
api:
  provides:
    - POST /api/orders
    - PUT /api/orders/{id}/status
  consumes:
    - service: user-service
      endpoint: GET /api/user/{id}
    - service: inventory-service
      endpoint: GET /api/inventory/check
```

### 3.2 CI 依赖检测

```yaml
# .gitlab-ci.yml
check-dependencies:
  stage: openspec-check
  script:
    - |
      echo "检查依赖状态..."

      CHANGE=$(basename $CI_COMMIT_BRANCH)
      DEPENDENCIES=$(cat openspec/changes/$CHANGE/.openspec.yaml | grep "change:" | awk '{print $2}')

      for dep in $DEPENDENCIES; do
        # 检查依赖变更是否存在
        if [ ! -d "openspec/changes/$dep" ]; then
          echo "❌ 依赖 $dep 不存在"
          exit 1
        fi
        
        # 检查依赖变更状态
        STATUS=$(cat openspec/changes/$dep/.openspec.yaml | grep "status:" | awk '{print $2}')
        if [ "$STATUS" != "done" ]; then
          echo "⚠️  依赖 $dep 尚未完成 (状态: $STATUS)"
          echo "请等待依赖完成后再开始实施"
          exit 1
        fi
      done

      echo "✅ 所有依赖已就绪"
```

---

## 第四步：Mock 服务解耦

### 4.1 为什么需要 Mock

```
问题场景：
Team B（订单服务）要开发，但依赖 Team A（用户服务）的接口
Team A 的接口还在开发中，Team B 无法并行开始

解决方案：
Team B 基于 Mock 服务开发，等 Team A 完成后替换为真实服务
```

### 4.2 Mock 服务配置

```yaml
# openspec/changes/user-service-order/mock.yaml
service: user-service
version: 1.2.0

endpoints:
  - path: /api/user/{id}
    method: GET
    responses:
      - status: 200
        body:
          id: "{id}"
          name: "Mock User"
          email: "mock@example.com"
      - status: 404
        body:
          error: "User not found"

mock_server:
  port: 3001
  delay: 100ms # 模拟网络延迟
```

### 4.3 Mock 服务生成

```bash
# 使用 Prism 或其他 Mock 工具
prism mock swagger-registry/services/user-service/openapi.yaml

# 或使用 OpenSpec CLI
openspec mock user-service-order
```

---

## 第五步：协调流程

### 5.1 跨团队协调模板

```markdown
## 跨系统变更协调

### 基本信息协调人: @coordinatorteam: TeamA（用户服务）、TeamB（订单服务）、TeamC（支付服务）

创建时间: 2024-03-15预计完成: 2024-03-25

### 接口契约

| 服务     | 接口                     | 版本  | 负责团队 | 状态   |
| -------- | ------------------------ | ----- | -------- | ------ |
| 用户服务 | GET /api/user/{id}       | 1.2.0 | TeamA    | 进行中 |
| 库存服务 | GET /api/inventory/check | 1.0.0 | TeamB    | 待开始 |
| 订单服务 | POST /api/orders         | 2.0.0 | TeamC    | 待开始 |
| 支付服务 | POST /api/payments       | 1.5.0 | TeamD    | 待开始 |

### 时序要求
```

Day 1-3: 用户服务开发（Mock）
Day 4-6: 库存服务开发（Mock）
│
▼
Day 7-10: 订单服务开发（基于 Mock）
│
▼
Day 11-14: 支付服务开发（基于 Mock）
│
▼
Day 15-18: 集成测试（真实服务）
Day 19-21: 灰度发布

```

### 依赖状态

| 依赖 | 状态 | 完成时间 | 阻塞影响 |
|------|------|----------|----------|
| 用户服务 API | ✅ 完成 | Day 3 | 无 |
| 库存服务 API | 🔄 进行中 | Day 6 | 订单服务 |
| 订单服务 API | ⏸️ 等待 | Day 10 | 支付服务 |

### 协调记录

**2024-03-16**:
- 用户服务宣布 API 冻结
- 库存服务开始开发
- 订单服务使用 Mock 进行并行开发

**2024-03-18**:
- 库存服务 API 变更（字段调整）
- 订单服务需同步调整（已通知）
```

### 5.2 协调 MR 模板

```markdown
## 跨系统变更 MR

### 基本信息

- **主变更**: order-purchase-feature
- **子变更**: payment-service-purchase
- **负责团队**: TeamD

### 依赖检查

- [ ] 依赖的变更已完成
- [ ] 依赖的接口版本匹配
- [ ] Mock 测试通过

### 接口变更

- **新增接口**: POST /api/payments/callback
- **修改接口**: 无
- **删除接口**: 无

### 影响范围

- [ ] 用户服务（无影响）
- [ ] 库存服务（无影响）
- [ ] 订单服务（依赖方）

### 集成测试

- [ ] 单元测试通过
- [ ] 接口测试通过
- [ ] 集成环境测试通过

### 通知

已通知：@order-service-team
```

---

## 第六步：集成测试

### 6.1 集成测试流水线

```yaml
# .gitlab-ci.yml
integration-test:
  stage: test
  script:
    # 1. 启动所有依赖服务
    - docker-compose up -d user-service inventory-service order-service

    # 2. 等待服务就绪
    - sleep 10

    # 3. 运行集成测试
    - pnpm test:integration

    # 4. 验证接口契约
    - |
      for service in user-service inventory-service order-service; do
        CONTRACT=$(cat swagger-registry/services/$service/openapi.yaml)
        RESPONSE=$(curl -s localhost:3000/api/$service/health)
        
        # 验证响应是否符合契约
        node scripts/validate-contract.js "$CONTRACT" "$RESPONSE"
      done
```

### 6.2 契约测试

```typescript
// tests/contract/user-service.contract.test.ts
import { Contract } from "pact";

describe("用户服务契约测试", () => {
  it("GET /api/user/{id} 应符合契约", async () => {
    const response = await fetch("/api/user/123");

    // 验证响应结构
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      email: expect.any(String),
    });
  });
});
```

---

## 最佳实践

### 1. 接口优先开发

```
推荐顺序：
1. 定义接口契约（所有团队参与）
2. 生成 Mock 服务
3. 各团队并行开发（基于 Mock）
4. 逐个替换为真实服务
5. 集成测试
```

### 2. 版本兼容

```
接口变更规则：
- 新增字段：兼容，不需要版本升级
- 删除字段：不兼容，需要新版本
- 修改字段：不兼容，需要新版本

版本格式：主版本.次版本.补丁版本
- 主版本：不兼容变更
- 次版本：新增功能，兼容
- 补丁版本：Bug 修复
```

### 3. 依赖隔离

```
依赖原则：
- 依赖接口，不依赖实现
- 使用 Mock 解耦开发
- 明确声明版本依赖
- 定期同步接口文档
```

### 4. 协调节奏

```
建议节奏：
- 每日站会：同步进度
- 每周接口评审：确认接口变更
- 每两周集成测试：验证整体流程
```

---

## 检查清单

### PRD 拆分检查

- [ ] PRD 已拆分为各系统规格
- [ ] 接口边界已明确
- [ ] 依赖关系已声明
- [ ] 时序要求已记录

### 接口契约检查

- [ ] Swagger Registry 已配置
- [ ] 各服务接口已注册
- [ ] 版本号已定义
- [ ] 消费方已记录

### 依赖管理检查

- [ ] .openspec.yaml 中声明了依赖
- [ ] CI 已配置依赖检测
- [ ] 依赖状态可追踪

### Mock 服务检查

- [ ] Mock 服务已生成
- [ ] Mock 数据符合契约
- [ | 各团队可以使用 Mock 开发

### 集成测试检查

- [ ] 集成测试环境已搭建
- [ ] 契约测试已通过
- [ ] 端到端测试已通过

---

## 常见问题

### Q: 依赖的服务一直不完成怎么办？

**A**: 使用 Mock 服务并行开发，并设置截止日期：

```markdown
## 依赖截止日期

用户服务 API 冻结: Day 3
库存服务 API 冻结: Day 6
订单服务 API 冻结: Day 10

如果依赖服务未完成:

- 使用 Mock 继续开发
- 在主变更中记录阻塞原因
- 每日同步进度
```

### Q: 接口变更时如何通知？

**A**: 使用 CI 自动通知：

```yaml
# 接口变更时自动通知
notify-on-api-change:
  script:
    - |
      # 检测 API 文件变更
      API_CHANGED=$(git diff --name-only | grep "openapi.yaml")

      if [ ! -z "$API_CHANGED" ]; then
        # 获取依赖方列表
        DEPENDENTS=$(cat registry.yaml | grep "consumers" -A 10)
        
        # 发送通知
        curl -X POST $SLACK_WEBHOOK -d "{
          \"text\": \"⚠️ 接口变更通知\",
          \"attachments\": [{
            \"title\": \"$API_CHANGED\",
            \"text\": \"影响服务: $DEPENDENTS\",
            \"color\": \"warning\"
          }]
        }"
      fi
```

---

**继续阅读**: [08 - 常见问题 FAQ](08-faq.md) | [返回目录](../README.md)
