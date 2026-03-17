# Interface: LLMProvider

Defined in: [niuma/providers/base.ts:17](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/base.ts#L17)

LLM 提供商接口
所有 LLM 提供商必须实现此接口

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="name"></a> `name` | `readonly` | `string` | 提供商名称 | [niuma/providers/base.ts:21](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/base.ts#L21) |

## Methods

### chat()

```ts
chat(options): Promise<LLMResponse>;
```

Defined in: [niuma/providers/base.ts:45](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/base.ts#L45)

同步聊天接口

发送消息并获取完整的响应。

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`ChatOptions`](ChatOptions.md) | 聊天选项 |

#### Returns

`Promise`\<[`LLMResponse`](LLMResponse.md)\>

LLM 响应对象

#### Throws

当 API 调用失败时抛出

#### Example

```typescript
const response = await provider.chat({
  messages: [{ role: 'user', content: '你好' }],
  model: 'gpt-4o'
})
```

***

### chatStream()?

```ts
optional chatStream(options): AsyncIterable<LLMStreamChunk>;
```

Defined in: [niuma/providers/base.ts:69](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/base.ts#L69)

流式聊天接口（可选）

以流式方式发送消息并逐块返回响应。
适用于需要实时显示生成内容的场景。

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`ChatOptions`](ChatOptions.md) | 聊天选项（同 chat 方法） |

#### Returns

`AsyncIterable`\<`LLMStreamChunk`\>

异步可迭代对象，每次迭代返回一个响应块

#### Throws

当 API 调用失败时抛出

#### Example

```typescript
for await (const chunk of provider.chatStream({ messages })) {
  if (chunk.content) {
    process.stdout.write(chunk.content);
  }
  if (chunk.isFinal) {
    console.log('\nGeneration complete');
  }
}
```

***

### getConfig()

```ts
getConfig(): ProviderLLMConfig;
```

Defined in: [niuma/providers/base.ts:26](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/base.ts#L26)

获取提供商配置

#### Returns

[`ProviderLLMConfig`](ProviderLLMConfig.md)

***

### getDefaultModel()

```ts
getDefaultModel(): string;
```

Defined in: [niuma/providers/base.ts:79](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/base.ts#L79)

获取默认模型名称

返回此提供商配置的默认模型标识符。
当调用 chat/chatStream 时未指定 model 参数时使用。

#### Returns

`string`

默认模型名称（如 'gpt-4o'、'claude-3-opus'）

***

### isAvailable()?

```ts
optional isAvailable(): Promise<boolean>;
```

Defined in: [niuma/providers/base.ts:89](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/base.ts#L89)

检查提供商是否可用（可选）

验证提供商配置是否正确、API 密钥是否有效。
可用于健康检查或初始化验证。

#### Returns

`Promise`\<`boolean`\>

如果提供商可用返回 true，否则返回 false
