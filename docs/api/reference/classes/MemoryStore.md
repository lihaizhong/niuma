# Class: MemoryStore

Defined in: [niuma/agent/memory.ts:75](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/memory.ts#L75)

记忆存储类
实现双层记忆：MEMORY.md（长期记忆）+ HISTORY.md（时间线日志）
存储位置：workspace/memory/

## Constructors

### Constructor

```ts
new MemoryStore(workspace): MemoryStore;
```

Defined in: [niuma/agent/memory.ts:95](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/memory.ts#L95)

创建记忆存储实例

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `workspace` | `string` | 工作区根目录，记忆将存储在 workspace/memory/ |

#### Returns

`MemoryStore`

## Methods

### appendHistory()

```ts
appendHistory(entry): Promise<void>;
```

Defined in: [niuma/agent/memory.ts:110](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/memory.ts#L110)

追加历史条目
将条目追加到 HISTORY.md

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `entry` | `string` | 历史条目内容 |

#### Returns

`Promise`\<`void`\>

***

### consolidate()

```ts
consolidate(options): Promise<boolean>;
```

Defined in: [niuma/agent/memory.ts:139](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/memory.ts#L139)

整合记忆
通过 LLM 工具调用将会话历史整合到记忆系统

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | `ConsolidateOptions` | 整合选项 |

#### Returns

`Promise`\<`boolean`\>

整合是否成功

***

### getMemoryContext()

```ts
getMemoryContext(): Promise<string>;
```

Defined in: [niuma/agent/memory.ts:121](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/memory.ts#L121)

获取记忆上下文
格式化长期记忆用于 System Prompt 注入

#### Returns

`Promise`\<`string`\>

格式化的记忆上下文，如果记忆为空则返回空字符串
