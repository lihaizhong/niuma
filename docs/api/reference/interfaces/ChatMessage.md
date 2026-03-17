# Interface: ChatMessage

Defined in: [niuma/types/llm.ts:70](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L70)

对话历史的聊天消息

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="content"></a> `content` | `string` \| `MessageContentPart`[] | 消息内容（字符串或多部分内容） | [niuma/types/llm.ts:74](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L74) |
| <a id="name"></a> `name?` | `string` | 工具消息的名称 | [niuma/types/llm.ts:76](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L76) |
| <a id="reasoningcontent"></a> `reasoningContent?` | `string` | 推理内容（用于思维模型，如 DeepSeek） | [niuma/types/llm.ts:82](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L82) |
| <a id="role"></a> `role` | `ChatRole` | 消息角色 | [niuma/types/llm.ts:72](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L72) |
| <a id="toolcallid"></a> `toolCallId?` | `string` | 工具消息的调用 ID | [niuma/types/llm.ts:78](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L78) |
| <a id="toolcalls"></a> `toolCalls?` | [`ToolCall`](ToolCall.md)[] | 助手的工具调用 | [niuma/types/llm.ts:80](https://github.com/lihaizhong/niuma/blob/main/niuma/types/llm.ts#L80) |
