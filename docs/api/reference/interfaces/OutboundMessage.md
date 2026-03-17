# Interface: OutboundMessage

Defined in: [niuma/types/message.ts:69](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L69)

出站消息（发送到任意渠道）

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="channel"></a> `channel` | `ChannelType` | 目标渠道类型 | [niuma/types/message.ts:71](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L71) |
| <a id="chatid"></a> `chatId` | `string` | 目标聊天/会话标识 | [niuma/types/message.ts:73](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L73) |
| <a id="content"></a> `content` | `string` | 消息内容（文本） | [niuma/types/message.ts:75](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L75) |
| <a id="media"></a> `media?` | [`MediaContent`](MediaContent.md)[] | 媒体附件 | [niuma/types/message.ts:79](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L79) |
| <a id="metadata"></a> `metadata?` | `Record`\<`string`, `unknown`\> | 附加元数据 | [niuma/types/message.ts:77](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L77) |
| <a id="replyto"></a> `replyTo?` | `string` | 要回复的消息 ID | [niuma/types/message.ts:81](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L81) |
