# 任务执行模板

本文档提供各类任务的标准执行模板。

> **TDD 工作流详见：** [tdd-workflow.md](tdd-workflow.md)

---

## 目录

- [一、TDD 任务模板](#一tdd-任务模板推荐)
- [二、前端任务模板](#二前端任务模板)
- [三、后端任务模板](#三后端任务模板)
- [四、全栈任务模板](#四全栈任务模板)
- [五、测试任务模板](#五测试任务模板)
- [六、文档任务模板](#六文档任务模板)
- [七、代码审查任务模板](#七代码审查任务模板)
- [八、重构任务模板](#八重构任务模板)
- [九、性能优化任务模板](#九性能优化任务模板)
- [十、迁移任务模板](#十迁移任务模板)
- [十一、快速检查清单](#十一快速检查清单)

---

## 一、TDD 任务模板（推荐）

**核心理念：** 测试先行，红绿重构循环

### 标准流程

```yaml
任务类型: tdd
推荐流程: spec-writer → tester → developer → code-reviewer
TDD 循环: Red → Green → Refactor
```

### tasks.md 模板

```markdown
## 实施任务

### Phase 1: Red（测试先行）
- [ ] 编写测试规格
- [ ] 实现测试用例
- [ ] 验证测试失败 ✓

### Phase 2: Green（最小实现）
- [ ] 实现最小代码
- [ ] 验证测试通过 ✓

### Phase 3: Refactor（优化）
- [ ] 代码重构优化
- [ ] 验证测试仍然通过 ✓
- [ ] 代码审查完成
```

**详细说明和示例见：** [tdd-workflow.md](tdd-workflow.md)

---

## 一、前端任务模板

### 标准流程

```yaml
任务类型: frontend
推荐流程: ui-designer → frontend-developer → frontend-tester
```

### 执行步骤

```
1. 阅读 proposal.md 和 design.md
2. 理解需求和设计规格
3. 调用 ui-designer 设计页面结构和交互
   - 确定布局和组件结构
   - 定义交互行为和状态
   - 输出设计规格
4. 调用 frontend-developer 实现代码
   - 根据设计规格实现组件
   - 添加交互逻辑
   - 集成状态管理
5. 更新 tasks.md
6. 调用 frontend-tester 验证
7. 调用 code-reviewer 审查
```

### 并行策略

- 多个独立页面可并行：`ui-designer` 先并行设计，`frontend-developer` 再并行实现
- 设计完成后可立即开始实现，无需等待所有设计完成

### 示例

```typescript
// Phase 1: 设计
await task(subagent="ui-designer", prompt=`
设计用户管理页面：
- 用户列表（表格显示）
- 用户创建（表单）
- 用户编辑（模态框）
- 用户删除（确认对话框）
`)

// Phase 2: 实现
await task(subagent="frontend-developer", prompt=`
实现用户管理页面：
- 使用 React + TypeScript
- 集成 Ant Design 组件
- 实现 CRUD 功能
- 添加错误处理
`)
```

---

## 二、后端任务模板

### 标准流程

```yaml
任务类型: backend
推荐流程: api-designer → backend-developer → code-reviewer
```

### 执行步骤

```
1. 阅读 proposal.md 和 design.md
2. 理解需求和设计规格
3. 调用 api-designer 设计 API
   - 定义 REST/GraphQL 接口
   - 设计数据模型和 Schema
   - 确定请求/响应格式
   - 输出 API 规格
4. 调用 backend-developer 实现代码
   - 根据 API 规格实现接口
   - 实现业务逻辑
   - 添加数据验证
5. 更新 tasks.md
6. 运行类型检查
7. 调用 code-reviewer 审查
```

### 并行策略

- API 设计完成后，前端可基于 API 规格并行开发（mock 数据）
- 多个独立 API 可并行设计和实现

### 示例

```typescript
// Phase 1: API 设计
await task(subagent="api-designer", prompt=`
设计用户管理 API：
- GET /api/users - 获取用户列表
- GET /api/users/:id - 获取用户详情
- POST /api/users - 创建用户
- PUT /api/users/:id - 更新用户
- DELETE /api/users/:id - 删除用户
`)

// Phase 2: 实现
await task(subagent="backend-developer", prompt=`
实现用户管理 API：
- 使用 Node.js + Express
- 集成 MongoDB
- JWT 认证
- 输入验证和错误处理
`)
```

---

## 三、全栈任务模板

### 标准流程

```yaml
任务类型: fullstack
推荐流程: api-designer → fullstack-developer → frontend-tester + code-reviewer
```

### 执行步骤

```
1. 阅读 proposal.md 和 design.md
2. 理解需求和设计规格
3. 调用 api-designer 设计 API
   - 定义数据模型
   - 设计 REST/GraphQL 接口
   - 输出 API 规格
4. 调用 fullstack-developer 实现后端
   - 实现 API 接口
   - 实现业务逻辑
5. 调用 fullstack-developer 实现前端
   - 根据 API 规格实现 UI
   - 集成 API 调用
6. 更新 tasks.md
7. 调用 frontend-tester 验证
8. 调用 code-reviewer 审查
```

### 并行策略

- API 设计完成后，前端可基于 API 规格 mock 数据并行开发
- 后端完成后，前端可对接真实 API

### 示例

```typescript
// Phase 1: API 设计
await task(subagent="api-designer", prompt=`
设计用户认证 API：
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/logout
- GET /api/auth/me
`)

// Phase 2: 后端实现
await task(subagent="fullstack-developer", prompt=`
实现用户认证后端：
- JWT 认证
- 密码加密
- 会话管理
`)

// Phase 3: 前端实现
await task(subagent="fullstack-developer", prompt=`
实现用户认证前端：
- 登录页面
- 注册页面
- API 集成
- 状态管理
`)
```

---

## 四、测试任务模板

### 标准流程

```yaml
任务类型: test
推荐流程: 编写测试 → 运行测试 → 验证覆盖率
```

### 执行步骤

```
1. 阅读相关代码
2. 理解功能和边界情况
3. 编写测试用例
   - 正常情况测试
   - 边界情况测试
   - 错误情况测试
4. 运行测试
5. 确保覆盖率
6. 更新 tasks.md
```

### 测试类型

```yaml
单元测试:
  - 测试单个函数或组件
  - Mock 外部依赖
  - 快速执行

集成测试:
  - 测试多个组件的交互
  - 测试 API 集成
  - 需要真实环境

端到端测试:
  - 测试完整流程
  - 模拟用户操作
  - 耗时较长
```

### 示例

```typescript
// 单元测试示例
await task(subagent="general-purpose", prompt=`
为用户管理功能编写单元测试：
- 使用 Vitest
- 测试 CRUD 操作
- Mock 数据库
- 确保覆盖率 > 80%
`)
```

---

## 五、文档任务模板

### 标准流程

```yaml
任务类型: documentation
推荐流程: 收集信息 → 编写文档 → 审查和发布
```

### 执行步骤

```
1. 阅读相关代码和文档
2. 理解功能和使用方式
3. 收集必要信息
4. 编写文档
   - 功能说明
   - 使用示例
   - API 文档
   - 常见问题
5. 更新 tasks.md
```

### 文档类型

```yaml
API 文档:
  - 接口定义
  - 请求/响应格式
  - 错误代码
  - 示例代码

用户文档:
  - 功能介绍
  - 使用指南
  - 配置说明
  - 常见问题

开发者文档:
  - 架构说明
  - 代码结构
  - 开发指南
  - 贡献指南
```

---

## 六、代码审查任务模板

### 标准流程

```yaml
任务类型: code-review
推荐流程: 阅读代码 → 检查质量 → 提供反馈
```

### 审查要点

```
1. 代码质量
   - 代码风格
   - 命名规范
   - 代码复用

2. 功能正确性
   - 实现是否符合需求
   - 边界情况处理
   - 错误处理

3. 性能
   - 算法复杂度
   - 资源使用
   - 优化建议

4. 安全
   - 输入验证
   - 认证授权
   - 数据保护

5. 可维护性
   - 代码注释
   - 文档完整性
   - 测试覆盖
```

### 示例

```typescript
await task(subagent="code-reviewer", prompt=`
审查以下代码：
- src/auth/login.ts
- src/auth/register.ts

检查：
- 代码质量
- 安全问题
- 性能优化
- 最佳实践
`)
```

---

## 七、重构任务模板

### 标准流程

```yaml
任务类型: refactoring
推荐流程: 分析代码 → 制定重构计划 → 执行重构 → 验证
```

### 执行步骤

```
1. 阅读现有代码
2. 识别问题和改进点
3. 制定重构计划
   - 保持功能不变
   - 改进代码质量
   - 提高可维护性
4. 执行重构
   - 小步重构
   - 持续测试
   - 保留测试
5. 更新 tasks.md
6. 运行测试验证
```

### 重构原则

```yaml
保持功能不变:
  - 不改变行为
  - 不改变接口
  - 不改变输出

小步重构:
  - 每次只改一点
  - 持续测试
  - 容易回滚

持续测试:
  - 每步都要测试
  - 确保功能正常
  - 发现问题立即修复
```

---

## 八、性能优化任务模板

### 标准流程

```yaml
任务类型: performance
推荐流程: 性能分析 → 识别瓶颈 → 优化实现 → 验证效果
```

### 执行步骤

```
1. 性能分析
   - 使用性能工具
   - 识别瓶颈
   - 收集数据

2. 识别瓶颈
   - 算法复杂度
   - I/O 操作
   - 资源使用

3. 优化实现
   - 算法优化
   - 缓存策略
   - 异步处理

4. 验证效果
   - 性能测试
   - 对比数据
   - 确认改进
```

### 优化策略

```yaml
算法优化:
  - 降低时间复杂度
  - 降低空间复杂度
  - 使用更优算法

缓存策略:
  - 添加缓存层
  - 缓存预热
  - 缓存失效

异步处理:
  - 使用异步 I/O
  - 并行处理
  - 队列处理
```

---

## 九、迁移任务模板

### 标准流程

```yaml
任务类型: migration
推荐流程: 分析旧系统 → 设计迁移方案 → 实施迁移 → 验证
```

### 执行步骤

```
1. 分析旧系统
   - 理解现有功能
   - 识别依赖关系
   - 评估迁移难度

2. 设计迁移方案
   - 渐进式迁移
   - 双写策略
   - 回滚方案

3. 实施迁移
   - 搭建新系统
   - 数据迁移
   - 功能迁移

4. 验证
   - 功能测试
   - 性能测试
   - 用户验收
```

---

## 十、快速检查清单

### 任务开始前
- [ ] 理解任务需求
- [ ] 阅读 proposal.md 和 design.md
- [ ] 确定任务类型
- [ ] 选择合适的 subagent
- [ ] 准备必要的上下文

### 任务执行中
- [ ] 按步骤执行
- [ ] 及时更新 tasks.md
- [ ] 处理阻塞和问题
- [ ] 保持最小变更

### 任务完成后
- [ ] tasks.md 已更新
- [ ] 代码已测试
- [ ] 代码已审查
- [ ] 文档已更新
- [ ] 变更可回滚