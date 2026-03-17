# Interface: ChatOptions

Defined in: [niuma/types/llm.ts:142](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L142)

聊天调用选项

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="frequencypenalty"></a> `frequencyPenalty?` | `number` | 频率惩罚（-2.0 到 2.0） | [niuma/types/llm.ts:158](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L158) |
| <a id="maxtokens"></a> `maxTokens?` | `number` | 最大生成 token 数 | [niuma/types/llm.ts:152](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L152) |
| <a id="messages"></a> `messages` | [`ChatMessage`](ChatMessage.md)[] | 消息列表 | [niuma/types/llm.ts:144](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L144) |
| <a id="model"></a> `model?` | `string` | 模型（覆盖默认） | [niuma/types/llm.ts:148](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L148) |
| <a id="presencepenalty"></a> `presencePenalty?` | `number` | 存在惩罚（-2.0 到 2.0） | [niuma/types/llm.ts:160](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L160) |
| <a id="stopsequences"></a> `stopSequences?` | `string`[] | 停止序列 | [niuma/types/llm.ts:156](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L156) |
| <a id="temperature"></a> `temperature?` | `number` | 采样温度 | [niuma/types/llm.ts:150](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L150) |
| <a id="timeout"></a> `timeout?` | `number` | 请求超时时间（毫秒） | [niuma/types/llm.ts:162](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L162) |
| <a id="tools"></a> `tools?` | [`ToolDefinition`](ToolDefinition.md)[] | 工具定义 | [niuma/types/llm.ts:146](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L146) |
| <a id="topp"></a> `topP?` | `number` | Top-p 采样参数 | [niuma/types/llm.ts:154](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L154) |
