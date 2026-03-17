# Class: ChannelRegistry

Defined in: [niuma/channels/registry.ts:32](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/registry.ts#L32)

渠道注册表
管理所有已注册的渠道

## Constructors

### Constructor

```ts
new ChannelRegistry(): ChannelRegistry;
```

#### Returns

`ChannelRegistry`

## Methods

### checkHealth()

```ts
checkHealth(channelTypes?): Promise<Map<string, boolean>>;
```

Defined in: [niuma/channels/registry.ts:173](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/registry.ts#L173)

检查渠道健康状态

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `channelTypes?` | `string`[] | 要检查的渠道类型列表，如果不指定则检查所有渠道 |

#### Returns

`Promise`\<`Map`\<`string`, `boolean`\>\>

健康状态映射表

***

### clear()

```ts
clear(): Promise<void>;
```

Defined in: [niuma/channels/registry.ts:244](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/registry.ts#L244)

清空所有渠道
停止所有渠道并清空注册表

#### Returns

`Promise`\<`void`\>

***

### get()

```ts
get(channelType): BaseChannel | undefined;
```

Defined in: [niuma/channels/registry.ts:84](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/registry.ts#L84)

获取渠道

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `channelType` | `string` | 渠道类型 |

#### Returns

[`BaseChannel`](BaseChannel.md) \| `undefined`

渠道实例，如果不存在则返回 undefined

***

### getAll()

```ts
getAll(): Map<string, BaseChannel>;
```

Defined in: [niuma/channels/registry.ts:92](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/registry.ts#L92)

获取所有渠道

#### Returns

`Map`\<`string`, [`BaseChannel`](BaseChannel.md)\>

所有渠道的映射表

***

### getAllStatuses()

```ts
getAllStatuses(): Map<string, ChannelStatus>;
```

Defined in: [niuma/channels/registry.ts:219](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/registry.ts#L219)

获取所有渠道状态

#### Returns

`Map`\<`string`, [`ChannelStatus`](../enumerations/ChannelStatus.md)\>

所有渠道状态的映射表

***

### getStatus()

```ts
getStatus(channelType): ChannelStatus | undefined;
```

Defined in: [niuma/channels/registry.ts:211](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/registry.ts#L211)

获取渠道状态

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `channelType` | `string` | 渠道类型 |

#### Returns

[`ChannelStatus`](../enumerations/ChannelStatus.md) \| `undefined`

渠道状态

***

### has()

```ts
has(channelType): boolean;
```

Defined in: [niuma/channels/registry.ts:228](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/registry.ts#L228)

检查渠道是否已注册

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `channelType` | `string` | 渠道类型 |

#### Returns

`boolean`

是否已注册

***

### list()

```ts
list(): string[];
```

Defined in: [niuma/channels/registry.ts:100](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/registry.ts#L100)

获取已注册的渠道类型列表

#### Returns

`string`[]

渠道类型数组

***

### loadFromConfig()

```ts
loadFromConfig(config): Promise<void>;
```

Defined in: [niuma/channels/registry.ts:256](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/registry.ts#L256)

从配置加载渠道

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | \{ `channels`: ( \| \{ `enabled`: `boolean`; `token`: `string`; `type`: `"telegram"`; `webhookUrl?`: `string`; \} \| \{ `applicationId`: `string`; `enabled`: `boolean`; `token`: `string`; `type`: `"discord"`; \} \| \{ `appId`: `string`; `appSecret`: `string`; `enabled`: `boolean`; `encryptKey?`: `string`; `serverPath?`: `string`; `serverPort?`: `number`; `type`: `"feishu"`; `verificationToken?`: `string`; \} \| \{ `appKey`: `string`; `appSecret`: `string`; `enabled`: `boolean`; `serverPath?`: `string`; `serverPort?`: `number`; `type`: `"dingtalk"`; \} \| \{ `appToken?`: `string`; `botToken`: `string`; `enabled`: `boolean`; `serverPath?`: `string`; `serverPort?`: `number`; `signingSecret?`: `string`; `type`: `"slack"`; \} \| \{ `authStatePath?`: `string`; `browser?`: \[`string`, `string`, `string`\]; `enabled`: `boolean`; `type`: `"whatsapp"`; \} \| \{ `checkInterval?`: `number`; `enabled`: `boolean`; `imap?`: \{ `host`: `string`; `inbox?`: `string`; `password`: `string`; `port?`: `number`; `secure?`: `boolean`; `user`: `string`; \}; `smtp?`: \{ `from`: `string`; `host`: `string`; `password`: `string`; `port?`: `number`; `secure?`: `boolean`; `user`: `string`; \}; `type`: `"email"`; \} \| \{ `account`: `number`; `deviceFilePath?`: `string`; `enabled`: `boolean`; `password`: `string`; `platform?`: `number`; `type`: `"qq"`; `useSlider?`: `boolean`; \} \| \{ `enabled`: `boolean`; `type`: `"cli"`; \})[]; `defaults`: \{ `retryAttempts`: `number`; `timeout`: `number`; \}; `enabled`: ( \| `"telegram"` \| `"discord"` \| `"feishu"` \| `"dingtalk"` \| `"slack"` \| `"whatsapp"` \| `"email"` \| `"qq"` \| `"cli"`)[]; \} | 渠道配置 根据配置加载并注册渠道 |
| `config.channels` | ( \| \{ `enabled`: `boolean`; `token`: `string`; `type`: `"telegram"`; `webhookUrl?`: `string`; \} \| \{ `applicationId`: `string`; `enabled`: `boolean`; `token`: `string`; `type`: `"discord"`; \} \| \{ `appId`: `string`; `appSecret`: `string`; `enabled`: `boolean`; `encryptKey?`: `string`; `serverPath?`: `string`; `serverPort?`: `number`; `type`: `"feishu"`; `verificationToken?`: `string`; \} \| \{ `appKey`: `string`; `appSecret`: `string`; `enabled`: `boolean`; `serverPath?`: `string`; `serverPort?`: `number`; `type`: `"dingtalk"`; \} \| \{ `appToken?`: `string`; `botToken`: `string`; `enabled`: `boolean`; `serverPath?`: `string`; `serverPort?`: `number`; `signingSecret?`: `string`; `type`: `"slack"`; \} \| \{ `authStatePath?`: `string`; `browser?`: \[`string`, `string`, `string`\]; `enabled`: `boolean`; `type`: `"whatsapp"`; \} \| \{ `checkInterval?`: `number`; `enabled`: `boolean`; `imap?`: \{ `host`: `string`; `inbox?`: `string`; `password`: `string`; `port?`: `number`; `secure?`: `boolean`; `user`: `string`; \}; `smtp?`: \{ `from`: `string`; `host`: `string`; `password`: `string`; `port?`: `number`; `secure?`: `boolean`; `user`: `string`; \}; `type`: `"email"`; \} \| \{ `account`: `number`; `deviceFilePath?`: `string`; `enabled`: `boolean`; `password`: `string`; `platform?`: `number`; `type`: `"qq"`; `useSlider?`: `boolean`; \} \| \{ `enabled`: `boolean`; `type`: `"cli"`; \})[] | 各渠道具体配置 |
| `config.defaults` | \{ `retryAttempts`: `number`; `timeout`: `number`; \} | 渠道通用默认配置 |
| `config.defaults.retryAttempts` | `number` | 重试次数 |
| `config.defaults.timeout` | `number` | 请求超时时间（毫秒） |
| `config.enabled` | ( \| `"telegram"` \| `"discord"` \| `"feishu"` \| `"dingtalk"` \| `"slack"` \| `"whatsapp"` \| `"email"` \| `"qq"` \| `"cli"`)[] | 启用的渠道列表 |

#### Returns

`Promise`\<`void`\>

***

### register()

```ts
register(channel): void;
```

Defined in: [niuma/channels/registry.ts:44](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/registry.ts#L44)

注册渠道

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `channel` | [`BaseChannel`](BaseChannel.md) | 渠道实例 将渠道注册到注册表中 |

#### Returns

`void`

***

### size()

```ts
size(): number;
```

Defined in: [niuma/channels/registry.ts:236](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/registry.ts#L236)

获取已注册渠道的数量

#### Returns

`number`

渠道数量

***

### startAll()

```ts
startAll(channelTypes?): Promise<void>;
```

Defined in: [niuma/channels/registry.ts:109](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/registry.ts#L109)

批量启动渠道

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `channelTypes?` | `string`[] | 要启动的渠道类型列表，如果不指定则启动所有渠道 启动指定的渠道，按顺序启动 |

#### Returns

`Promise`\<`void`\>

***

### stopAll()

```ts
stopAll(channelTypes?): Promise<void>;
```

Defined in: [niuma/channels/registry.ts:141](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/registry.ts#L141)

批量停止渠道

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `channelTypes?` | `string`[] | 要停止的渠道类型列表，如果不指定则停止所有渠道 停止指定的渠道，按顺序停止 |

#### Returns

`Promise`\<`void`\>

***

### unregister()

```ts
unregister(channelType): void;
```

Defined in: [niuma/channels/registry.ts:59](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/registry.ts#L59)

注销渠道

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `channelType` | `string` | 渠道类型 从注册表中移除渠道 |

#### Returns

`void`

***

### updateStatus()

```ts
updateStatus(channelType, status): void;
```

Defined in: [niuma/channels/registry.ts:202](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/registry.ts#L202)

更新渠道状态

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `channelType` | `string` | 渠道类型 |
| `status` | [`ChannelStatus`](../enumerations/ChannelStatus.md) | 新的渠道状态 当渠道状态发生变化时调用此方法 |

#### Returns

`void`
