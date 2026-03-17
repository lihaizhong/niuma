# Interface: ProviderSpec

Defined in: [niuma/providers/registry.ts:25](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L25)

提供商规格

描述提供商的元数据和匹配规则

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="defaultapibase"></a> `defaultApiBase?` | `string` | 默认 API Base | [niuma/providers/registry.ts:37](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L37) |
| <a id="displayname"></a> `displayName` | `string` | 显示名称（如 "OpenAI"） | [niuma/providers/registry.ts:33](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L33) |
| <a id="envkey"></a> `envKey` | `string` | 环境变量名（如 "OPENAI_API_KEY"） | [niuma/providers/registry.ts:31](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L31) |
| <a id="factory"></a> `factory` | (`config`) => [`LLMProvider`](LLMProvider.md) | 提供商工厂函数 | [niuma/providers/registry.ts:39](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L39) |
| <a id="isgateway"></a> `isGateway?` | `boolean` | 是否为网关（如 OpenRouter） | [niuma/providers/registry.ts:35](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L35) |
| <a id="keywords"></a> `keywords` | `string`[] | 模型名关键词数组（如 ["gpt", "o1"]） | [niuma/providers/registry.ts:29](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L29) |
| <a id="name"></a> `name` | `string` | 配置字段名（如 "openai", "anthropic"） | [niuma/providers/registry.ts:27](https://github.com/lihaizhong/niuma/blob/main/niuma/providers/registry.ts#L27) |
