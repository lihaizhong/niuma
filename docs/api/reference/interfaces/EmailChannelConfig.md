# Interface: EmailChannelConfig

Defined in: [niuma/channels/email/index.ts:20](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/email/index.ts#L20)

Email 渠道配置

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="checkinterval"></a> `checkInterval?` | `number` | 邮件检查间隔（毫秒） | [niuma/channels/email/index.ts:41](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/email/index.ts#L41) |
| <a id="enabled"></a> `enabled?` | `boolean` | - | [niuma/channels/email/index.ts:21](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/email/index.ts#L21) |
| <a id="imap"></a> `imap?` | `object` | IMAP 配置（接收邮件） | [niuma/channels/email/index.ts:23](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/email/index.ts#L23) |
| `imap.host` | `string` | - | [niuma/channels/email/index.ts:24](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/email/index.ts#L24) |
| `imap.inbox?` | `string` | - | [niuma/channels/email/index.ts:29](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/email/index.ts#L29) |
| `imap.password` | `string` | - | [niuma/channels/email/index.ts:27](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/email/index.ts#L27) |
| `imap.port?` | `number` | - | [niuma/channels/email/index.ts:25](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/email/index.ts#L25) |
| `imap.secure?` | `boolean` | - | [niuma/channels/email/index.ts:28](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/email/index.ts#L28) |
| `imap.user` | `string` | - | [niuma/channels/email/index.ts:26](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/email/index.ts#L26) |
| <a id="smtp"></a> `smtp?` | `object` | SMTP 配置（发送邮件） | [niuma/channels/email/index.ts:32](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/email/index.ts#L32) |
| `smtp.from` | `string` | - | [niuma/channels/email/index.ts:38](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/email/index.ts#L38) |
| `smtp.host` | `string` | - | [niuma/channels/email/index.ts:33](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/email/index.ts#L33) |
| `smtp.password` | `string` | - | [niuma/channels/email/index.ts:37](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/email/index.ts#L37) |
| `smtp.port?` | `number` | - | [niuma/channels/email/index.ts:34](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/email/index.ts#L34) |
| `smtp.secure?` | `boolean` | - | [niuma/channels/email/index.ts:35](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/email/index.ts#L35) |
| `smtp.user` | `string` | - | [niuma/channels/email/index.ts:36](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/email/index.ts#L36) |
