# Interface: SessionMessage

Defined in: [niuma/session/manager.ts:21](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L21)

会话消息结构
单条会话消息的完整信息

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="content"></a> `content` | `string` | 消息内容 | [niuma/session/manager.ts:25](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L25) |
| <a id="role"></a> `role` | `"system"` \| `"user"` \| `"assistant"` | 消息角色 | [niuma/session/manager.ts:23](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L23) |
| <a id="timestamp"></a> `timestamp` | `string` | 消息时间戳 (ISO 格式) | [niuma/session/manager.ts:27](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L27) |
| <a id="toolsused"></a> `toolsUsed?` | `string`[] | 使用的工具列表 | [niuma/session/manager.ts:29](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L29) |
