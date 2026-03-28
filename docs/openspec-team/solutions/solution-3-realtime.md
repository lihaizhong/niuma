# 方案三：实时协作看板方案

## 概述

基于 WebSocket + 实时状态同步的 OpenSpec 协作方案，实现"所见即所得"的团队协作体验。当有人创建变更、修改状态、发现冲突时，所有团队成员立即看到更新。

**核心特点**:

- ⚡ 实时同步（毫秒级延迟）
- 🎯 精准冲突检测（章节级、字段级）
- 🔔 智能通知（只通知相关人）
- 🎮 游戏化体验（任务负载可视化、成就系统）

**技术栈**: WebSocket + Redis + Node.js/Go + React/Vue

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    客户端层                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Web 应用 / IDE 插件 / CLI                                   │
│  ├─ 实时看板 (WebSocket)                                     │
│  ├─ 冲突高亮                                                 │
│  ├─ 在线用户列表                                             │
│  └─ 即时通知                                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    实时服务层                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  WebSocket Server (Socket.io / ws)                          │
│  ├─ 连接管理 (用户在线状态)                                   │
│  ├─ 房间管理 (按项目/变更分组)                                │
│  ├─ 消息广播 (状态更新)                                       │
│  └─ 权限控制 (谁可以接收什么)                                  │
│                                                             │
│  Redis (Pub/Sub)                                            │
│  ├─ 状态缓存                                                 │
│  ├─ 消息队列                                                 │
│  └─ 分布式锁 (防止竞态条件)                                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    业务逻辑层                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  OpenSpec 协作引擎                                           │
│  ├─ 变更状态机 (Proposed → Active → ...)                      │
│  ├─ 冲突检测引擎 (实时章节级检测)                              │
│  ├─ 依赖图管理 (Changes 之间的关系)                           │
│  └─ 锁管理 (谁正在编辑什么)                                   │
│                                                             │
│  API Server (REST + GraphQL)                                │
│  ├─ 变更 CRUD                                               │
│  ├─ 冲突查询                                                │
│  ├─ 历史记录                                                │
│  └─ 统计报表                                                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    存储层                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PostgreSQL                                                 │
│  ├─ Changes 表                                              │
│  ├─ Conflicts 表                                            │
│  ├─ History 表 (审计日志)                                    │
│  └─ Users 表                                                │
│                                                             │
│  Git (文件存储)                                              │
│  └─ openspec/changes/*                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 核心功能

### 1. 实时看板

**界面效果**:

```
┌────────────────────────────────────────────────────────────────┐
│ 🔴 OpenSpec 实时协作看板                    [在线: 12人]         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ 📋 Proposed              🔄 Active (3人正在编辑)                │
│ ┌────────────┐          ┌────────────┐  ┌────────────┐         │
│ │ 添加认证   │          │ 支付优化   │  │ 用户升级   │         │
│ │ @alice    │          │ @bob      │  │ @charlie  │         │
│ │ [new]     │          │ [typing]  │  │ [online]  │         │
│ └────────────┘          └────────────┘  └────────────┘         │
│                                                                │
│ 👀 Review                ⛔ Blocked                            │
│ ┌────────────┐          ┌────────────┐                         │
│ │ 登录改版   │          │ API升级   ⚠️                        │
│ │ @david    │          │ @eve      │                         │
│ │ 2 reviews │          │ 阻塞: 等设计                         │
│ └────────────┘          └────────────┘                         │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ 实时活动:                                                      │
│ • Alice 刚刚创建了 "添加认证" [3秒前]                           │
│ • Bob 正在编辑 "支付优化" [typing...]                           │
│ • Charlie 完成了 "用户升级" 并移动到 Review                     │
└────────────────────────────────────────────────────────────────┘
```

**实时特性**:

- 卡片拖拽实时同步给所有人
- 编辑状态实时显示（谁在编辑什么）
- 在线用户列表和状态
- 实时活动流（像 Discord 的 activity feed）

### 2. 智能冲突检测

**实时章节级检测**:

```
Alice 正在编辑: specs/auth.md
  └── 章节: "OAuth2 认证流程"

Bob 同时打开: specs/auth.md
  └── 尝试编辑: "OAuth2 认证流程"

系统立即提示 Bob:
"⚠️ Alice 正在编辑此章节 (2分钟前开始)
  建议: 等待 Alice 完成或切换到其他章节"
```

**冲突预警系统**:

```
场景：Alice 的变更影响 specs/auth/user.md
       Bob 的变更也影响 specs/auth/user.md

系统立即：
1. 在 Alice 和 Bob 的界面显示冲突警告
2. 在看板上两个卡片都标记 🔴
3. 发送精准通知给 Alice 和 Bob
4. 建议协调方案（如：谁先完成）
```

### 3. 精准通知系统

**通知策略**:

```
不是广播所有人，而是：

场景：Alice 的 "添加认证" 与 Bob 的 "用户升级" 冲突

通知对象：
  ✅ Alice (当事人)
  ✅ Bob (当事人)
  ✅ 团队 Leader (需要知情)
  ❌ Charlie (无关，不打扰)
  ❌ David (无关，不打扰)

通知方式：
  - 浏览器推送 (如果在线)
  - Slack DM (如果离线)
  - 邮件摘要 (如果超过1小时未读)
```

### 4. 在线协作编辑

**多人同时编辑**:

```
Alice 和 Bob 需要协调 specs/auth.md

方式一：实时协同编辑 (类似 Google Docs)
  Alice 编辑: "## OAuth2 流程"  [Alice 光标]
  Bob 编辑:   "## JWT 验证"    [Bob 光标]

  两人实时看到对方的编辑
  系统自动合并无冲突的修改

方式二：章节锁定
  Alice 点击 "编辑 OAuth2 章节"
  → 系统锁定该章节给 Alice (5分钟)
  → Bob 看到 "章节被 Alice 锁定"
  → Alice 完成后自动解锁
```

### 5. 游戏化体验

**负载可视化**:

```
团队负载仪表盘:

Alice   ████████░░ 8/10  ⚠️ 接近满载
Bob     ██████░░░░ 6/10  ✅ 正常
Charlie ████░░░░░░ 4/10  ✅ 有空余

系统建议:
"Alice 负载较高，建议将新任务分配给 Charlie"
```

**成就系统**:

```
🏆 首次完成 OpenSpec 变更
🚀 一周内完成 3 个变更
🤝 成功协调一次冲突
⚡ 零冲突完成复杂变更
📊 连续 10 个变更文档同步率 100%
```

## 技术实现

### WebSocket 消息协议

```javascript
// 客户端 -> 服务端
{
  type: "CHANGE_STATUS",
  changeId: "add-auth",
  from: "active",
  to: "review",
  user: "alice",
  timestamp: "2026-03-29T10:30:00Z"
}

// 服务端 -> 客户端 (广播)
{
  type: "STATUS_UPDATED",
  changeId: "add-auth",
  status: "review",
  updatedBy: "alice",
  timestamp: "2026-03-29T10:30:00Z"
}

// 冲突检测
{
  type: "CONFLICT_DETECTED",
  conflictType: "section_overlap",
  changes: ["add-auth", "user-profile"],
  file: "specs/auth/user.md",
  section: "User Model",
  severity: "high",
  suggestions: [
    "Alice 先完成，Bob rebase",
    "拆分成两个独立的 specs"
  ]
}
```

### 冲突检测算法

```javascript
// 实时章节级冲突检测
function detectConflict(change1, change2) {
  const specs1 = parseSpecs(change1.files);
  const specs2 = parseSpecs(change2.files);

  const conflicts = [];

  // 检查文件级冲突
  for (const file1 of specs1.files) {
    const file2 = specs2.files.find((f) => f.path === file1.path);
    if (!file2) continue;

    // 检查章节级冲突
    for (const section1 of file1.sections) {
      const section2 = file2.sections.find((s) => s.id === section1.id);
      if (section2 && hasOverlap(section1.changes, section2.changes)) {
        conflicts.push({
          type: "section_overlap",
          file: file1.path,
          section: section1.id,
          severity: calculateSeverity(section1, section2),
        });
      }
    }
  }

  return conflicts;
}
```

### 状态同步策略

```javascript
// 乐观更新 + 最终一致性
class OptimisticUpdate {
  update(changeId, newStatus) {
    // 1. 立即更新本地状态（乐观）
    this.localState[changeId] = newStatus;
    this.render();

    // 2. 发送给服务端
    this.ws.send({
      type: "UPDATE_STATUS",
      changeId,
      status: newStatus,
    });

    // 3. 等待服务端确认
    // 如果冲突，回滚并提示
  }

  onServerResponse(response) {
    if (response.conflict) {
      // 回滚本地状态
      this.localState[changeId] = response.actualStatus;
      this.render();
      this.showConflictWarning(response);
    }
  }
}
```

## 部署架构

```
生产环境部署:

┌─────────────────────────────────────────────────────────────┐
│                        Load Balancer (Nginx)                │
└───────────────────────────────┬─────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼───────┐      ┌───────▼───────┐      ┌───────▼───────┐
│  WebSocket    │      │  WebSocket    │      │  WebSocket    │
│  Server 1     │      │  Server 2     │      │  Server 3     │
│               │      │               │      │               │
└───────┬───────┘      └───────┬───────┘      └───────┬───────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │      Redis Cluster    │
                    │  (Pub/Sub + State)    │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │    PostgreSQL         │
                    │    (Master-Slave)     │
                    └───────────────────────┘
```

## 实施路线

### Phase 1: MVP（2-3 周）

**核心功能**:

- WebSocket 基础架构
- 简单实时看板（状态同步）
- 基础冲突检测（文件级）
- 浏览器通知

**技术栈**:

- Socket.io (WebSocket)
- Express.js (API)
- React (前端)
- Redis (状态)
- PostgreSQL (持久化)

### Phase 2: 增强（2-3 周）

**新增功能**:

- 章节级冲突检测
- 在线用户列表
- 活动流
- Slack 集成

### Phase 3: 完善（2 周）

**新增功能**:

- 实时协同编辑（可选）
- 游戏化
- 移动端适配
- 性能优化

## 成本估算

**基础设施**:

```
WebSocket Server: 2-4 核, 4-8GB RAM × 2-3 台
Redis: 2 核, 4GB RAM
PostgreSQL: 2 核, 8GB RAM
Load Balancer: 1 台

预估: $200-500/月 (AWS/阿里云)
```

**开发成本**:

```
后端工程师: 1-2 人 × 2 个月
前端工程师: 1 人 × 2 个月
DevOps: 0.5 人 × 1 个月

预估: 4-6 人月
```

## 优势

1. **极致体验**
   - 毫秒级同步
   - 所见即所得
   - 无刷新更新

2. **精准协作**
   - 章节级冲突检测
   - 精准通知（不打扰无关人）
   - 在线状态透明

3. **高可扩展**
   - 支持 100+ 并发用户
   - 水平扩展架构
   - 微服务化设计

4. **数据驱动**
   - 完整的历史记录
   - 实时统计报表
   - 团队效率分析

## 局限

1. **高成本**
   - 开发成本高（4-6 人月）
   - 基础设施成本（$200-500/月）
   - 维护成本高

2. **复杂性**
   - 技术栈复杂
   - 需要专业运维
   - 故障排查困难

3. **风险**
   - WebSocket 连接不稳定
   - 分布式系统复杂性
   - 数据一致性挑战

## 适用场景

✅ **强烈推荐**:

- 团队规模 50+ 人
- 高频协作（每天 10+ 变更）
- 冲突频发，需要实时协调
- 有技术团队支持开发和维护
- 追求极致协作体验

❌ **不推荐**:

- 小团队（<20 人）
- 低频协作（每周几个变更）
- 预算有限
- 没有技术团队支持

## 渐进式实施建议

**建议路径**:

```
Month 1-2: 方案一 (GitLab 原生)
    ↓ 发现可视化不够
Month 3-4: 方案二 (Notion 看板)
    ↓ 发现实时性不够，冲突频发
Month 5+:  方案三 (实时协作)
```

**跳过条件**:

- 如果团队 < 30 人 → 停留在方案二
- 如果冲突很少 → 停留在方案二
- 如果没有技术资源 → 停留在方案二

## 开源替代方案

如果不想从头开发，可以考虑：

1. **Focalboard** (Mattermost 开源)
   - 自托管看板
   - 可二次开发
   - 社区活跃

2. **Wekan** (开源 Trello 替代品)
   - 功能完整
   - 支持 WebSocket
   - 可定制

3. **Planka** (轻量看板)
   - React + Node.js
   - 实时协作
   - 易于扩展

---

**回到**: [方案对比](README.md)
