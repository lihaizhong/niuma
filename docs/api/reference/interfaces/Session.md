# Interface: Session

Defined in: [niuma/session/manager.ts:36](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L36)

会话数据结构
会话的完整状态信息

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="channel"></a> `channel?` | `string` | 渠道类型 | [niuma/session/manager.ts:48](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L48) |
| <a id="chatid"></a> `chatId?` | `string` | 聊天标识 | [niuma/session/manager.ts:52](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L52) |
| <a id="createdat"></a> `createdAt` | `Date` | 创建时间 | [niuma/session/manager.ts:44](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L44) |
| <a id="key"></a> `key` | `string` | 会话唯一标识 | [niuma/session/manager.ts:38](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L38) |
| <a id="lastactiveat"></a> `lastActiveAt?` | `Date` | 最后活跃时间 | [niuma/session/manager.ts:56](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L56) |
| <a id="lastconsolidated"></a> `lastConsolidated` | `number` | 上次整合时间戳（用于记忆压缩） | [niuma/session/manager.ts:42](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L42) |
| <a id="messages"></a> `messages` | [`SessionMessage`](SessionMessage.md)[] | 消息列表 | [niuma/session/manager.ts:40](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L40) |
| <a id="metadata"></a> `metadata?` | `Record`\<`string`, `unknown`\> | 元数据 | [niuma/session/manager.ts:54](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L54) |
| <a id="updatedat"></a> `updatedAt` | `Date` | 更新时间 | [niuma/session/manager.ts:46](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L46) |
| <a id="userid"></a> `userId?` | `string` | 用户标识 | [niuma/session/manager.ts:50](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L50) |
