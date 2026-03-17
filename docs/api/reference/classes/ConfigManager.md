# Class: ConfigManager

Defined in: [niuma/config/manager.ts:65](https://github.com/lihaizhong/niuma/blob/main/niuma/config/manager.ts#L65)

配置管理器

## Constructors

### Constructor

```ts
new ConfigManager(configPath?): ConfigManager;
```

Defined in: [niuma/config/manager.ts:72](https://github.com/lihaizhong/niuma/blob/main/niuma/config/manager.ts#L72)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `configPath?` | `string` |

#### Returns

`ConfigManager`

## Methods

### clearCache()

```ts
clearCache(): void;
```

Defined in: [niuma/config/manager.ts:257](https://github.com/lihaizhong/niuma/blob/main/niuma/config/manager.ts#L257)

清除配置缓存

#### Returns

`void`

***

### getAgentConfig()

```ts
getAgentConfig(agentId): object;
```

Defined in: [niuma/config/manager.ts:119](https://github.com/lihaizhong/niuma/blob/main/niuma/config/manager.ts#L119)

获取角色配置（合并全局默认配置和角色特定配置）

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `agentId` | `string` | 角色唯一标识符 |

#### Returns

合并后的角色配置

| Name | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| `agent` | `object` | - | Agent 配置 | [niuma/config/schema.ts:390](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L390) |
| `agent.maxRetries` | `number` | - | LLM 调用失败重试次数 | [niuma/config/schema.ts:300](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L300) |
| `agent.memoryWindow` | `number` | - | 记忆窗口大小（触发整合的消息数阈值） | [niuma/config/schema.ts:298](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L298) |
| `agent.progressMode` | `"quiet"` \| `"normal"` \| `"verbose"` | `ProgressModeSchema` | 进度通知模式 | [niuma/config/schema.ts:292](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L292) |
| `agent.retryBaseDelay` | `number` | - | 重试基础延迟（毫秒），指数退避 | [niuma/config/schema.ts:302](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L302) |
| `agent.showReasoning` | `boolean` | - | 是否显示推理内容（思维模型） | [niuma/config/schema.ts:294](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L294) |
| `agent.showToolDuration` | `boolean` | - | 是否显示工具执行耗时 | [niuma/config/schema.ts:296](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L296) |
| `agents` | `object` | - | 多角色配置 | [niuma/config/schema.ts:423](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L423) |
| `agents.defaults` | `object` | - | Agent 默认配置 | [niuma/config/schema.ts:352](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L352) |
| `agents.defaults.maxRetries` | `number` | - | LLM 调用失败重试次数 | [niuma/config/schema.ts:300](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L300) |
| `agents.defaults.memoryWindow` | `number` | - | 记忆窗口大小（触发整合的消息数阈值） | [niuma/config/schema.ts:298](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L298) |
| `agents.defaults.progressMode` | `"quiet"` \| `"normal"` \| `"verbose"` | `ProgressModeSchema` | 进度通知模式 | [niuma/config/schema.ts:292](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L292) |
| `agents.defaults.retryBaseDelay` | `number` | - | 重试基础延迟（毫秒），指数退避 | [niuma/config/schema.ts:302](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L302) |
| `agents.defaults.showReasoning` | `boolean` | - | 是否显示推理内容（思维模型） | [niuma/config/schema.ts:294](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L294) |
| `agents.defaults.showToolDuration` | `boolean` | - | 是否显示工具执行耗时 | [niuma/config/schema.ts:296](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L296) |
| `agents.list` | `object`[] | - | 角色列表 | [niuma/config/schema.ts:361](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L361) |
| `channels` | `object` | - | 渠道配置 | [niuma/config/schema.ts:401](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L401) |
| `channels.channels` | ( \| \{ `enabled`: `boolean`; `token`: `string`; `type`: `"telegram"`; `webhookUrl?`: `string`; \} \| \{ `applicationId`: `string`; `enabled`: `boolean`; `token`: `string`; `type`: `"discord"`; \} \| \{ `appId`: `string`; `appSecret`: `string`; `enabled`: `boolean`; `encryptKey?`: `string`; `serverPath?`: `string`; `serverPort?`: `number`; `type`: `"feishu"`; `verificationToken?`: `string`; \} \| \{ `appKey`: `string`; `appSecret`: `string`; `enabled`: `boolean`; `serverPath?`: `string`; `serverPort?`: `number`; `type`: `"dingtalk"`; \} \| \{ `appToken?`: `string`; `botToken`: `string`; `enabled`: `boolean`; `serverPath?`: `string`; `serverPort?`: `number`; `signingSecret?`: `string`; `type`: `"slack"`; \} \| \{ `authStatePath?`: `string`; `browser?`: \[`string`, `string`, `string`\]; `enabled`: `boolean`; `type`: `"whatsapp"`; \} \| \{ `checkInterval?`: `number`; `enabled`: `boolean`; `imap?`: \{ `host`: `string`; `inbox?`: `string`; `password`: `string`; `port?`: `number`; `secure?`: `boolean`; `user`: `string`; \}; `smtp?`: \{ `from`: `string`; `host`: `string`; `password`: `string`; `port?`: `number`; `secure?`: `boolean`; `user`: `string`; \}; `type`: `"email"`; \} \| \{ `account`: `number`; `deviceFilePath?`: `string`; `enabled`: `boolean`; `password`: `string`; `platform?`: `number`; `type`: `"qq"`; `useSlider?`: `boolean`; \} \| \{ `enabled`: `boolean`; `type`: `"cli"`; \})[] | - | 各渠道具体配置 | [niuma/config/schema.ts:233](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L233) |
| `channels.defaults` | `object` | - | 渠道通用默认配置 | [niuma/config/schema.ts:228](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L228) |
| `channels.defaults.retryAttempts` | `number` | - | 重试次数 | [niuma/config/schema.ts:106](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L106) |
| `channels.defaults.timeout` | `number` | - | 请求超时时间（毫秒） | [niuma/config/schema.ts:104](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L104) |
| `channels.enabled` | ( \| `"telegram"` \| `"discord"` \| `"feishu"` \| `"dingtalk"` \| `"slack"` \| `"whatsapp"` \| `"email"` \| `"qq"` \| `"cli"`)[] | - | 启用的渠道列表 | [niuma/config/schema.ts:224](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L224) |
| `cronTasks` | `object`[] | - | 定时任务配置 | [niuma/config/schema.ts:410](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L410) |
| `debug` | `boolean` | - | 调试模式 | [niuma/config/schema.ts:419](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L419) |
| `heartbeat` | `object` | - | 心跳服务配置 | [niuma/config/schema.ts:412](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L412) |
| `heartbeat.enabled` | `boolean` | - | 是否启用心跳服务 | [niuma/config/schema.ts:267](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L267) |
| `heartbeat.filePath` | `string` | - | HEARTBEAT.md 文件路径（相对于工作区根目录） | [niuma/config/schema.ts:271](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L271) |
| `heartbeat.interval` | `string` | - | 检查间隔（Cron 表达式，默认每 30 分钟） | [niuma/config/schema.ts:269](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L269) |
| `heartbeat.taskTimeout` | `number` | - | 任务执行超时时间（秒，默认 5 分钟） | [niuma/config/schema.ts:273](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L273) |
| `logLevel` | `"error"` \| `"warn"` \| `"info"` \| `"debug"` | - | 日志级别 | [niuma/config/schema.ts:421](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L421) |
| `maxIterations` | `number` | - | 最大 Agent 迭代次数 | [niuma/config/schema.ts:388](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L388) |
| `providers` | `Record`\<`string`, \{ `apiBase?`: `string`; `apiKey?`: `string`; `extra?`: `Record`\<`string`, `unknown`\>; `frequencyPenalty?`: `number`; `maxTokens?`: `number`; `model`: `string`; `presencePenalty?`: `number`; `stopSequences?`: `string`[]; `temperature?`: `number`; `timeout?`: `number`; `topP?`: `number`; `type`: `"openai"` \| `"anthropic"` \| `"ollama"` \| `"custom"`; \}\> | - | LLM 提供商配置 | [niuma/config/schema.ts:399](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L399) |
| `workspaceDir` | `string` | - | 工作目录 | [niuma/config/schema.ts:386](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L386) |

***

### getAgentLogPath()

```ts
getAgentLogPath(agentId): string;
```

Defined in: [niuma/config/manager.ts:183](https://github.com/lihaizhong/niuma/blob/main/niuma/config/manager.ts#L183)

获取角色日志路径

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `agentId` | `string` | 角色唯一标识符 |

#### Returns

`string`

日志文件绝对路径

***

### getAgentSessionDir()

```ts
getAgentSessionDir(agentId): string;
```

Defined in: [niuma/config/manager.ts:192](https://github.com/lihaizhong/niuma/blob/main/niuma/config/manager.ts#L192)

获取角色会话存储路径

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `agentId` | `string` | 角色唯一标识符 |

#### Returns

`string`

会话存储目录绝对路径

***

### getAgentWorkspaceDir()

```ts
getAgentWorkspaceDir(agentId): string;
```

Defined in: [niuma/config/manager.ts:148](https://github.com/lihaizhong/niuma/blob/main/niuma/config/manager.ts#L148)

获取角色工作区路径

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `agentId` | `string` | 角色唯一标识符 |

#### Returns

`string`

工作区绝对路径

***

### getDefaultAgentId()

```ts
getDefaultAgentId(): string;
```

Defined in: [niuma/config/manager.ts:226](https://github.com/lihaizhong/niuma/blob/main/niuma/config/manager.ts#L226)

获取默认角色 ID

#### Returns

`string`

默认角色 ID

***

### getDefaultProvider()

```ts
getDefaultProvider(agentId?): LLMProvider | undefined;
```

Defined in: [niuma/config/manager.ts:329](https://github.com/lihaizhong/niuma/blob/main/niuma/config/manager.ts#L329)

获取默认提供商实例

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `agentId?` | `string` | 角色ID（可选） |

#### Returns

[`LLMProvider`](../interfaces/LLMProvider.md) \| `undefined`

默认提供商实例

***

### getProvider()

```ts
getProvider(name, agentId?): LLMProvider | undefined;
```

Defined in: [niuma/config/manager.ts:300](https://github.com/lihaizhong/niuma/blob/main/niuma/config/manager.ts#L300)

获取提供商实例

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | 提供商名称 |
| `agentId?` | `string` | 角色ID（可选） |

#### Returns

[`LLMProvider`](../interfaces/LLMProvider.md) \| `undefined`

提供商实例

***

### getProviderByModel()

```ts
getProviderByModel(model, agentId?): LLMProvider | undefined;
```

Defined in: [niuma/config/manager.ts:315](https://github.com/lihaizhong/niuma/blob/main/niuma/config/manager.ts#L315)

根据模型名获取提供商实例

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `model` | `string` | 模型名 |
| `agentId?` | `string` | 角色ID（可选） |

#### Returns

[`LLMProvider`](../interfaces/LLMProvider.md) \| `undefined`

提供商实例

***

### hasAgent()

```ts
hasAgent(agentId): boolean;
```

Defined in: [niuma/config/manager.ts:249](https://github.com/lihaizhong/niuma/blob/main/niuma/config/manager.ts#L249)

检查角色是否存在

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `agentId` | `string` | 角色唯一标识符 |

#### Returns

`boolean`

角色是否存在

***

### initializeProviders()

```ts
initializeProviders(agentId?): void;
```

Defined in: [niuma/config/manager.ts:266](https://github.com/lihaizhong/niuma/blob/main/niuma/config/manager.ts#L266)

初始化 ProviderRegistry
将配置中的提供商信息注册到 ProviderRegistry

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `agentId?` | `string` | 角色ID（可选），如果不提供则使用全局配置 |

#### Returns

`void`

***

### listAgents()

```ts
listAgents(): AgentInfo[];
```

Defined in: [niuma/config/manager.ts:205](https://github.com/lihaizhong/niuma/blob/main/niuma/config/manager.ts#L205)

列出所有角色

#### Returns

[`AgentInfo`](../interfaces/AgentInfo.md)[]

角色信息数组

***

### listAvailableProviders()

```ts
listAvailableProviders(agentId?): ProviderSpec[];
```

Defined in: [niuma/config/manager.ts:343](https://github.com/lihaizhong/niuma/blob/main/niuma/config/manager.ts#L343)

列出所有可用的提供商

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `agentId?` | `string` | 角色ID（可选） |

#### Returns

[`ProviderSpec`](../interfaces/ProviderSpec.md)[]

可用的提供商规格列表

***

### load()

```ts
load(force?): object;
```

Defined in: [niuma/config/manager.ts:84](https://github.com/lihaizhong/niuma/blob/main/niuma/config/manager.ts#L84)

加载并解析配置文件

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `force` | `boolean` | `false` | 是否强制重新加载 |

#### Returns

验证后的配置对象

| Name | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| `agent` | `object` | - | Agent 配置 | [niuma/config/schema.ts:390](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L390) |
| `agent.maxRetries` | `number` | - | LLM 调用失败重试次数 | [niuma/config/schema.ts:300](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L300) |
| `agent.memoryWindow` | `number` | - | 记忆窗口大小（触发整合的消息数阈值） | [niuma/config/schema.ts:298](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L298) |
| `agent.progressMode` | `"quiet"` \| `"normal"` \| `"verbose"` | `ProgressModeSchema` | 进度通知模式 | [niuma/config/schema.ts:292](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L292) |
| `agent.retryBaseDelay` | `number` | - | 重试基础延迟（毫秒），指数退避 | [niuma/config/schema.ts:302](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L302) |
| `agent.showReasoning` | `boolean` | - | 是否显示推理内容（思维模型） | [niuma/config/schema.ts:294](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L294) |
| `agent.showToolDuration` | `boolean` | - | 是否显示工具执行耗时 | [niuma/config/schema.ts:296](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L296) |
| `agents` | `object` | - | 多角色配置 | [niuma/config/schema.ts:423](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L423) |
| `agents.defaults` | `object` | - | Agent 默认配置 | [niuma/config/schema.ts:352](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L352) |
| `agents.defaults.maxRetries` | `number` | - | LLM 调用失败重试次数 | [niuma/config/schema.ts:300](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L300) |
| `agents.defaults.memoryWindow` | `number` | - | 记忆窗口大小（触发整合的消息数阈值） | [niuma/config/schema.ts:298](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L298) |
| `agents.defaults.progressMode` | `"quiet"` \| `"normal"` \| `"verbose"` | `ProgressModeSchema` | 进度通知模式 | [niuma/config/schema.ts:292](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L292) |
| `agents.defaults.retryBaseDelay` | `number` | - | 重试基础延迟（毫秒），指数退避 | [niuma/config/schema.ts:302](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L302) |
| `agents.defaults.showReasoning` | `boolean` | - | 是否显示推理内容（思维模型） | [niuma/config/schema.ts:294](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L294) |
| `agents.defaults.showToolDuration` | `boolean` | - | 是否显示工具执行耗时 | [niuma/config/schema.ts:296](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L296) |
| `agents.list` | `object`[] | - | 角色列表 | [niuma/config/schema.ts:361](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L361) |
| `channels` | `object` | - | 渠道配置 | [niuma/config/schema.ts:401](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L401) |
| `channels.channels` | ( \| \{ `enabled`: `boolean`; `token`: `string`; `type`: `"telegram"`; `webhookUrl?`: `string`; \} \| \{ `applicationId`: `string`; `enabled`: `boolean`; `token`: `string`; `type`: `"discord"`; \} \| \{ `appId`: `string`; `appSecret`: `string`; `enabled`: `boolean`; `encryptKey?`: `string`; `serverPath?`: `string`; `serverPort?`: `number`; `type`: `"feishu"`; `verificationToken?`: `string`; \} \| \{ `appKey`: `string`; `appSecret`: `string`; `enabled`: `boolean`; `serverPath?`: `string`; `serverPort?`: `number`; `type`: `"dingtalk"`; \} \| \{ `appToken?`: `string`; `botToken`: `string`; `enabled`: `boolean`; `serverPath?`: `string`; `serverPort?`: `number`; `signingSecret?`: `string`; `type`: `"slack"`; \} \| \{ `authStatePath?`: `string`; `browser?`: \[`string`, `string`, `string`\]; `enabled`: `boolean`; `type`: `"whatsapp"`; \} \| \{ `checkInterval?`: `number`; `enabled`: `boolean`; `imap?`: \{ `host`: `string`; `inbox?`: `string`; `password`: `string`; `port?`: `number`; `secure?`: `boolean`; `user`: `string`; \}; `smtp?`: \{ `from`: `string`; `host`: `string`; `password`: `string`; `port?`: `number`; `secure?`: `boolean`; `user`: `string`; \}; `type`: `"email"`; \} \| \{ `account`: `number`; `deviceFilePath?`: `string`; `enabled`: `boolean`; `password`: `string`; `platform?`: `number`; `type`: `"qq"`; `useSlider?`: `boolean`; \} \| \{ `enabled`: `boolean`; `type`: `"cli"`; \})[] | - | 各渠道具体配置 | [niuma/config/schema.ts:233](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L233) |
| `channels.defaults` | `object` | - | 渠道通用默认配置 | [niuma/config/schema.ts:228](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L228) |
| `channels.defaults.retryAttempts` | `number` | - | 重试次数 | [niuma/config/schema.ts:106](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L106) |
| `channels.defaults.timeout` | `number` | - | 请求超时时间（毫秒） | [niuma/config/schema.ts:104](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L104) |
| `channels.enabled` | ( \| `"telegram"` \| `"discord"` \| `"feishu"` \| `"dingtalk"` \| `"slack"` \| `"whatsapp"` \| `"email"` \| `"qq"` \| `"cli"`)[] | - | 启用的渠道列表 | [niuma/config/schema.ts:224](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L224) |
| `cronTasks` | `object`[] | - | 定时任务配置 | [niuma/config/schema.ts:410](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L410) |
| `debug` | `boolean` | - | 调试模式 | [niuma/config/schema.ts:419](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L419) |
| `heartbeat` | `object` | - | 心跳服务配置 | [niuma/config/schema.ts:412](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L412) |
| `heartbeat.enabled` | `boolean` | - | 是否启用心跳服务 | [niuma/config/schema.ts:267](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L267) |
| `heartbeat.filePath` | `string` | - | HEARTBEAT.md 文件路径（相对于工作区根目录） | [niuma/config/schema.ts:271](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L271) |
| `heartbeat.interval` | `string` | - | 检查间隔（Cron 表达式，默认每 30 分钟） | [niuma/config/schema.ts:269](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L269) |
| `heartbeat.taskTimeout` | `number` | - | 任务执行超时时间（秒，默认 5 分钟） | [niuma/config/schema.ts:273](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L273) |
| `logLevel` | `"error"` \| `"warn"` \| `"info"` \| `"debug"` | - | 日志级别 | [niuma/config/schema.ts:421](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L421) |
| `maxIterations` | `number` | - | 最大 Agent 迭代次数 | [niuma/config/schema.ts:388](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L388) |
| `providers` | `Record`\<`string`, \{ `apiBase?`: `string`; `apiKey?`: `string`; `extra?`: `Record`\<`string`, `unknown`\>; `frequencyPenalty?`: `number`; `maxTokens?`: `number`; `model`: `string`; `presencePenalty?`: `number`; `stopSequences?`: `string`[]; `temperature?`: `number`; `timeout?`: `number`; `topP?`: `number`; `type`: `"openai"` \| `"anthropic"` \| `"ollama"` \| `"custom"`; \}\> | - | LLM 提供商配置 | [niuma/config/schema.ts:399](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L399) |
| `workspaceDir` | `string` | - | 工作目录 | [niuma/config/schema.ts:386](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L386) |

***

### resetProviders()

```ts
resetProviders(): void;
```

Defined in: [niuma/config/manager.ts:386](https://github.com/lihaizhong/niuma/blob/main/niuma/config/manager.ts#L386)

重置 ProviderRegistry
清除所有提供商实例和配置

#### Returns

`void`
