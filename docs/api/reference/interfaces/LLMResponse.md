# Interface: LLMResponse

Defined in: [niuma/types/llm.ts:88](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L88)

LLM 响应结构

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="content"></a> `content` | `string` | 响应内容（文本） | [niuma/types/llm.ts:90](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L90) |
| <a id="finishreason"></a> `finishReason?` | `string` | 完成原因 | [niuma/types/llm.ts:102](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L102) |
| <a id="hastoolcalls"></a> `hasToolCalls` | `boolean` | 是否有工具调用需要执行 | [niuma/types/llm.ts:94](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L94) |
| <a id="id"></a> `id?` | `string` | 提供商返回的响应 ID | [niuma/types/llm.ts:104](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L104) |
| <a id="model"></a> `model?` | `string` | 生成使用的模型 | [niuma/types/llm.ts:100](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L100) |
| <a id="reasoningcontent"></a> `reasoningContent?` | `string` | 推理内容（用于思维模型） | [niuma/types/llm.ts:96](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L96) |
| <a id="toolcalls"></a> `toolCalls?` | [`ToolCall`](ToolCall.md)[] | LLM 请求的工具调用 | [niuma/types/llm.ts:92](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L92) |
| <a id="usage"></a> `usage?` | `LLMUsage` | 使用统计 | [niuma/types/llm.ts:98](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L98) |
