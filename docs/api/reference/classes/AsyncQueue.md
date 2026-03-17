# Class: AsyncQueue\<T\>

Defined in: [niuma/bus/queue.ts:8](https://github.com/lihaizhong/niuma/blob/main/niuma/bus/queue.ts#L8)

用于消息缓冲的通用异步队列

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Constructors

### Constructor

```ts
new AsyncQueue<T>(maxSize?): AsyncQueue<T>;
```

Defined in: [niuma/bus/queue.ts:20](https://github.com/lihaizhong/niuma/blob/main/niuma/bus/queue.ts#L20)

创建异步队列实例

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `maxSize` | `number` | `0` | 最大队列大小，0 表示无限制 |

#### Returns

`AsyncQueue`\<`T`\>

## Accessors

### isEmpty

#### Get Signature

```ts
get isEmpty(): boolean;
```

Defined in: [niuma/bus/queue.ts:34](https://github.com/lihaizhong/niuma/blob/main/niuma/bus/queue.ts#L34)

检查队列是否为空

##### Returns

`boolean`

***

### size

#### Get Signature

```ts
get size(): number;
```

Defined in: [niuma/bus/queue.ts:27](https://github.com/lihaizhong/niuma/blob/main/niuma/bus/queue.ts#L27)

获取队列大小

##### Returns

`number`

## Methods

### clear()

```ts
clear(): void;
```

Defined in: [niuma/bus/queue.ts:69](https://github.com/lihaizhong/niuma/blob/main/niuma/bus/queue.ts#L69)

清空队列

#### Returns

`void`

***

### dequeue()

```ts
dequeue(): Promise<T>;
```

Defined in: [niuma/bus/queue.ts:57](https://github.com/lihaizhong/niuma/blob/main/niuma/bus/queue.ts#L57)

从队列移除并返回下一个项目

#### Returns

`Promise`\<`T`\>

***

### enqueue()

```ts
enqueue(item): void;
```

Defined in: [niuma/bus/queue.ts:42](https://github.com/lihaizhong/niuma/blob/main/niuma/bus/queue.ts#L42)

添加项目到队列

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `item` | `T` |

#### Returns

`void`

#### Throws

如果队列已满且 maxSize > 0
