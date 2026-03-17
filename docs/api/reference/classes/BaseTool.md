# Abstract Class: BaseTool\<TInput, TOutput\>

Defined in: [niuma/agent/tools/base.ts:50](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/base.ts#L50)

工具抽象基类

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TInput` | `unknown` |
| `TOutput` | `string` |

## Implements

- [`ITool`](../interfaces/ITool.md)\<`TInput`, `TOutput`\>

## Constructors

### Constructor

```ts
new BaseTool<TInput, TOutput>(): BaseTool<TInput, TOutput>;
```

#### Returns

`BaseTool`\<`TInput`, `TOutput`\>

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="description"></a> `description` | `abstract` | `string` | [niuma/agent/tools/base.ts:55](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/base.ts#L55) |
| <a id="name"></a> `name` | `abstract` | `string` | [niuma/agent/tools/base.ts:54](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/base.ts#L54) |
| <a id="parameters"></a> `parameters` | `abstract` | `ZodType`\<`TInput`\> | [niuma/agent/tools/base.ts:56](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/base.ts#L56) |

## Methods

### execute()

```ts
abstract execute(args): Promise<TOutput>;
```

Defined in: [niuma/agent/tools/base.ts:117](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/base.ts#L117)

执行工具（必须由子类实现）

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `TInput` |

#### Returns

`Promise`\<`TOutput`\>

#### Implementation of

[`ITool`](../interfaces/ITool.md).[`execute`](../interfaces/ITool.md#execute)

***

### getAgentId()

```ts
protected getAgentId(): string;
```

Defined in: [niuma/agent/tools/base.ts:61](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/base.ts#L61)

获取当前 Agent ID

#### Returns

`string`

***

### getDefinition()

```ts
getDefinition(): ToolDefinition;
```

Defined in: [niuma/agent/tools/base.ts:76](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/base.ts#L76)

获取工具定义（内部格式）

#### Returns

[`ToolDefinition`](../interfaces/ToolDefinition.md)

#### Implementation of

[`ITool`](../interfaces/ITool.md).[`getDefinition`](../interfaces/ITool.md#getdefinition)

***

### getSessionManager()

```ts
protected getSessionManager(): SessionManager | null;
```

Defined in: [niuma/agent/tools/base.ts:69](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/base.ts#L69)

获取会话管理器

#### Returns

[`SessionManager`](SessionManager.md) \| `null`

***

### toSchema()

```ts
toSchema(): OpenAIToolSchema;
```

Defined in: [niuma/agent/tools/base.ts:87](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/base.ts#L87)

转换为 OpenAI 函数 Schema 格式

#### Returns

`OpenAIToolSchema`

#### Implementation of

[`ITool`](../interfaces/ITool.md).[`toSchema`](../interfaces/ITool.md#toschema)

***

### validateArgs()

```ts
validateArgs(args): TInput;
```

Defined in: [niuma/agent/tools/base.ts:106](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/base.ts#L106)

验证输入参数

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `unknown` |

#### Returns

`TInput`

#### Implementation of

[`ITool`](../interfaces/ITool.md).[`validateArgs`](../interfaces/ITool.md#validateargs)
