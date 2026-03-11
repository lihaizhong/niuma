# 设计：同步配置系统规格与实现

## 架构变更

本次变更只涉及规格文档的更新，不涉及代码修改。架构保持不变。

## 设计决策

### 1. 参数分类

将 LLM 参数分为以下几类：

**基础参数**：
- `model` - 模型标识符
- `apiKey` - API 密钥
- `apiBase` - API 基础 URL

**生成控制参数**：
- `temperature` (0-2) - 采样温度
- `maxTokens` - 最大生成 token 数
- `topP` (0-1) - Top-p 采样参数
- `stopSequences` (string[]) - 停止序列

**惩罚参数**：
- `frequencyPenalty` (-2 到 2) - 频率惩罚
- `presencePenalty` (-2 到 2) - 存在惩罚

**其他参数**：
- `timeout` - 请求超时时间（毫秒）
- `extra` - 其他提供商特定选项

### 2. 参数约束

每个参数都有明确的约束条件：

| 参数 | 类型 | 约束 | 说明 |
|------|------|------|------|
| temperature | number | 0-2 | 值越高输出越随机 |
| maxTokens | number | 正整数 | 最大生成 token 数 |
| topP | number | 0-1 | 控制文本多样性 |
| stopSequences | string[] | 非空数组 | 遇到这些字符串时停止生成 |
| frequencyPenalty | number | -2 到 2 | 降低重复词汇的概率 |
| presencePenalty | number | -2 到 2 | 鼓励谈论新话题 |
| timeout | number | 正整数 | 请求超时时间（毫秒） |

### 3. 配置覆盖策略

角色配置中的 `providers` 字段使用深度合并策略，可以覆盖全局配置中的任何参数：

```json5
{
  "providers": {
    "openai": {
      "model": "gpt-4o",
      "temperature": 0.7,
      "topP": 0.9,
      "maxTokens": 3000
    }
  }
}
```

## 权衡考虑

### 完整性 vs 简洁性

**决策**：选择完整性，在规格中定义所有支持的参数

**理由**：
- 确保规格与实现一致
- 避免用户发现实现支持但规格未定义的参数
- 为未来扩展提供清晰的文档

### 参数分组

**决策**：不显式分组，保持扁平结构

**理由**：
- 简化配置文件结构
- 与 LangChain/OpenAI API 的参数命名保持一致
- 便于用户理解和使用

## 参考实现

参考以下文件中的实际实现：

- `niuma/config/schema.ts` - ProviderConfigSchema 定义
- `niuma/types/llm.ts` - LLMConfig 和 ChatOptions 类型定义
- `niuma/providers/openai.ts` - OpenAI 提供商实现
- `niuma/niuma.json.example` - 配置文件示例