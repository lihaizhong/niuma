## 1. 删除 SpawnTool 代码

- [ ] 1.1 从 `niuma/agent/tools/agent.ts` 删除 SpawnTool 类
- [ ] 1.2 删除未使用的类型定义 (SubagentConfig, SubagentStatus, ModelConfig, AgentMessage)
- [ ] 1.3 删除未使用的变量 (subagents, agentMessages)
- [ ] 1.4 从 `niuma/agent/tools/registry.ts` 移除 spawnTool 注册

## 2. 更新测试文件

- [ ] 2.1 从 `niuma/__tests__/agent-tools.test.ts` 删除 SpawnTool 测试用例
- [ ] 2.2 从 `niuma/__tests__/tools-acceptance.test.ts` 删除 SpawnTool 相关断言
- [ ] 2.3 从 `niuma/__tests__/integration-context.test.ts` 删除 SpawnTool 集成测试

## 3. 更新文档

- [ ] 3.1 从 `docs/tool-security-guide.md` 删除 SpawnTool 示例
- [ ] 3.2 从 `docs/tool-usage-examples.md` 删除 SpawnTool 示例

## 4. 删除规格

- [ ] 4.1 删除 `openspec/specs/agent-spawn-tool/` 目录

## 5. 验证

- [ ] 5.1 运行所有测试确保无回归
- [ ] 5.2 运行 ESLint 检查代码质量
- [ ] 5.3 运行 TypeScript 编译检查类型
