# Interface: AgentLoopOptions

Defined in: [niuma/agent/loop.ts:50](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L50)

Agent 循环配置选项

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="agentid"></a> `agentId?` | `string` | Agent ID（可选，默认为 "default"） | [niuma/agent/loop.ts:62](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L62) |
| <a id="bus"></a> `bus` | [`EventBus`](../classes/EventBus.md) | 事件总线 | [niuma/agent/loop.ts:52](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L52) |
| <a id="channelregistry"></a> `channelRegistry?` | [`ChannelRegistry`](../classes/ChannelRegistry.md) | 渠道注册表（可选，如果不提供则创建新的） | [niuma/agent/loop.ts:78](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L78) |
| <a id="channelsconfig"></a> `channelsConfig?` | `object` | 渠道配置 | [niuma/agent/loop.ts:76](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L76) |
| `channelsConfig.channels` | ( \| \{ `enabled`: `boolean`; `token`: `string`; `type`: `"telegram"`; `webhookUrl?`: `string`; \} \| \{ `applicationId`: `string`; `enabled`: `boolean`; `token`: `string`; `type`: `"discord"`; \} \| \{ `appId`: `string`; `appSecret`: `string`; `enabled`: `boolean`; `encryptKey?`: `string`; `serverPath?`: `string`; `serverPort?`: `number`; `type`: `"feishu"`; `verificationToken?`: `string`; \} \| \{ `appKey`: `string`; `appSecret`: `string`; `enabled`: `boolean`; `serverPath?`: `string`; `serverPort?`: `number`; `type`: `"dingtalk"`; \} \| \{ `appToken?`: `string`; `botToken`: `string`; `enabled`: `boolean`; `serverPath?`: `string`; `serverPort?`: `number`; `signingSecret?`: `string`; `type`: `"slack"`; \} \| \{ `authStatePath?`: `string`; `browser?`: \[`string`, `string`, `string`\]; `enabled`: `boolean`; `type`: `"whatsapp"`; \} \| \{ `checkInterval?`: `number`; `enabled`: `boolean`; `imap?`: \{ `host`: `string`; `inbox?`: `string`; `password`: `string`; `port?`: `number`; `secure?`: `boolean`; `user`: `string`; \}; `smtp?`: \{ `from`: `string`; `host`: `string`; `password`: `string`; `port?`: `number`; `secure?`: `boolean`; `user`: `string`; \}; `type`: `"email"`; \} \| \{ `account`: `number`; `deviceFilePath?`: `string`; `enabled`: `boolean`; `password`: `string`; `platform?`: `number`; `type`: `"qq"`; `useSlider?`: `boolean`; \} \| \{ `enabled`: `boolean`; `type`: `"cli"`; \})[] | 各渠道具体配置 | [niuma/config/schema.ts:233](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L233) |
| `channelsConfig.defaults` | `object` | 渠道通用默认配置 | [niuma/config/schema.ts:228](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L228) |
| `channelsConfig.defaults.retryAttempts` | `number` | 重试次数 | [niuma/config/schema.ts:106](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L106) |
| `channelsConfig.defaults.timeout` | `number` | 请求超时时间（毫秒） | [niuma/config/schema.ts:104](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L104) |
| `channelsConfig.enabled` | ( \| `"telegram"` \| `"discord"` \| `"feishu"` \| `"dingtalk"` \| `"slack"` \| `"whatsapp"` \| `"email"` \| `"qq"` \| `"cli"`)[] | 启用的渠道列表 | [niuma/config/schema.ts:224](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L224) |
| <a id="configmanager"></a> `configManager?` | [`ConfigManager`](../classes/ConfigManager.md) | 配置管理器（用于获取 provider 列表） | [niuma/agent/loop.ts:82](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L82) |
| <a id="heartbeatconfig"></a> `heartbeatConfig?` | [`HeartbeatConfig`](HeartbeatConfig.md) | 心跳服务配置 | [niuma/agent/loop.ts:74](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L74) |
| <a id="maxiterations"></a> `maxIterations?` | `number` | 最大迭代次数（默认 40） | [niuma/agent/loop.ts:66](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L66) |
| <a id="maxtokens"></a> `maxTokens?` | `number` | 最大生成 token 数 | [niuma/agent/loop.ts:70](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L70) |
| <a id="memorywindow"></a> `memoryWindow?` | `number` | 记忆窗口大小（默认 100 条消息） | [niuma/agent/loop.ts:72](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L72) |
| <a id="model"></a> `model?` | `string` | 使用的模型（可选，默认使用 provider 的默认模型） | [niuma/agent/loop.ts:64](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L64) |
| <a id="provider"></a> `provider` | [`LLMProvider`](LLMProvider.md) | LLM 提供商 | [niuma/agent/loop.ts:54](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L54) |
| <a id="providerregistry"></a> `providerRegistry?` | [`ProviderRegistry`](ProviderRegistry.md) | Provider 注册表（用于 provider 切换） | [niuma/agent/loop.ts:80](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L80) |
| <a id="sessions"></a> `sessions` | [`SessionManager`](../classes/SessionManager.md) | 会话管理器 | [niuma/agent/loop.ts:60](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L60) |
| <a id="temperature"></a> `temperature?` | `number` | 采样温度（默认 0.7） | [niuma/agent/loop.ts:68](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L68) |
| <a id="tools"></a> `tools` | [`ToolRegistry`](../classes/ToolRegistry.md) | 工具注册中心 | [niuma/agent/loop.ts:58](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L58) |
| <a id="workspace"></a> `workspace` | `string` | 工作区路径 | [niuma/agent/loop.ts:56](https://github.com/lihaizhong/niuma/blob/main/niuma/agent/loop.ts#L56) |
