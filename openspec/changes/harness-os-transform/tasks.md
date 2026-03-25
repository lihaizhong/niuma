# Harness OS Transformation - Tasks

## 1. Phase 1: 基础设施

### 1.1 依赖安装

- [x] 1.1.1 添加 `dockerode` 到 package.json
- [x] 1.1.2 添加 `@types/dockerode` 类型定义
- [ ] 1.1.3 验证 Docker 连接

### 1.2 沙箱环境模块

- [x] 1.2.1 创建 `niuma/agent/sandbox/manager.ts` - SandboxManager 类
- [x] 1.2.2 创建 `niuma/agent/sandbox/container.ts` - 容器封装
- [x] 1.2.3 创建 `niuma/agent/sandbox/interceptor.ts` - 工具拦截器
- [x] 1.2.4 创建沙箱配置 schema 和类型定义

### 1.3 SandboxExec 工具

- [x] 1.3.1 创建 `niuma/agent/tools/sandbox-exec.ts` - 沙箱执行工具
- [x] 1.3.2 更新 `niuma/agent/tools/registry.ts` 注册新工具
- [x] 1.3.3 添加单元测试

## 2. Phase 2: 任务追踪系统

### 2.1 任务追踪模块

- [x] 2.1.1 创建 `niuma/agent/task-tracker/types.ts` - 类型定义
- [x] 2.1.2 创建 `niuma/agent/task-tracker/store.ts` - PROGRESS.json 操作
- [x] 2.1.3 创建 `niuma/agent/task-tracker/index.ts` - TaskTracker 主类

### 2.2 任务工具

- [x] 2.2.1 创建 `niuma/agent/tools/task.ts` - start_task, complete_task 工具
- [x] 2.2.2 添加任务工具到 registry
- [x] 2.2.3 添加单元测试

## 3. Phase 3: 自验证循环

### 3.1 验证循环模块

- [x] 3.1.1 创建 `niuma/agent/verification/types.ts` - 类型定义
- [x] 3.1.2 创建 `niuma/agent/verification/loop.ts` - SelfVerification 主类
- [x] 3.1.3 创建 `niuma/agent/verification/error-injector.ts` - 错误注入

### 3.2 验证集成

- [x] 3.2.1 更新 `AgentLoop` 集成 SelfVerification
- [x] 3.2.2 添加验证配置到 schema
- [x] 3.2.3 添加集成测试

## 4. Phase 4: AGENTS.md 规则系统

### 4.1 规则管理模块

- [x] 4.1.1 创建 `niuma/agent/rules/types.ts` - 类型定义
- [x] 4.1.2 创建 `niuma/agent/rules/parser.ts` - 规则解析器
- [x] 4.1.3 创建 `niuma/agent/rules/writer.ts` - 规则追加器
- [x] 4.1.4 创建 `niuma/agent/rules/index.ts` - AgentsMdRules 主类

### 4.2 规则集成

- [x] 4.2.1 更新 `ContextBuilder` 注入 AGENTS.md 规则
- [ ] 4.2.2 更新错误处理自动追加规则
- [x] 4.2.3 添加单元测试

## 5. Phase 5: Human-in-the-Loop

### 5.1 审批模块

- [x] 5.1.1 创建 `niuma/agent/approval/types.ts` - 类型定义
- [x] 5.1.2 创建 `niuma/agent/approval/detector.ts` - 敏感操作检测
- [x] 5.1.3 创建 `niuma/agent/approval/request.ts` - 审批请求处理
- [x] 5.1.4 创建 `niuma/agent/approval/index.ts` - HumanInTheLoop 主类

### 5.2 审批集成

- [x] 5.2.1 更新 ToolRegistry 集成审批检测
- [ ] 5.2.2 添加渠道特定的审批界面
- [x] 5.2.3 添加审计日志功能

## 6. Phase 6: 上下文压缩

### 6.1 压缩模块

- [x] 6.1.1 创建 `niuma/agent/compaction/types.ts` - 类型定义
- [x] 6.1.2 创建 `niuma/agent/compaction/history.ts` - 历史压缩
- [x] 6.1.3 创建 `niuma/agent/compaction/offload.ts` - 输出卸载
- [x] 6.1.4 创建 `niuma/agent/compaction/index.ts` - ContextCompaction 主类

### 6.2 渐进披露

- [x] 6.2.1 更新 SkillsLoader 支持按需加载
- [x] 6.2.2 创建 skills 缓存管理
- [ ] 6.2.3 添加集成测试

## 7. Phase 7: Ralph Loops

### 7.1 循环引擎

- [x] 7.1.1 创建 `niuma/agent/ralph/types.ts` - 类型定义
- [x] 7.1.2 创建 `niuma/agent/ralph/index.ts` - RalphLoops 主类
- [x] 7.1.3 创建 `niuma/agent/ralph/checkpoint.ts` - 检查点管理

### 7.2 退出检测

- [x] 7.2.1 实现完成度检测
- [x] 7.2.2 实现空闲检测
- [x] 7.2.3 添加目标保存/恢复

## 8. Phase 8: Initializer-Executor 模式

### 8.1 架构模块

- [x] 8.1.1 创建 `niuma/agent/init-exec/types.ts` - 类型定义
- [x] 8.1.2 创建 `niuma/agent/init-exec/initializer.ts` - Initializer 类
- [x] 8.1.3 创建 `niuma/agent/init-exec/executor.ts` - Executor 类
- [x] 8.1.4 创建 `niuma/agent/init-exec/index.ts` - InitializerExecutor 主类

### 8.2 工具

- [x] 8.2.1 创建 `initialize_project` 工具
- [x] 8.2.2 创建 `execute_task` 工具
- [ ] 8.2.3 添加集成测试

## 9. Phase 9: 配置与集成

### 9.1 配置更新

- [x] 9.1.1 更新 config/schema.ts 添加 Harness 配置项
- [x] 9.1.2 更新 config/loader.ts 支持新配置
- [ ] 9.1.3 添加配置文档

### 9.2 AgentLoop 集成

- [x] 9.2.1 更新 AgentLoopOptions 添加 Harness 组件
- [ ] 9.2.2 更新 CLI 初始化 Harness 组件
- [ ] 9.2.3 添加端到端测试

## 10. 测试与文档

### 10.1 测试覆盖

- [x] 10.1.1 补充各模块单元测试
- [ ] 10.1.2 添加集成测试
- [x] 10.1.3 运行完整测试套件

### 10.2 文档

- [ ] 10.2.1 更新 docs/architecture-design.md
- [ ] 10.2.2 添加 Harness 使用指南
- [ ] 10.2.3 更新 CHANGELOG.md

---

## 完成状态

### 已完成集成 (Phase 9.2.1)

- [x] AgentLoop 集成 SelfVerification
- [x] AgentLoop 集成 HumanInTheLoop
- [x] AgentLoop 集成 AgentsMdRules
- [x] AgentLoop 集成 RalphLoops
- [x] AgentLoop 集成 ContextCompaction
- [x] ContextBuilder 集成 AgentsMdRules
- [x] 工具执行前集成 HumanInTheLoop 审批检测
- [x] SkillsLoader 渐进加载支持 (getCoreSkills, loadCoreSkills)
- [x] 创建 initialize_project 工具
- [x] 创建 execute_task 工具

---

## 依赖关系

```
Phase 1 (沙箱)
  ↓
Phase 2 (任务追踪)
  ↓
Phase 3 (自验证)
  ↓
Phase 4 (AGENTS.md)
  ↓
Phase 5 (Human-in-Loop)
  ↓
Phase 6 (上下文压缩)
  ↓
Phase 7 (Ralph Loops)
  ↓
Phase 8 (Initializer-Executor)
  ↓
Phase 9 (配置与集成)
```
