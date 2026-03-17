# Class: ContextBuilder

Defined in: [niuma/agent/context.ts:114](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/context.ts#L114)

上下文构建器
构建 System Prompt 和组装消息列表

## Constructors

### Constructor

```ts
new ContextBuilder(
   workspace, 
   memoryStore, 
   skillsLoader): ContextBuilder;
```

Defined in: [niuma/agent/context.ts:138](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/context.ts#L138)

创建上下文构建器实例

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `workspace` | `string` | 工作区根目录 |
| `memoryStore` | [`MemoryStore`](MemoryStore.md) | 记忆存储实例 |
| `skillsLoader` | [`SkillsLoader`](SkillsLoader.md) | 技能加载器实例 |

#### Returns

`ContextBuilder`

## Methods

### addAssistantMessage()

```ts
addAssistantMessage(messages, options): ChatMessage[];
```

Defined in: [niuma/agent/context.ts:229](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/context.ts#L229)

添加助手消息
添加助手消息（可含工具调用和推理内容）

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `messages` | [`ChatMessage`](../interfaces/ChatMessage.md)[] | 消息列表（将被修改） |
| `options` | `AddAssistantMessageOptions` | 助手消息选项 |

#### Returns

[`ChatMessage`](../interfaces/ChatMessage.md)[]

更新后的消息列表

***

### addToolResult()

```ts
addToolResult(messages, options): ChatMessage[];
```

Defined in: [niuma/agent/context.ts:261](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/context.ts#L261)

添加工具结果消息
添加 role=tool 的工具执行结果

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `messages` | [`ChatMessage`](../interfaces/ChatMessage.md)[] | 消息列表（将被修改） |
| `options` | `AddToolResultOptions` | 工具结果选项 |

#### Returns

[`ChatMessage`](../interfaces/ChatMessage.md)[]

更新后的消息列表

***

### buildMessages()

```ts
buildMessages(options): Promise<ChatMessage[]>;
```

Defined in: [niuma/agent/context.ts:158](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/context.ts#L158)

组装消息列表（异步）
将历史消息和当前消息组装为 LLM 可用的消息列表

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | `BuildMessagesOptions` | 构建选项 |

#### Returns

`Promise`\<[`ChatMessage`](../interfaces/ChatMessage.md)[]\>

完整的消息列表

***

### buildSystemPromptAsync()

```ts
buildSystemPromptAsync(skillNames?): Promise<string>;
```

Defined in: [niuma/agent/context.ts:194](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/context.ts#L194)

异步构建 System Prompt
异步方式构建完整的 System Prompt

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `skillNames?` | `string`[] | 额外激活的技能名称 |

#### Returns

`Promise`\<`string`\>

完整的 System Prompt

***

### getMemoryContextAsync()

```ts
getMemoryContextAsync(): Promise<string>;
```

Defined in: [niuma/agent/context.ts:290](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/context.ts#L290)

异步获取记忆上下文
异步方式获取长期记忆（推荐）

#### Returns

`Promise`\<`string`\>

格式化的记忆上下文

***

### refreshBootstrap()

```ts
refreshBootstrap(): void;
```

Defined in: [niuma/agent/context.ts:281](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/context.ts#L281)

刷新 Bootstrap 缓存
强制重新加载 Bootstrap 文件

#### Returns

`void`
