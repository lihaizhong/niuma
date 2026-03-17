# Class: ToolRegistry

Defined in: [niuma/agent/tools/registry.ts:104](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/registry.ts#L104)

工具注册中心
参考 nanobot 的简洁设计

## Constructors

### Constructor

```ts
new ToolRegistry(): ToolRegistry;
```

#### Returns

`ToolRegistry`

## Accessors

### size

#### Get Signature

```ts
get size(): number;
```

Defined in: [niuma/agent/tools/registry.ts:202](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/registry.ts#L202)

获取注册工具数量

##### Returns

`number`

***

### toolNames

#### Get Signature

```ts
get toolNames(): string[];
```

Defined in: [niuma/agent/tools/registry.ts:154](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/registry.ts#L154)

获取所有工具名称

##### Returns

`string`[]

## Methods

### execute()

```ts
execute(name, params): Promise<string>;
```

Defined in: [niuma/agent/tools/registry.ts:171](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/registry.ts#L171)

执行工具

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | 工具名称 |
| `params` | `Record`\<`string`, `unknown`\> | 参数 |

#### Returns

`Promise`\<`string`\>

执行结果字符串（错误信息也包含在字符串中）

***

### get()

```ts
get(name): ITool<unknown, string> | undefined;
```

Defined in: [niuma/agent/tools/registry.ts:140](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/registry.ts#L140)

获取工具

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

[`ITool`](../interfaces/ITool.md)\<`unknown`, `string`\> \| `undefined`

***

### getAgentId()

```ts
getAgentId(): string;
```

Defined in: [niuma/agent/tools/registry.ts:118](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/registry.ts#L118)

获取当前 Agent ID

#### Returns

`string`

***

### getDefinitions()

```ts
getDefinitions(): ToolDefinition[];
```

Defined in: [niuma/agent/tools/registry.ts:161](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/registry.ts#L161)

获取所有工具的定义

#### Returns

[`ToolDefinition`](../interfaces/ToolDefinition.md)[]

***

### has()

```ts
has(name): boolean;
```

Defined in: [niuma/agent/tools/registry.ts:147](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/registry.ts#L147)

检查工具是否已注册

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`boolean`

***

### register()

```ts
register(tool): this;
```

Defined in: [niuma/agent/tools/registry.ts:125](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/registry.ts#L125)

注册工具

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `tool` | [`ITool`](../interfaces/ITool.md) |

#### Returns

`this`

***

### setAgentId()

```ts
setAgentId(agentId): void;
```

Defined in: [niuma/agent/tools/registry.ts:111](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/registry.ts#L111)

设置当前 Agent ID

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `agentId` | `string` |

#### Returns

`void`

***

### unregister()

```ts
unregister(name): void;
```

Defined in: [niuma/agent/tools/registry.ts:133](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/tools/registry.ts#L133)

注销工具

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`void`
