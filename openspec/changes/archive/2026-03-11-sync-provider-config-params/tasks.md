# 任务清单

## 1. 更新 config-system 规格
- [x] 1.1 在 `openspec/changes/archive/2026-03-10-core-infrastructure/specs/config-system/spec.md` 中更新 `ProviderConfigSchema` 定义
- [x] 1.2 添加所有支持的 LLM 参数字段及其约束条件
- [x] 1.3 添加 TypeScript 接口定义，包含完整参数列表

## 2. 更新 llm-provider 规格
- [x] 2.1 在 `openspec/changes/archive/2026-03-10-phase2-agent-core/specs/llm-provider/spec.md` 中更新 `ChatOptions` 接口
- [x] 2.2 添加缺失的参数：`topP`、`stopSequences`、`frequencyPenalty`、`presencePenalty`、`timeout`
- [x] 2.3 更新 `LLMConfig` 接口定义

## 3. 验证规格一致性
- [x] 3.1 检查所有参数的约束条件是否与 `niuma/config/schema.ts` 一致
- [x] 3.2 检查所有参数的类型定义是否与 `niuma/types/llm.ts` 一致
- [x] 3.3 确保示例配置文件与实际实现匹配

## 4. 更新示例配置
- [x] 4.1 验证 `niuma/niuma.json.example` 中展示了如何使用所有参数
- [x] 4.2 为不同角色设置不同的参数组合作为示例