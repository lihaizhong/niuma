# Interface: ProviderRegistry

Defined in: [niuma/providers/registry.ts:47](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L47)

提供商注册表

管理提供商的注册、查询和自动选择。

## Methods

### clearConfigs()

```ts
clearConfigs(): void;
```

Defined in: [niuma/providers/registry.ts:415](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L415)

清除所有配置

用于测试或重新初始化

#### Returns

`void`

***

### clearInstances()

```ts
clearInstances(): void;
```

Defined in: [niuma/providers/registry.ts:406](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L406)

清除所有提供商实例

用于测试或重新初始化

#### Returns

`void`

***

### clearSpecs()

```ts
clearSpecs(): void;
```

Defined in: [niuma/providers/registry.ts:435](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L435)

清除所有提供商规格

用于测试，清除所有规格、实例和配置

#### Returns

`void`

***

### createProvider()

```ts
createProvider(name, config): LLMProvider;
```

Defined in: [niuma/providers/registry.ts:206](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L206)

创建提供商实例

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | 提供商名称 |
| `config` | [`ProviderLLMConfig`](ProviderLLMConfig.md) | 提供商配置 |

#### Returns

[`LLMProvider`](LLMProvider.md)

提供商实例

#### Throws

如果提供商不存在

***

### getDefaultProvider()

```ts
getDefaultProvider(): LLMProvider | undefined;
```

Defined in: [niuma/providers/registry.ts:148](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L148)

获取默认提供商

#### Returns

[`LLMProvider`](LLMProvider.md) \| `undefined`

默认提供商实例，如果未设置返回第一个注册的提供商

***

### getProvider()

```ts
getProvider(model): LLMProvider | undefined;
```

Defined in: [niuma/providers/registry.ts:103](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L103)

根据模型名获取提供商

智能匹配提供商，优先级：
1. 显式指定（如 "openai/gpt-4o"）
2. 关键词匹配（如 "gpt-4o" → OpenAI）
3. 网关回退（如 OpenRouter）
4. 默认提供商

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | `string` | 模型名 |

#### Returns

[`LLMProvider`](LLMProvider.md) \| `undefined`

提供商实例，如果未找到返回 undefined

***

### getProviderByName()

```ts
getProviderByName(name): LLMProvider | undefined;
```

Defined in: [niuma/providers/registry.ts:136](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L136)

根据名称获取提供商

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | 提供商名称 |

#### Returns

[`LLMProvider`](LLMProvider.md) \| `undefined`

提供商实例，如果未找到返回 undefined

***

### getProviderConfig()

```ts
getProviderConfig(name): ProviderLLMConfig | undefined;
```

Defined in: [niuma/providers/registry.ts:397](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L397)

获取提供商配置

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | 提供商名称 |

#### Returns

[`ProviderLLMConfig`](ProviderLLMConfig.md) \| `undefined`

提供商配置，如果未设置返回 undefined

***

### listAvailableProviders()

```ts
listAvailableProviders(): ProviderSpec[];
```

Defined in: [niuma/providers/registry.ts:190](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L190)

获取所有可用提供商

返回所有配置了 API 密钥的提供商

#### Returns

[`ProviderSpec`](ProviderSpec.md)[]

可用的提供商规格数组

***

### listProviders()

```ts
listProviders(): ProviderSpec[];
```

Defined in: [niuma/providers/registry.ts:180](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L180)

获取所有提供商规格

#### Returns

[`ProviderSpec`](ProviderSpec.md)[]

提供商规格数组

***

### register()

```ts
register(spec): void;
```

Defined in: [niuma/providers/registry.ts:73](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L73)

注册提供商规格

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | [`ProviderSpec`](ProviderSpec.md) | 提供商规格 |

#### Returns

`void`

#### Throws

如果已存在同名提供商，发出警告并覆盖

***

### registerMultiple()

```ts
registerMultiple(specs): void;
```

Defined in: [niuma/providers/registry.ts:85](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L85)

批量注册提供商规格

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `specs` | [`ProviderSpec`](ProviderSpec.md)[] | 提供商规格数组 |

#### Returns

`void`

***

### reset()

```ts
reset(): void;
```

Defined in: [niuma/providers/registry.ts:424](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L424)

重置注册表

清除所有实例和配置，但保留规格

#### Returns

`void`

***

### setDefaultProvider()

```ts
setDefaultProvider(name): void;
```

Defined in: [niuma/providers/registry.ts:168](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L168)

设置默认提供商

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | 提供商名称 |

#### Returns

`void`

#### Throws

如果提供商不存在

***

### setProviderConfig()

```ts
setProviderConfig(name, config): void;
```

Defined in: [niuma/providers/registry.ts:387](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L387)

设置提供商配置

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | 提供商名称 |
| `config` | [`ProviderLLMConfig`](ProviderLLMConfig.md) | 提供商配置 |

#### Returns

`void`
