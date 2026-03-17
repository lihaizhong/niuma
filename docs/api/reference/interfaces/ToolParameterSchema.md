# Interface: ToolParameterSchema

Defined in: [niuma/types/tool.ts:10](https://github.com/lihaizhong/niuma/blob/main/niuma/types/tool.ts#L10)

工具参数 Schema 定义（JSON Schema 格式）

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="default"></a> `default?` | `unknown` | [niuma/types/tool.ts:24](https://github.com/lihaizhong/niuma/blob/main/niuma/types/tool.ts#L24) |
| <a id="description"></a> `description?` | `string` | [niuma/types/tool.ts:19](https://github.com/lihaizhong/niuma/blob/main/niuma/types/tool.ts#L19) |
| <a id="enum"></a> `enum?` | `string`[] | [niuma/types/tool.ts:20](https://github.com/lihaizhong/niuma/blob/main/niuma/types/tool.ts#L20) |
| <a id="items"></a> `items?` | `ToolParameterSchema` | [niuma/types/tool.ts:23](https://github.com/lihaizhong/niuma/blob/main/niuma/types/tool.ts#L23) |
| <a id="properties"></a> `properties?` | `Record`\<`string`, `ToolParameterSchema`\> | [niuma/types/tool.ts:21](https://github.com/lihaizhong/niuma/blob/main/niuma/types/tool.ts#L21) |
| <a id="required"></a> `required?` | `string`[] | [niuma/types/tool.ts:22](https://github.com/lihaizhong/niuma/blob/main/niuma/types/tool.ts#L22) |
| <a id="type"></a> `type?` | `"string"` \| `"number"` \| `"boolean"` \| `"object"` \| `"null"` \| `"array"` \| `"integer"` | [niuma/types/tool.ts:11](https://github.com/lihaizhong/niuma/blob/main/niuma/types/tool.ts#L11) |
