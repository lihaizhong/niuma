# Class: HeartbeatService

Defined in: [niuma/heartbeat/service.ts:88](https://github.com/lihaizhong/niuma/blob/main/niuma/heartbeat/service.ts#L88)

心跳服务类

## Constructors

### Constructor

```ts
new HeartbeatService(options): HeartbeatService;
```

Defined in: [niuma/heartbeat/service.ts:104](https://github.com/lihaizhong/niuma/blob/main/niuma/heartbeat/service.ts#L104)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `HeartbeatServiceOptions` |

#### Returns

`HeartbeatService`

## Methods

### start()

```ts
start(): Promise<void>;
```

Defined in: [niuma/heartbeat/service.ts:114](https://github.com/lihaizhong/niuma/blob/main/niuma/heartbeat/service.ts#L114)

启动心跳服务

#### Returns

`Promise`\<`void`\>

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: [niuma/heartbeat/service.ts:150](https://github.com/lihaizhong/niuma/blob/main/niuma/heartbeat/service.ts#L150)

停止心跳服务

#### Returns

`Promise`\<`void`\>
