# Interface: ProviderLLMConfig

Defined in: [niuma/types/llm.ts:22](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L22)

LLM 配置

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="apibase"></a> `apiBase?` | `string` | API 基础 URL | [niuma/types/llm.ts:28](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L28) |
| <a id="apikey"></a> `apiKey?` | `string` | API 密钥（可通过环境变量设置） | [niuma/types/llm.ts:26](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L26) |
| <a id="extra"></a> `extra?` | `Record`\<`string`, `unknown`\> | 其他提供商特定选项 | [niuma/types/llm.ts:44](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L44) |
| <a id="frequencypenalty"></a> `frequencyPenalty?` | `number` | 频率惩罚（-2.0 到 2.0） | [niuma/types/llm.ts:38](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L38) |
| <a id="maxtokens"></a> `maxTokens?` | `number` | 最大生成 token 数 | [niuma/types/llm.ts:32](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L32) |
| <a id="model"></a> `model` | `string` | 模型标识符 | [niuma/types/llm.ts:24](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L24) |
| <a id="presencepenalty"></a> `presencePenalty?` | `number` | 存在惩罚（-2.0 到 2.0） | [niuma/types/llm.ts:40](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L40) |
| <a id="stopsequences"></a> `stopSequences?` | `string`[] | 停止序列 | [niuma/types/llm.ts:36](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L36) |
| <a id="temperature"></a> `temperature?` | `number` | 采样温度（0-2） | [niuma/types/llm.ts:30](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L30) |
| <a id="timeout"></a> `timeout?` | `number` | 请求超时时间（毫秒） | [niuma/types/llm.ts:42](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L42) |
| <a id="topp"></a> `topP?` | `number` | Top-p 采样参数 | [niuma/types/llm.ts:34](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L34) |
