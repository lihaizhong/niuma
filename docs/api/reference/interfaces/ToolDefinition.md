# Interface: ToolDefinition

Defined in: [niuma/types/tool.ts:30](https://github.com/lihaizhong/niuma/blob/main/niuma/types/tool.ts#L30)

工具定义（用于 LLM 函数调用）

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="description"></a> `description` | `string` | [niuma/types/tool.ts:32](https://github.com/lihaizhong/niuma/blob/main/niuma/types/tool.ts#L32) |
| <a id="name"></a> `name` | `string` | [niuma/types/tool.ts:31](https://github.com/lihaizhong/niuma/blob/main/niuma/types/tool.ts#L31) |
| <a id="parameters"></a> `parameters` | \| [`ToolParameterSchema`](ToolParameterSchema.md) \| `ZodType`\<`unknown`, `unknown`, `$ZodTypeInternals`\<`unknown`, `unknown`\>\> | [niuma/types/tool.ts:33](https://github.com/lihaizhong/niuma/blob/main/niuma/types/tool.ts#L33) |
