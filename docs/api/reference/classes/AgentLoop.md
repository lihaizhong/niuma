# Class: AgentLoop

Defined in: [niuma/agent/loop.ts:186](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L186)

Agent 循环 - 核心处理引擎

从消息总线接收消息，通过 LLM 处理并执行工具调用，
支持多轮迭代直到 LLM 返回最终响应。

## Example

```typescript
const loop = new AgentLoop({
  bus: eventBus,
  provider: openaiProvider,
  workspace: '/path/to/workspace',
  tools: toolRegistry,
  sessions: sessionManager,
});

// 启动循环
loop.run();

// 直接处理消息
const response = await loop.processDirect('Hello!');

// 停止循环
loop.stop();
```

## Constructors

### Constructor

```ts
new AgentLoop(options): AgentLoop;
```

Defined in: [niuma/agent/loop.ts:255](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L255)

创建 Agent 循环实例

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`AgentLoopOptions`](../interfaces/AgentLoopOptions.md) | 配置选项 |

#### Returns

`AgentLoop`

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="sessions"></a> `sessions` | `readonly` | [`SessionManager`](SessionManager.md) | 会话管理器 | [niuma/agent/loop.ts:206](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L206) |

## Accessors

### provider

#### Get Signature

```ts
get provider(): LLMProvider;
```

Defined in: [niuma/agent/loop.ts:302](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L302)

获取当前提供商

##### Returns

[`LLMProvider`](../interfaces/LLMProvider.md)

## Methods

### getCurrentProvider()

```ts
getCurrentProvider(): ProviderInfo | null;
```

Defined in: [niuma/agent/loop.ts:352](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L352)

获取当前 provider 信息

#### Returns

`ProviderInfo` \| `null`

当前 Provider 信息

***

### listProviders()

```ts
listProviders(): ProviderInfo[];
```

Defined in: [niuma/agent/loop.ts:325](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L325)

列出所有可用的 provider

#### Returns

`ProviderInfo`[]

Provider 信息列表

***

### processDirect()

```ts
processDirect(content, options?): Promise<string>;
```

Defined in: [niuma/agent/loop.ts:681](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L681)

直接处理消息
用于 CLI 或 cron 直接调用，不经过消息总线

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `content` | `string` | 消息内容 |
| `options?` | `ProcessOptions` | 处理选项 |

#### Returns

`Promise`\<`string`\>

处理结果字符串

***

### run()

```ts
run(): Promise<void>;
```

Defined in: [niuma/agent/loop.ts:528](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L528)

启动消息处理循环
开始监听消息总线，处理入站消息

#### Returns

`Promise`\<`void`\>

***

### setProvider()

```ts
setProvider(newProvider, providerName?): void;
```

Defined in: [niuma/agent/loop.ts:311](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L311)

切换提供商

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `newProvider` | [`LLMProvider`](../interfaces/LLMProvider.md) | 新的提供商实例 |
| `providerName?` | `string` | 提供商名称（可选） |

#### Returns

`void`

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: [niuma/agent/loop.ts:588](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L588)

停止消息处理循环
停止监听，清理资源

#### Returns

`Promise`\<`void`\>

***

### switchByModel()

```ts
switchByModel(modelName): ProviderSwitchResult;
```

Defined in: [niuma/agent/loop.ts:446](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L446)

根据模型名切换 provider

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `modelName` | `string` | 模型名称 |

#### Returns

`ProviderSwitchResult`

切换结果

***

### switchProvider()

```ts
switchProvider(name): ProviderSwitchResult;
```

Defined in: [niuma/agent/loop.ts:379](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L379)

切换到指定的 provider

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Provider 名称 |

#### Returns

`ProviderSwitchResult`

切换结果
