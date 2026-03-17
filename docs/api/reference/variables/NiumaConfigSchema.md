# Variable: NiumaConfigSchema

```ts
const NiumaConfigSchema: ZodObject<{
  agent: ZodDefault<ZodObject<{
     maxRetries: ZodDefault<ZodNumber>;
     memoryWindow: ZodDefault<ZodNumber>;
     progressMode: ZodDefault<ZodEnum<{
        normal: "normal";
        quiet: "quiet";
        verbose: "verbose";
     }>>;
     retryBaseDelay: ZodDefault<ZodNumber>;
     showReasoning: ZodDefault<ZodBoolean>;
     showToolDuration: ZodDefault<ZodBoolean>;
  }, $strip>>;
  agents: ZodDefault<ZodObject<{
     defaults: ZodDefault<ZodObject<{
        maxRetries: ZodDefault<ZodNumber>;
        memoryWindow: ZodDefault<ZodNumber>;
        progressMode: ZodDefault<ZodEnum<{
           normal: ...;
           quiet: ...;
           verbose: ...;
        }>>;
        retryBaseDelay: ZodDefault<ZodNumber>;
        showReasoning: ZodDefault<ZodBoolean>;
        showToolDuration: ZodDefault<ZodBoolean>;
     }, $strip>>;
     list: ZodDefault<ZodArray<ZodObject<{
        agent: ZodOptional<ZodObject<..., ...>>;
        channels: ZodOptional<ZodArray<...>>;
        cronTasks: ZodOptional<ZodArray<...>>;
        debug: ZodOptional<ZodBoolean>;
        default: ZodDefault<ZodBoolean>;
        description: ZodOptional<ZodString>;
        id: ZodString;
        logLevel: ZodOptional<ZodEnum<...>>;
        name: ZodOptional<ZodString>;
        providers: ZodOptional<ZodRecord<..., ...>>;
        workspaceDir: ZodOptional<ZodString>;
     }, $strip>>>;
  }, $strip>>;
  channels: ZodDefault<ZodObject<{
     channels: ZodDefault<ZodArray<ZodDiscriminatedUnion<[ZodObject<{
        enabled: ...;
        token: ...;
        type: ...;
        webhookUrl: ...;
      }, $strip>, ZodObject<{
        applicationId: ...;
        enabled: ...;
        token: ...;
        type: ...;
      }, $strip>, ZodObject<{
        appId: ...;
        appSecret: ...;
        enabled: ...;
        encryptKey: ...;
        serverPath: ...;
        serverPort: ...;
        type: ...;
        verificationToken: ...;
     }, $strip>], "type">>>;
     defaults: ZodDefault<ZodObject<{
        retryAttempts: ZodDefault<ZodNumber>;
        timeout: ZodDefault<ZodNumber>;
     }, $strip>>;
     enabled: ZodDefault<ZodArray<ZodEnum<{
        cli: "cli";
        dingtalk: "dingtalk";
        discord: "discord";
        email: "email";
        feishu: "feishu";
        qq: "qq";
        slack: "slack";
        telegram: "telegram";
        whatsapp: "whatsapp";
     }>>>;
  }, $strip>>;
  cronTasks: ZodDefault<ZodArray<ZodObject<{
     enabled: ZodDefault<ZodBoolean>;
     handler: ZodString;
     name: ZodString;
     params: ZodOptional<ZodRecord<ZodString, ZodUnknown>>;
     schedule: ZodString;
  }, $strip>>>;
  debug: ZodDefault<ZodBoolean>;
  heartbeat: ZodDefault<ZodObject<{
     enabled: ZodDefault<ZodBoolean>;
     filePath: ZodDefault<ZodString>;
     interval: ZodDefault<ZodString>;
     taskTimeout: ZodDefault<ZodNumber>;
  }, $strip>>;
  logLevel: ZodDefault<ZodEnum<{
     debug: "debug";
     error: "error";
     info: "info";
     warn: "warn";
  }>>;
  maxIterations: ZodDefault<ZodNumber>;
  providers: ZodDefault<ZodRecord<ZodString, ZodObject<{
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
  }, $strip>>>;
  workspaceDir: ZodDefault<ZodString>;
}, $strip>;
```

Defined in: [niuma/config/schema.ts:384](https://github.com/lihaizhong/niuma/blob/main/niuma/config/schema.ts#L384)
