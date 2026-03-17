# Class: SessionManager

Defined in: [niuma/session/manager.ts:91](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L91)

会话管理器
负责会话的创建、持久化和历史记录管理

## Example

```typescript
// 使用默认配置（~/.niuma/sessions）
const manager = new SessionManager()

// 直接指定会话目录
const manager = new SessionManager({ sessionsDir: '/path/to/sessions' })

// 获取或创建会话
const session = manager.getOrCreate('cli:user-123')

// 添加消息
manager.addMessage(session, 'user', 'Hello!')

// 保存会话
manager.save(session)
```

## Constructors

### Constructor

```ts
new SessionManager(config?): SessionManager;
```

Defined in: [niuma/session/manager.ts:116](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L116)

创建会话管理器实例

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config?` | [`SessionManagerConfig`](../interfaces/SessionManagerConfig.md) | 配置选项 存储位置优先级：sessionsDir > ~/.niuma/sessions |

#### Returns

`SessionManager`

## Methods

### addMessage()

```ts
addMessage(
   session, 
   role, 
   content, 
   toolsUsed?): void;
```

Defined in: [niuma/session/manager.ts:232](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L232)

添加消息到会话
创建新的会话消息并追加到消息列表

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `session` | [`Session`](../interfaces/Session.md) | 会话对象 |
| `role` | `string` | 消息角色 |
| `content` | `string` | 消息内容 |
| `toolsUsed?` | `string`[] | 使用的工具列表（可选） |

#### Returns

`void`

***

### addMessages()

```ts
addMessages(session, messages): void;
```

Defined in: [niuma/session/manager.ts:333](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L333)

批量添加消息
一次性添加多条消息，减少重复更新时间戳

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `session` | [`Session`](../interfaces/Session.md) | 会话对象 |
| `messages` | `object`[] | 消息列表 |

#### Returns

`void`

***

### cleanExpiredSessions()

```ts
cleanExpiredSessions(): Promise<number>;
```

Defined in: [niuma/session/manager.ts:571](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L571)

清理过期会话
删除超过 TTL 的会话

#### Returns

`Promise`\<`number`\>

清理的会话数量

***

### clear()

```ts
clear(session): void;
```

Defined in: [niuma/session/manager.ts:267](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L267)

清空会话消息
重置会话消息列表和整合时间戳

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `session` | [`Session`](../interfaces/Session.md) | 会话对象 |

#### Returns

`void`

***

### delete()

```ts
delete(sessionKey): void;
```

Defined in: [niuma/session/manager.ts:287](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L287)

删除会话（包括文件）
从内存缓存和文件系统中彻底删除会话

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sessionKey` | `string` | 会话标识 |

#### Returns

`void`

***

### generateSessionKey()

```ts
generateSessionKey(
   channel, 
   chatId, 
   userId?): string;
```

Defined in: [niuma/session/manager.ts:374](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L374)

生成 SessionKey
根据渠道、聊天ID和用户ID生成标准化的会话键

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `channel` | `string` | 渠道类型 |
| `chatId` | `string` | 聊天ID |
| `userId?` | `string` | 用户ID（可选） |

#### Returns

`string`

SessionKey

***

### getHistory()

```ts
getHistory(session, maxMessages): ChatMessage[];
```

Defined in: [niuma/session/manager.ts:218](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L218)

获取会话历史记录
将 SessionMessage 转换为 ChatMessage 格式，用于 LLM 调用

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `session` | [`Session`](../interfaces/Session.md) | 会话对象 |
| `maxMessages` | `number` | 最大消息数量 |

#### Returns

[`ChatMessage`](../interfaces/ChatMessage.md)[]

ChatMessage 格式的消息列表

***

### getLastActiveChannel()

```ts
getLastActiveChannel(): string | null;
```

Defined in: [niuma/session/manager.ts:413](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L413)

获取最后活跃的渠道

#### Returns

`string` \| `null`

最后活跃的渠道类型

***

### getLastActiveSessionKey()

```ts
getLastActiveSessionKey(): string | null;
```

Defined in: [niuma/session/manager.ts:421](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L421)

获取最后活跃的会话键

#### Returns

`string` \| `null`

最后活跃的会话键

***

### getOrCreate()

```ts
getOrCreate(sessionKey): Promise<Session>;
```

Defined in: [niuma/session/manager.ts:131](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L131)

获取或创建会话
如果会话存在则从缓存或文件加载，否则创建新会话（异步）

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sessionKey` | `string` | 会话标识 |

#### Returns

`Promise`\<[`Session`](../interfaces/Session.md)\>

会话对象

***

### getSessionsByChannel()

```ts
getSessionsByChannel(channel): Promise<Session[]>;
```

Defined in: [niuma/session/manager.ts:431](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L431)

按渠道查询会话
获取指定渠道的所有会话

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `channel` | `string` | 渠道类型 |

#### Returns

`Promise`\<[`Session`](../interfaces/Session.md)[]\>

会话列表

***

### getSessionsByUser()

```ts
getSessionsByUser(userId): Promise<Session[]>;
```

Defined in: [niuma/session/manager.ts:474](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L474)

按用户查询会话
获取指定用户的所有会话

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `userId` | `string` | 用户ID |

#### Returns

`Promise`\<[`Session`](../interfaces/Session.md)[]\>

会话列表

***

### getSessionsDir()

```ts
getSessionsDir(): string;
```

Defined in: [niuma/session/manager.ts:323](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L323)

获取会话存储目录

#### Returns

`string`

当前配置的会话存储目录路径

***

### getSessionStats()

```ts
getSessionStats(): Promise<{
  active: number;
  byChannel: Record<string, number>;
  total: number;
}>;
```

Defined in: [niuma/session/manager.ts:516](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L516)

获取会话统计
统计各渠道的会话数量和活跃会话数量

#### Returns

`Promise`\<\{
  `active`: `number`;
  `byChannel`: `Record`\<`string`, `number`\>;
  `total`: `number`;
\}\>

会话统计信息

***

### invalidate()

```ts
invalidate(sessionKey): void;
```

Defined in: [niuma/session/manager.ts:278](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L278)

使会话缓存失效
从内存缓存中移除会话，不影响文件存储

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sessionKey` | `string` | 会话标识 |

#### Returns

`void`

***

### listSessions()

```ts
listSessions(): string[];
```

Defined in: [niuma/session/manager.ts:305](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L305)

获取所有会话键
列出存储目录中的所有会话标识

#### Returns

`string`[]

会话键列表

***

### parseSessionKey()

```ts
parseSessionKey(sessionKey): object;
```

Defined in: [niuma/session/manager.ts:387](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L387)

解析 SessionKey
解析 SessionKey，返回渠道、聊天ID和用户ID

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sessionKey` | `string` | 会话键 |

#### Returns

`object`

解析结果

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `channel` | `string` | [niuma/session/manager.ts:388](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L388) |
| `chatId` | `string` | [niuma/session/manager.ts:389](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L389) |
| `userId?` | `string` | [niuma/session/manager.ts:390](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L390) |

***

### save()

```ts
save(session): Promise<void>;
```

Defined in: [niuma/session/manager.ts:183](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L183)

保存会话到文件
将会话数据持久化到文件系统（异步原子写入）

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `session` | [`Session`](../interfaces/Session.md) | 会话对象 |

#### Returns

`Promise`\<`void`\>

***

### updateConsolidated()

```ts
updateConsolidated(session): void;
```

Defined in: [niuma/session/manager.ts:361](https://github.com/lihaizhong/niuma/blob/main/niuma/session/manager.ts#L361)

更新整合时间戳
记录最后一次记忆整合的时间点

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `session` | [`Session`](../interfaces/Session.md) | 会话对象 |

#### Returns

`void`
