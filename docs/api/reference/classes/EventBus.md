# Class: EventBus

Defined in: [niuma/bus/events.ts:23](https://github.com/lihaizhong/niuma/blob/main/niuma/bus/events.ts#L23)

类型安全的事件总线
直接使用 EventEmitter，提供类型安全的封装

## Constructors

### Constructor

```ts
new EventBus(): EventBus;
```

Defined in: [niuma/bus/events.ts:26](https://github.com/lihaizhong/niuma/blob/main/niuma/bus/events.ts#L26)

#### Returns

`EventBus`

## Methods

### emit()

```ts
emit<K>(type, data): void;
```

Defined in: [niuma/bus/events.ts:33](https://github.com/lihaizhong/niuma/blob/main/niuma/bus/events.ts#L33)

发射事件

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* `EventType` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `K` |
| `data` | `EventMap`\[`K`\] |

#### Returns

`void`

***

### on()

```ts
on<K>(type, handler): void;
```

Defined in: [niuma/bus/events.ts:44](https://github.com/lihaizhong/niuma/blob/main/niuma/bus/events.ts#L44)

监听事件

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* `EventType` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `K` |
| `handler` | (`data`) => `void` \| `Promise`\<`void`\> |

#### Returns

`void`

***

### removeAllListeners()

```ts
removeAllListeners(type?): void;
```

Defined in: [niuma/bus/events.ts:75](https://github.com/lihaizhong/niuma/blob/main/niuma/bus/events.ts#L75)

移除所有监听器

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type?` | `EventType` |

#### Returns

`void`
