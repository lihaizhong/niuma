## 1. 创建目录结构

- [x] 1.1 创建 `niuma/agent/subagent/` 目录
- [x] 1.2 创建 `niuma/agent/subagent/types.ts` 提取共享类型

## 2. 实现 SubagentExecutor

- [x] 2.1 创建 `niuma/agent/subagent/executor.ts`
- [x] 2.2 实现 `execute()` 方法（LLM 循环逻辑）
- [x] 2.3 实现 `getIsolatedTools()` 方法（工具隔离）
- [x] 2.4 实现 `buildSystemPrompt()` 方法（构建提示词）

## 3. 重构 SubagentManager

- [x] 3.1 创建 `niuma/agent/subagent/manager.ts`
- [x] 3.2 移除执行逻辑，保留管理职责
- [x] 3.3 注入 SubagentExecutor 依赖
- [x] 3.4 实现 `spawn()` 委托给 Executor
- [x] 3.5 实现 `cancel()`、`list()`、`wait()` 方法

## 4. 实现 SpawnTool

- [x] 4.1 更新 `niuma/agent/tools/spawn.ts` 实现
- [x] 4.2 添加全局上下文函数 `setGlobalManager()`/`getGlobalManager()`
- [x] 4.3 实现 `execute()` 调用 SubagentManager

## 5. 更新导出和注册

- [x] 5.1 创建 `niuma/agent/subagent/index.ts` 统一导出
- [x] 5.2 删除旧的 `niuma/agent/subagent.ts`
- [x] 5.3 在 `registry.ts` 注册 spawnTool
- [x] 5.4 更新所有导入路径

## 6. 更新测试

- [x] 6.1 更新 `niuma/__tests__/agent-subagent.test.ts` 适配新接口
- [x] 6.2 添加 SubagentExecutor 测试用例
- [x] 6.3 更新工具数量断言

## 7. 验证

- [x] 7.1 运行测试确保无回归 - 564 测试通过
- [x] 7.2 运行 TypeScript 编译检查类型 - 无新增错误
- [x] 7.3 运行 ESLint 检查代码风格 - 已自动修复
