# Variable: LLMConfigSchema

```ts
const LLMConfigSchema: ZodObject<{
  defaultProvider: ZodOptional<ZodString>;
  providers: ZodRecord<ZodString, ZodObject<{
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
  }, $strip>>;
}, $strip>;
```

Defined in: [niuma/config/schema.ts:88](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L88)

LLM 配置 Schema
定义多提供商配置结构
