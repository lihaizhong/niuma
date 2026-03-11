# 提案：同步配置系统规格与实现

## 问题

当前 openspec 规格与实际实现存在偏差：

1. **ProviderConfigSchema 参数不完整**
   - 规格（`config-system/spec.md`）只定义了 `model`、`apiKey`、`apiBase`、`extra` 字段
   - 实际实现（`niuma/config/schema.ts`）已支持更多 LLM 参数：`temperature`、`maxTokens`、`topP`、`stopSequences`、`frequencyPenalty`、`presencePenalty`、`timeout`

2. **LLMProvider ChatOptions 参数不完整**
   - 规格（`llm-provider/spec.md`）中的 `ChatOptions` 只包含 `model`、`temperature`、`maxTokens`
   - 实际实现支持更多参数，规格未更新

## 目标

更新 openspec 规格以反映当前实现中 ProviderConfigSchema 支持的完整 LLM 参数集合。

## 非目标

- 不修改现有代码实现
- 不添加新的 LLM 参数
- 不改变现有参数的行为

## 验收标准

- [ ] `config-system/spec.md` 更新 `ProviderConfigSchema` 定义，包含所有支持的 LLM 参数
- [ ] `llm-provider/spec.md` 更新 `ChatOptions` 和相关类型定义
- [ ] 所有参数的约束条件（范围、类型）与实际实现一致
- [ ] 示例配置文件展示如何使用这些参数