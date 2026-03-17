# Abstract Class: BaseChannel

Defined in: [niuma/channels/base.ts:81](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L81)

渠道抽象基类
所有渠道实现必须继承此基类

## Extended by

- [`CLIChannel`](CLIChannel.md)
- [`DiscordChannel`](DiscordChannel.md)
- [`TelegramChannel`](TelegramChannel.md)
- [`FeishuChannel`](FeishuChannel.md)
- [`EmailChannel`](EmailChannel.md)
- [`QQChannel`](QQChannel.md)

## Constructors

### Constructor

```ts
new BaseChannel(): BaseChannel;
```

#### Returns

`BaseChannel`

## Properties

| Property | Modifier | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="lasterror"></a> `lastError?` | `protected` | `string` | `undefined` | 最后错误信息 | [niuma/channels/base.ts:90](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L90) |
| <a id="lasterrorat"></a> `lastErrorAt?` | `protected` | `Date` | `undefined` | 最后错误时间 | [niuma/channels/base.ts:93](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L93) |
| <a id="status"></a> `status` | `protected` | [`ChannelStatus`](../enumerations/ChannelStatus.md) | `ChannelStatus.IDLE` | 渠道状态 | [niuma/channels/base.ts:87](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L87) |

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

***

### getType()

```ts
abstract getType(): string;
```

Defined in: [niuma/channels/base.ts:112](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L112)

获取渠道类型

#### Returns

`string`

渠道类型标识符

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

***

### healthCheck()

```ts
abstract healthCheck(): Promise<boolean>;
```

Defined in: [niuma/channels/base.ts:136](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L136)

健康检查

#### Returns

`Promise`\<`boolean`\>

渠道是否健康

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

***

### send()

```ts
abstract send(message): Promise<void>;
```

Defined in: [niuma/channels/base.ts:130](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L130)

发送消息

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `message` | [`OutboundMessage`](../interfaces/OutboundMessage.md) | 要发送的消息 |

#### Returns

`Promise`\<`void`\>

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

***

### start()

```ts
abstract start(): Promise<void>;
```

Defined in: [niuma/channels/base.ts:118](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L118)

启动渠道
连接到对应的消息平台并开始接收消息

#### Returns

`Promise`\<`void`\>

***

### stop()

```ts
abstract stop(): Promise<void>;
```

Defined in: [niuma/channels/base.ts:124](https://github.com/lihaizhong/niuma/blob/main/niuma/channels/base.ts#L124)

停止渠道
断开连接并释放所有资源

#### Returns

`Promise`\<`void`\>
