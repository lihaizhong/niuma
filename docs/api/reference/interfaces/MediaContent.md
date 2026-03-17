# Interface: MediaContent

Defined in: [niuma/types/message.ts:23](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L23)

媒体内容类型

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="data"></a> `data?` | `string` | Base64 编码数据 | [niuma/types/message.ts:29](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L29) |
| <a id="filename"></a> `filename?` | `string` | 文件名 | [niuma/types/message.ts:33](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L33) |
| <a id="metadata"></a> `metadata?` | `Record`\<`string`, `unknown`\> | 附加元数据 | [niuma/types/message.ts:37](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L37) |
| <a id="mimetype"></a> `mimeType?` | `string` | MIME 类型 | [niuma/types/message.ts:31](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L31) |
| <a id="size"></a> `size?` | `number` | 文件大小（字节） | [niuma/types/message.ts:35](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L35) |
| <a id="type"></a> `type` | `"image"` \| `"video"` \| `"audio"` \| `"document"` \| `"file"` | 媒体类型（图片、视频、音频、文档等） | [niuma/types/message.ts:25](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L25) |
| <a id="url"></a> `url?` | `string` | 媒体 URL 或 base64 数据 | [niuma/types/message.ts:27](https://github.com/lihaizhong/niuma/blob/main/niuma/types/message.ts#L27) |
