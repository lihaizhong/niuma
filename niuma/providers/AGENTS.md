# Providers - LLM 提供商

**Scope:** `niuma/providers/` — 8 个 LLM 提供商实现

## OVERVIEW

统一的 LLM 提供商抽象层，支持 8 个提供商：OpenAI、Anthropic、Ollama、DeepSeek、OpenRouter、自定义端点。

**Architecture:** 接口 + 实现类 + 注册表

## STRUCTURE

```
providers/
├── index.ts              # Barrel 导出
├── base.ts               # LLMProvider 接口 + 类型导出
├── registry.ts           # ProviderRegistry 类
├── types.ts              # 提供商配置类型
├── openai.ts             # OpenAI 实现
├── anthropic.ts          # Anthropic 实现
├── ollama.ts             # Ollama 实现
├── deepseek.ts           # DeepSeek 实现
├── openrouter.ts         # OpenRouter 实现
├── openai-compatible.ts  # OpenAI 兼容端点基类
└── custom.ts             # 自定义端点
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Provider 接口 | `base.ts:11` | `LLMProvider` 必须实现 |
| 添加新提供商 | `*.ts` 复制模板 | 继承 `OpenAICompatibleProvider` 或实现接口 |
| 提供商注册 | `registry.ts:1` | `ProviderRegistry` 类 |
| 配置类型 | `types.ts:27` | `BaseProviderConfig`, `OpenAICompatibleConfig` |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| LLMProvider | interface | `base.ts:11` | 所有提供商必须实现 |
| OpenAIProvider | class | `openai.ts:1` | OpenAI 官方 API |
| AnthropicProvider | class | `anthropic.ts:10` | Claude API |
| OllamaProvider | class | `ollama.ts:1` | 本地 Ollama |
| DeepSeekProvider | class | `deepseek.ts:1` | DeepSeek API |
| OpenRouterProvider | class | `openrouter.ts:1` | OpenRouter 聚合 |
| OpenAICompatibleProvider | abstract | `openai-compatible.ts:9` | OpenAI 兼容基类 |
| CustomProvider | class | `custom.ts:1` | 完全自定义 |
| ProviderRegistry | class | `registry.ts:1` | 运行时提供商管理 |

## CONVENTIONS

### 实现新提供商

**方式 1: 继承 OpenAICompatibleProvider（推荐）**
```typescript
export class MyProvider extends OpenAICompatibleProvider {
  readonly name = "my-provider";
  getDefaultModel(): string { return "my-model"; }
  protected getApiBase(): string { return "https://api.example.com/v1"; }
}
```

**方式 2: 实现 LLMProvider 接口（完全自定义）**
```typescript
export class MyProvider implements LLMProvider {
  readonly name = "my-provider";
  getConfig(): LLMConfig { ... }
  async chat(options: ChatOptions): Promise<LLMResponse> { ... }
  getDefaultModel(): string { ... }
}
```

### 提供商配置

所有提供商接受 `LLMConfig`：
```typescript
interface LLMConfig {
  model: string;           // 模型标识符
  apiKey?: string;         // API 密钥
  apiBase?: string;        // API 基础 URL
  temperature?: number;    // 采样温度 (0-2)
  maxTokens?: number;      // 最大 token
  // ... 其他参数
}
```

## ANTI-PATTERNS

| Pattern | Status | Rule |
|---------|--------|------|
| 在提供商中直接使用 console.log | 🚫 FORBIDDEN | 通过返回值传递信息 |
| 修改 base.ts 中的导出 | ⚠️ WARNING | 会影响所有提供商 |
| 忽略 apiBase 配置 | ⚠️ WARNING | 必须支持自定义端点 |

## PATTERNS

### OpenAI 兼容端点
大多数提供商支持 OpenAI 格式：
- 使用 `OpenAICompatibleProvider` 基类
- 只需实现 `getApiBase()` 和 `getDefaultModel()`

### 响应解析
```typescript
protected parseResponse(data: {
  choices?: Array<{ message?: { content?: string; tool_calls?: ToolCall[] } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}): LLMResponse
```

## NOTES

- **文件大小:** 单文件平均 60 行，最大 127 行（openai-compatible.ts 基类）
- **测试覆盖:** 集成测试在 `__tests__/agent.test.ts`
- **错误处理:** 抛出 `Error` 带状态码信息

## PROVIDER LIST

| Provider | File | Base URL | Models |
|----------|------|----------|--------|
| OpenAI | `openai.ts` | api.openai.com | gpt-4o, gpt-4, gpt-3.5 |
| Anthropic | `anthropic.ts` | api.anthropic.com | claude-3-5-sonnet |
| Ollama | `ollama.ts` | localhost:11434 | llama3, mistral, etc. |
| DeepSeek | `deepseek.ts` | api.deepseek.com | deepseek-chat |
| OpenRouter | `openrouter.ts` | openrouter.ai | 聚合多提供商 |
| Custom | `custom.ts` | 用户指定 | 任意 |
