# Variable: ProviderConfigSchema

```ts
const ProviderConfigSchema: ZodObject<{
  apiBase: ZodOptional<ZodString>;
  apiKey: ZodOptional<ZodString>;
  extra: ZodOptional<ZodRecord<ZodString, ZodUnknown>>;
  frequencyPenalty: ZodOptional<ZodNumber>;
  maxTokens: ZodOptional<ZodNumber>;
  model: ZodString;
  presencePenalty: ZodOptional<ZodNumber>;
  stopSequences: ZodOptional<ZodArray<ZodString>>;
  temperature: ZodOptional<ZodNumber>;
  timeout: ZodOptional<ZodNumber>;
  topP: ZodOptional<ZodNumber>;
  type: ZodDefault<ZodEnum<{
     anthropic: "anthropic";
     custom: "custom";
     ollama: "ollama";
     openai: "openai";
  }>>;
}, $strip>;
```

Defined in: [niuma/config/schema.ts:14](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L14)

基础提供商配置 Schema
