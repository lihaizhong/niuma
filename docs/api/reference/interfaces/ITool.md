# Interface: ITool\<TInput, TOutput\>

Defined in: [niuma/agent/tools/base.ts:21](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/base.ts#L21)

所有工具必须实现的接口

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TInput` | `unknown` |
| `TOutput` | `string` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="description"></a> `description` | `readonly` | `string` | [niuma/agent/tools/base.ts:23](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/base.ts#L23) |
| <a id="name"></a> `name` | `readonly` | `string` | [niuma/agent/tools/base.ts:22](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/base.ts#L22) |
| <a id="parameters"></a> `parameters` | `readonly` | `ZodType`\<`TInput`\> | [niuma/agent/tools/base.ts:24](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/base.ts#L24) |

## Methods

### execute()

```ts
execute(args): Promise<TOutput>;
```

Defined in: [niuma/agent/tools/base.ts:29](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/base.ts#L29)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `TInput` |

#### Returns

`Promise`\<`TOutput`\>

***

### getDefinition()

```ts
getDefinition(): ToolDefinition;
```

Defined in: [niuma/agent/tools/base.ts:26](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/base.ts#L26)

#### Returns

[`ToolDefinition`](ToolDefinition.md)

***

### toSchema()

```ts
toSchema(): OpenAIToolSchema;
```

Defined in: [niuma/agent/tools/base.ts:27](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/base.ts#L27)

#### Returns

`OpenAIToolSchema`

***

### validateArgs()

```ts
validateArgs(args): TInput;
```

Defined in: [niuma/agent/tools/base.ts:28](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/base.ts#L28)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `unknown` |

#### Returns

`TInput`
