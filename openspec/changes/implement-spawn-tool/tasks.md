## 1. 添加全局上下文支持

- [ ] 1.1 在 `niuma/agent/tools/context.ts` 添加 SubagentManager 相关函数
- [ ] 1.2 导出 setGlobalSubagentManager 和 getGlobalSubagentManager

## 2. 实现 SpawnTool

- [ ] 2.1 创建 `niuma/agent/tools/spawn.ts` 文件
- [ ] 2.2 实现 SpawnTool 类继承 BaseTool
- [ ] 2.3 定义工具参数 schema (task, label)
- [ ] 2.4 实现 execute 方法调用 SubagentManager.spawn()

## 3. 注册工具

- [ ] 3.1 在 `niuma/agent/tools/registry.ts` 导入 spawnTool
- [ ] 3.2 在默认注册中添加 spawnTool

## 4. 编写测试

- [ ] 4.1 创建 `niuma/__tests__/spawn-tool.test.ts`
- [ ] 4.2 测试成功创建任务
- [ ] 4.3 测试缺少必填参数
- [ ] 4.4 测试并发限制
- [ ] 4.5 测试 SubagentManager 不可用场景

## 5. 验证

- [ ] 5.1 运行所有测试确保无回归
- [ ] 5.2 运行 TypeScript 编译检查类型
