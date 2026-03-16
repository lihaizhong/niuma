## 1. Setup and Infrastructure

- [x] 1.1 创建 heartbeat 模块目录结构
  - 创建 `niuma/heartbeat/` 目录
  - 创建 `service.ts`、`types.ts` 文件

- [x] 1.2 定义心跳服务类型和接口
  - 在 `types.ts` 中定义 `HeartbeatConfig` 接口（enabled, interval, filePath, taskTimeout）
  - 定义 `HeartbeatTask` 接口（name, status, output, error）
  - 定义 `HeartbeatResult` 接口（timestamp, successCount, failureCount, tasks）
  - 定义 `HeartbeatParseResult` 接口（config, tasks）

- [x] 1.3 更新配置 Schema
  - 在 `config/schema.ts` 中添加 `heartbeat` 配置段
  - 定义 heartbeat 配置的验证规则（使用 zod）
  - 添加默认值（enabled: false, interval: "0 */30 * * * *", taskTimeout: 300）

## 2. Core Implementation

- [x] 2.1 实现 HEARTBEAT.md 解析器
  - 在 `service.ts` 中实现 `parseHeartbeatFile()` 方法
  - 使用 gray-matter 解析 YAML Frontmatter
  - 解析 Markdown 任务列表（使用正则表达式或 markdown-it）
  - 验证解析结果，返回 `HeartbeatParseResult`
  - 处理文件不存在和格式错误的情况

- [x] 2.2 实现 HeartbeatService 类基础结构
  - 定义类属性：agent, config, cronJob, logger, isRunning
  - 实现 `constructor()` 接收 Agent 和配置
  - 实现 `start()` 方法启动心跳服务
  - 实现 `stop()` 方法停止心跳服务

- [x] 2.3 实现周期性调度逻辑
  - 在 `start()` 方法中使用 node-cron 创建 CronJob
  - 从配置或 HEARTBEAT.md 中读取 interval
  - 实现心跳检查的主循环方法 `checkHeartbeat()`
  - 添加调度错误处理和重试逻辑

- [x] 2.4 实现任务执行逻辑
  - 实现 `executeTasks()` 方法接收任务列表
  - 串行执行每个任务
  - 为每个任务设置超时保护（使用 Promise.race）
  - 捕获任务执行异常，记录错误但继续执行
  - 收集每个任务的执行结果

- [x] 2.5 实现心跳结果格式化
  - 实现 `formatHeartbeatResult()` 方法
  - 生成结构化的 Markdown 格式消息
  - 包含执行时间戳、成功/失败统计、每个任务的详细信息
  - 处理完全成功、部分失败、完全失败的不同情况

- [x] 2.6 实现结果发送逻辑
  - 实现 `sendHeartbeatResult()` 方法
  - 从 SessionManager 获取最近活跃的渠道
  - 使用 Agent 的消息发送功能发送结果
  - 处理渠道离线和发送失败的情况
  - 实现回退到 CLI 渠道的逻辑

## 3. Integration

- [x] 3.1 集成到 Agent Loop
  - 在 `agent/loop.ts` 中导入 HeartbeatService
  - 在 `AgentLoop` 类中添加 `heartbeatService` 属性
  - 在 `initialize()` 方法中启动心跳服务（如果配置启用）
  - 在 `shutdown()` 方法中停止心跳服务
  - 确保心跳服务异常不影响 Agent 关闭

- [x] 3.2 扩展 SessionManager
  - 在 `session/manager.ts` 中添加 `getLastActiveChannel()` 方法
  - 返回最近活跃的渠道信息
  - 处理无活跃渠道的情况

- [x] 3.3 更新配置加载
  - 确保 ConfigManager 正确加载 heartbeat 配置
  - 验证配置格式和默认值
  - 添加配置热更新支持（可选）

## 4. Error Handling and Logging

- [x] 4.1 实现日志记录
  - 在 HeartbeatService 中集成 pino logger
  - 记录心跳服务启动/停止事件
  - 记录每次心跳检查的执行
  - 记录每个任务的执行结果和错误
  - 记录消息发送状态

- [x] 4.2 实现错误处理
  - HEARTBEAT.md 解析错误处理（记录日志，继续运行）
  - 任务执行错误处理（捕获异常，继续下一个任务）
  - 消息发送错误处理（记录日志，不阻塞服务）
  - Cron 调度器错误处理（尝试重启或重新初始化）

- [x] 4.3 实现优雅降级
  - HEARTBEAT.md 文件不存在时跳过执行
  - 无活跃渠道时使用 CLI 渠道
  - 单个任务失败时继续执行其他任务
  - 心跳服务停止时等待正在执行的任务完成

## 5. Testing

- [ ] 5.1 编写单元测试
  - 测试 HEARTBEAT.md 解析器（正常、错误格式、文件不存在）
  - 测试 HeartbeatService 启动和停止
  - 测试任务执行逻辑（成功、失败、超时）
  - 测试结果格式化
  - 测试错误处理和日志记录

- [ ] 5.2 编写集成测试
  - 测试与 Agent Loop 的集成
  - 测试与 SessionManager 的集成
  - 测试完整的心跳流程（调度→解析→执行→发送）
  - 测试配置加载和验证

- [ ] 5.3 测试边界情况
  - 测试空任务列表
  - 测试大量任务执行
  - 测试长时间运行的任务
  - 测试并发启动/停止

## 6. Documentation

- [ ] 6.1 创建 HEARTBEAT.md 示例文件
  - 提供完整的配置示例
  - 提供各种任务的示例
  - 添加使用说明和最佳实践

- [ ] 6.2 更新项目文档
  - 在 `AGENTS.md` 中添加心跳服务说明
  - 在 `docs/niuma-development-plan.md` 中更新 Phase 6 状态
  - 在 `CHANGELOG.md` 中记录新功能

- [ ] 6.3 创建用户指南
  - 说明如何配置和使用心跳服务
  - 说明如何编写 HEARTBEAT.md
  - 提供常见问题和故障排查指南

## 7. Verification and Cleanup

- [x] 7.1 运行所有测试
  - 执行单元测试（pnpm test）
  - 执行集成测试
  - 确保所有测试通过

- [x] 7.2 代码审查
  - 检查代码风格（使用 ESLint）
  - 检查 TypeScript 类型（pnpm type-check）
  - 优化代码结构和性能

- [ ] 7.3 手动测试
  - 启动 Agent 并启用心跳服务
  - 创建 HEARTBEAT.md 文件并配置任务
  - 验证心跳服务按预期执行
  - 验证结果正确发送到渠道

- [ ] 7.4 归档变更
  - 使用 `/opsx:archive` 归档变更
  - 验证规格同步到 `openspec/specs/heartbeat-service/`
  - 更新开发计划文档