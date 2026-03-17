# Class: FeishuChannel

Defined in: [niuma/channels/feishu/index.ts:71](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/feishu/index.ts#L71)

飞书渠道
基于 @larksuiteoapi/node-sdk 的飞书开放平台渠道实现

## Extends

- [`BaseChannel`](BaseChannel.md)

## Constructors

### Constructor

```ts
new FeishuChannel(config): FeishuChannel;
```

Defined in: [niuma/channels/feishu/index.ts:80](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/feishu/index.ts#L80)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | [`FeishuChannelConfig`](../interfaces/FeishuChannelConfig.md) |

#### Returns

`FeishuChannel`

#### Overrides

[`BaseChannel`](BaseChannel.md).[`constructor`](BaseChannel.md#constructor)

## Properties

| Property | Modifier | Type | Default value | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="lasterror"></a> `lastError?` | `protected` | `string` | `undefined` | 最后错误信息 | [`BaseChannel`](BaseChannel.md).[`lastError`](BaseChannel.md#lasterror) | [niuma/channels/base.ts:90](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L90) |
| <a id="lasterrorat"></a> `lastErrorAt?` | `protected` | `Date` | `undefined` | 最后错误时间 | [`BaseChannel`](BaseChannel.md).[`lastErrorAt`](BaseChannel.md#lasterrorat) | [niuma/channels/base.ts:93](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L93) |
| <a id="status"></a> `status` | `protected` | [`ChannelStatus`](../enumerations/ChannelStatus.md) | `ChannelStatus.IDLE` | 渠道状态 | [`BaseChannel`](BaseChannel.md).[`status`](BaseChannel.md#status) | [niuma/channels/base.ts:87](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L87) |

## Accessors

### logger

#### Get Signature

```ts
get protected logger(): Logger;
```

Defined in: [niuma/channels/base.ts:295](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L295)

获取 Logger 实例（延迟初始化）
Logger 的 name 已包含渠道类型，可直接调用：
- this.logger.info('消息')
- this.logger.warn('警告')
- this.logger.error({ err }, '错误')

##### Returns

`Logger`

#### Inherited from

[`BaseChannel`](BaseChannel.md).[`logger`](BaseChannel.md#logger)

## Methods

### classifyError()

```ts
protected classifyError(error): ChannelError;
```

Defined in: [niuma/channels/base.ts:250](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L250)

分类错误

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `error` | `unknown` | 原始错误 |

#### Returns

[`ChannelError`](ChannelError.md)

渠道错误

#### Inherited from

[`BaseChannel`](BaseChannel.md).[`classifyError`](BaseChannel.md#classifyerror)

***

### getLastError()

```ts
getLastError(): 
  | {
  at: Date;
  error: string;
}
  | undefined;
```

Defined in: [niuma/channels/base.ts:172](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L172)

获取最后错误信息

#### Returns

  \| \{
  `at`: `Date`;
  `error`: `string`;
\}
  \| `undefined`

最后错误信息

#### Inherited from

[`BaseChannel`](BaseChannel.md).[`getLastError`](BaseChannel.md#getlasterror)

***

### getStatus()

```ts
getStatus(): ChannelStatus;
```

Defined in: [niuma/channels/base.ts:164](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L164)

获取渠道状态

#### Returns

[`ChannelStatus`](../enumerations/ChannelStatus.md)

当前渠道状态

#### Inherited from

[`BaseChannel`](BaseChannel.md).[`getStatus`](BaseChannel.md#getstatus)

***

### getType()

```ts
getType(): string;
```

Defined in: [niuma/channels/feishu/index.ts:94](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/feishu/index.ts#L94)

获取渠道类型

#### Returns

`string`

渠道类型标识符

#### Overrides

[`BaseChannel`](BaseChannel.md).[`getType`](BaseChannel.md#gettype)

***

### handleError()

```ts
protected handleError(error): void;
```

Defined in: [niuma/channels/base.ts:284](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L284)

处理错误

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | [`ChannelError`](ChannelError.md) |

#### Returns

`void`

#### Inherited from

[`BaseChannel`](BaseChannel.md).[`handleError`](BaseChannel.md#handleerror)

***

### handleMessage()

```ts
protected handleMessage(message): Promise<void>;
```

Defined in: [niuma/channels/base.ts:195](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L195)

处理收到的消息

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | [`InboundMessage`](../interfaces/InboundMessage.md) | 入站消息 |

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`BaseChannel`](BaseChannel.md).[`handleMessage`](BaseChannel.md#handlemessage)

***

### healthCheck()

```ts
healthCheck(): Promise<boolean>;
```

Defined in: [niuma/channels/feishu/index.ts:208](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/feishu/index.ts#L208)

健康检查

#### Returns

`Promise`\<`boolean`\>

渠道是否健康

#### Overrides

[`BaseChannel`](BaseChannel.md).[`healthCheck`](BaseChannel.md#healthcheck)

***

### logError()

```ts
protected logError(message, error): void;
```

Defined in: [niuma/channels/base.ts:307](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L307)

记录错误日志（同时保存最后错误信息）

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | 错误消息 |
| `error` | [`ChannelError`](ChannelError.md) | 渠道错误 |

#### Returns

`void`

#### Inherited from

[`BaseChannel`](BaseChannel.md).[`logError`](BaseChannel.md#logerror)

***

### logInfo()

```ts
protected logInfo(message): void;
```

Defined in: [niuma/channels/base.ts:320](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L320)

记录信息日志

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | 信息消息 |

#### Returns

`void`

#### Inherited from

[`BaseChannel`](BaseChannel.md).[`logInfo`](BaseChannel.md#loginfo)

***

### logWarn()

```ts
protected logWarn(message): void;
```

Defined in: [niuma/channels/base.ts:328](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L328)

记录警告日志

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | `string` | 警告消息 |

#### Returns

`void`

#### Inherited from

[`BaseChannel`](BaseChannel.md).[`logWarn`](BaseChannel.md#logwarn)

***

### onError()

```ts
onError(handler): void;
```

Defined in: [niuma/channels/base.ts:156](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L156)

注册错误处理器

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `handler` | (`error`) => `void` | 错误处理函数 在发生错误时调用此处理器 |

#### Returns

`void`

#### Inherited from

[`BaseChannel`](BaseChannel.md).[`onError`](BaseChannel.md#onerror)

***

### onMessage()

```ts
onMessage(handler): void;
```

Defined in: [niuma/channels/base.ts:147](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L147)

注册消息处理器

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `handler` | [`MessageHandler`](../type-aliases/MessageHandler.md) | 消息处理函数 在收到消息时调用此处理器 |

#### Returns

`void`

#### Inherited from

[`BaseChannel`](BaseChannel.md).[`onMessage`](BaseChannel.md#onmessage)

***

### retryWithBackoff()

```ts
protected retryWithBackoff<T>(
   fn, 
   maxRetries?, 
baseDelay?): Promise<T>;
```

Defined in: [niuma/channels/base.ts:223](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L223)

指数退避重试

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `fn` | () => `Promise`\<`T`\> | `undefined` | 要重试的函数 |
| `maxRetries` | `number` | `3` | 最大重试次数 |
| `baseDelay` | `number` | `1000` | 基础延迟时间（毫秒） |

#### Returns

`Promise`\<`T`\>

#### Inherited from

[`BaseChannel`](BaseChannel.md).[`retryWithBackoff`](BaseChannel.md#retrywithbackoff)

***

### send()

```ts
send(message): Promise<void>;
```

Defined in: [niuma/channels/feishu/index.ts:171](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/feishu/index.ts#L171)

发送消息

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | [`OutboundMessage`](../interfaces/OutboundMessage.md) | 要发送的消息 |

#### Returns

`Promise`\<`void`\>

#### Overrides

[`BaseChannel`](BaseChannel.md).[`send`](BaseChannel.md#send)

***

### setStatus()

```ts
protected setStatus(status): void;
```

Defined in: [niuma/channels/base.ts:187](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L187)

设置渠道状态

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `status` | [`ChannelStatus`](../enumerations/ChannelStatus.md) | 新的渠道状态 |

#### Returns

`void`

#### Inherited from

[`BaseChannel`](BaseChannel.md).[`setStatus`](BaseChannel.md#setstatus)

***

### sleep()

```ts
protected sleep(ms): Promise<void>;
```

Defined in: [niuma/channels/base.ts:213](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L213)

睡眠指定时间

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ms` | `number` | 毫秒数 |

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`BaseChannel`](BaseChannel.md).[`sleep`](BaseChannel.md#sleep)

***

### start()

```ts
start(): Promise<void>;
```

Defined in: [niuma/channels/feishu/index.ts:98](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/feishu/index.ts#L98)

启动渠道
连接到对应的消息平台并开始接收消息

#### Returns

`Promise`\<`void`\>

#### Overrides

[`BaseChannel`](BaseChannel.md).[`start`](BaseChannel.md#start)

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: [niuma/channels/feishu/index.ts:140](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/feishu/index.ts#L140)

停止渠道
断开连接并释放所有资源

#### Returns

`Promise`\<`void`\>

#### Overrides

[`BaseChannel`](BaseChannel.md).[`stop`](BaseChannel.md#stop)
