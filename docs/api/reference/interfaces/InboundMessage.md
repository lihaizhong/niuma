# Interface: InboundMessage

Defined in: [niuma/types/message.ts:43](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L43)

入站消息（从任意渠道接收）

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="channel"></a> `channel` | `ChannelType` | 渠道类型 | [niuma/types/message.ts:45](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L45) |
| <a id="chatid"></a> `chatId` | `string` | 聊天/会话标识 | [niuma/types/message.ts:49](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L49) |
| <a id="content"></a> `content` | `string` | 消息内容（文本） | [niuma/types/message.ts:51](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L51) |
| <a id="media"></a> `media?` | [`MediaContent`](MediaContent.md)[] | 媒体附件 | [niuma/types/message.ts:53](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L53) |
| <a id="messageid"></a> `messageId?` | `string` | 渠道原始消息 ID | [niuma/types/message.ts:61](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L61) |
| <a id="metadata"></a> `metadata?` | `Record`\<`string`, `unknown`\> | 渠道附加元数据 | [niuma/types/message.ts:55](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L55) |
| <a id="replyto"></a> `replyTo?` | `string` | 回复的消息 ID | [niuma/types/message.ts:63](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L63) |
| <a id="senderid"></a> `senderId` | `string` | 发送者标识 | [niuma/types/message.ts:47](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L47) |
| <a id="sessionkey"></a> `sessionKey?` | `string` | 会话键（用于对话跟踪） | [niuma/types/message.ts:57](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L57) |
| <a id="timestamp"></a> `timestamp?` | `number` | 消息时间戳 | [niuma/types/message.ts:59](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L59) |
