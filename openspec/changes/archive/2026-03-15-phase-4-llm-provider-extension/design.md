## Context

当前 Niuma 仅支持 OpenAI 提供商，所有 LLM 调用都通过 `niuma/providers/openai.ts` 实现。用户通过 `niuma.config.json` 配置 OpenAI API 密钥和端点。提供商实例在 `config/manager.ts` 中根据配置动态创建，但当前实现硬编码为 OpenAI。

**当前架构：**

```
niuma/
├── providers/
│   ├── base.ts          # LLMProvider 接口
│   └── openai.ts        # OpenAI 实现
├── config/
│   ├── schema.ts        # 配置 Schema（仅支持 OpenAI）
│   └── manager.ts       # 配置管理器（硬编码创建 OpenAI 实例）
└── types/
    └── llm.ts           # LLM 相关类型
```

**问题：**
- 缺乏提供商抽象和注册机制
- 添加新提供商需要修改核心代码
- 无法支持多提供商并存
- 用户无法灵活选择不同的 LLM 模型

## Goals / Non-Goals

**Goals:**
- 实现可扩展的提供商系统，支持动态添加新提供商
- 支持 Anthropic、OpenRouter、DeepSeek 和自定义 OpenAI 兼容端点
- 实现两步式提供商注册（spec + config field）
- 实现智能提供商匹配机制（支持显式指定、关键词匹配、网关回退）
- 保持向后兼容，现有 OpenAI 配置无需修改
- 提供统一的错误处理和重试机制

**Non-Goals:**
- 不支持非 OpenAI 兼容的提供商（如 Cohere、HuggingFace）
- 不实现提供商性能对比和自动切换
- 不实现提供商级别的成本追踪
- 不支持自定义模型别名或映射规则

## Decisions

### 1. 提供商注册机制：两步式注册 + 智能匹配

**决策：** 采用 nanobot 的提供商注册表模式，实现两步式注册和智能匹配。

**架构设计：**

```
ProviderSpec {
  name: string              // 配置字段名（如 "openai", "anthropic"）
  keywords: string[]        // 模型名关键词匹配（如 ["gpt", "o1"]）
  envKey: string            // 环境变量名（如 "OPENAI_API_KEY"）
  displayName: string       // 显示名称（如 "OpenAI"）
  isGateway?: boolean       // 是否为网关（如 OpenRouter）
  defaultApiBase?: string   // 默认 API Base
}

ProviderRegistry {
  private specs: Map<string, ProviderSpec>
  register(spec: ProviderSpec)
  getProvider(model: string): LLMProvider
  getProviderByName(name: string): LLMProvider
}
```

**匹配策略（优先级从高到低）：**
1. **显式指定**：模型名包含提供商前缀（如 `openai/gpt-4o`、`anthropic/claude-3-opus`）
2. **关键词匹配**：模型名匹配提供商关键词（如 `gpt-4o` → OpenAI，`claude-3-opus` → Anthropic）
3. **网关回退**：如果配置了网关提供商（如 OpenRouter），使用网关

**选择理由：**
- 提供灵活性：用户可以通过前缀显式指定提供商
- 自动化：关键词匹配减少配置负担
- 兼容性：网关回退确保未知模型也能工作
- 可扩展：易于添加新提供商

**替代方案：**
- 配置文件指定每个模型的提供商：过于繁琐，用户需手动维护映射表
- 仅支持显式指定：灵活性不足，无法自动匹配

### 2. 多提供商配置：统一配置 + 环境变量支持

**决策：** 在 `niuma.config.json` 中支持多提供商配置，每个提供商有独立的配置块。

**配置格式：**

```json5
{
  "llm": {
    "defaultProvider": "openai",  // 默认提供商
    "providers": {
      "openai": {
        "model": "gpt-4o",
        "apiKey": "${OPENAI_API_KEY}",
        "apiBase": "${OPENAI_BASE_URL:https://api.openai.com/v1}"
      },
      "anthropic": {
        "model": "claude-3-5-sonnet-20241022",
        "apiKey": "${ANTHROPIC_API_KEY}"
      },
      "openrouter": {
        "model": "anthropic/claude-3.5-sonnet",
        "apiKey": "${OPENROUTER_API_KEY}",
        "apiBase": "https://openrouter.ai/api/v1"
      },
      "deepseek": {
        "model": "deepseek-chat",
        "apiKey": "${DEEPSEEK_API_KEY}",
        "apiBase": "https://api.deepseek.com"
      },
      "custom": {
        "model": "llama-3-8b",
        "apiKey": "sk-xxx",
        "apiBase": "http://localhost:11434/v1"  // Ollama
      }
    }
  }
}
```

**选择理由：**
- 灵活性：支持多提供商并存
- 安全性：使用环境变量保护 API 密钥
- 向后兼容：单一 OpenAI 配置自动迁移到新格式
- 易用性：提供默认值和可选配置

**替代方案：**
- 每个提供商单独的配置文件：过于分散，难以管理
- 仅支持环境变量：灵活性不足，无法配置自定义端点

### 3. Anthropic 提供商：使用官方 SDK

**决策：** 使用 `@anthropic-ai/sdk` 官方 SDK 实现 Anthropic 提供商。

**实现要点：**
- 支持 Claude 3.5 Sonnet、Claude 3 Opus 等最新模型
- 支持 `anthropic-beta` 功能（如 prompt caching、computer use）
- 自动处理 Anthropic 特有的消息格式（`user` + `assistant` 交替）
- 支持流式响应和工具调用

**选择理由：**
- 官方维护，稳定可靠
- 自动更新到最新 API
- 完整的 TypeScript 类型支持
- 丰富的错误处理和重试机制

**替代方案：**
- 使用 LangChain 的 Anthropic 集成：依赖 LangChain 版本，可能滞后于官方 API
- 直接调用 REST API：需要手动处理请求/响应格式，维护成本高

### 4. OpenRouter 提供商：兼容 OpenAI API

**决策：** 基于 OpenAI 提供商实现，通过自定义 `apiBase` 指向 OpenRouter。

**实现要点：**
- 继承 `OpenAIProvider`，复用大部分逻辑
- 设置默认 `apiBase` 为 `https://openrouter.ai/api/v1`
- 自动添加 `HTTP-Referer` 和 `X-Title` 头（OpenRouter 要求）
- 支持所有 OpenAI 功能（流式响应、工具调用等）

**选择理由：**
- OpenRouter API 完全兼容 OpenAI API
- 最小化代码重复
- 易于维护和更新

**替代方案：**
- 独立实现：代码重复，维护成本高

### 5. DeepSeek 提供商：兼容 OpenAI API

**决策：** 基于 OpenAI 提供商实现，通过自定义 `apiBase` 指向 DeepSeek。

**实现要点：**
- 继承 `OpenAIProvider`，复用大部分逻辑
- 设置默认 `apiBase` 为 `https://api.deepseek.com`
- 支持 DeepSeek 特有的模型（deepseek-chat、deepseek-coder）

**选择理由：**
- DeepSeek API 兼容 OpenAI API
- 最小化代码重复
- 易于维护和更新

**替代方案：**
- 独立实现：代码重复，维护成本高

### 6. 自定义提供商：支持任意 OpenAI 兼容端点

**决策：** 基于 OpenAI 提供商实现，允许用户自定义 `apiBase` 和认证方式。

**实现要点：**
- 继承 `OpenAIProvider`
- 支持自定义 `apiBase`（如 Azure OpenAI、Ollama、vLLM）
- 支持自定义认证头（如 `Authorization: Bearer <token>`）
- 支持自定义模型列表（用于验证）

**选择理由：**
- 通用性强，支持各种 OpenAI 兼容服务
- 最小化代码重复
- 易于扩展

**替代方案：**
- 为每个服务单独实现提供商：代码重复，难以维护

### 7. 配置 Schema 扩展：向后兼容

**决策：** 扩展现有配置 Schema，保持向后兼容。

**迁移策略：**
```typescript
// 旧配置（v0.1.4 及之前）
{
  "llm": {
    "model": "gpt-4o",
    "apiKey": "${OPENAI_API_KEY}",
    "apiBase": "${OPENAI_BASE_URL}"
  }
}

// 新配置（v0.2.0+）
{
  "llm": {
    "defaultProvider": "openai",
    "providers": {
      "openai": {
        "model": "gpt-4o",
        "apiKey": "${OPENAI_API_KEY}",
        "apiBase": "${OPENAI_BASE_URL}"
      }
    }
  }
}
```

**迁移逻辑：**
1. 检测旧配置格式
2. 自动迁移到新格式
3. 记录迁移日志
4. 向后兼容：如果检测到旧格式，自动使用 OpenAI 提供商

**选择理由：**
- 无缝升级，用户无需手动迁移
- 渐进式迁移，降低风险
- 提供清晰的迁移提示

**替代方案：**
- 强制用户手动迁移：用户体验差，升级阻力大

## Risks / Trade-offs

### 风险 1：提供商 SDK 依赖冲突

**风险：** 不同提供商的 SDK 可能存在依赖冲突（如版本不兼容）。

**缓解措施：**
- Anthropic 使用官方 SDK，其他提供商使用兼容 OpenAI API
- 使用 pnpm 的工作区功能隔离依赖
- 定期更新依赖，测试兼容性

### 风险 2：模型名匹配冲突

**风险：** 不同提供商可能有相似或相同的模型名，导致匹配错误。

**缓解措施：**
- 优先使用显式前缀（如 `openai/gpt-4o`）
- 关键词匹配时使用最具体的匹配（如 "gpt-4" 优先于 "gpt"）
- 提供配置验证和警告
- 允许用户手动指定提供商

### 风险 3：API 差异导致行为不一致

**风险：** 不同提供商的 API 行为可能不同（如错误格式、流式响应格式）。

**缓解措施：**
- 统一错误处理，将各提供商的错误转换为 `ProviderError`
- 统一流式响应格式，处理不同提供商的块格式差异
- 编写集成测试，验证每个提供商的行为
- 提供提供商特定的配置选项

### 风险 4：配置迁移失败

**风险：** 配置迁移可能失败或产生意外结果。

**缓解措施：**
- 提供配置验证工具
- 在迁移前备份原配置
- 提供回滚机制
- 记录详细的迁移日志

### 权衡 1：代码复用 vs 独立实现

**权衡：** 继承 `OpenAIProvider` 可以复用代码，但可能限制提供商特定的功能。

**决策：** 对于兼容 OpenAI API 的提供商（OpenRouter、DeepSeek、自定义），继承 `OpenAIProvider`；对于有独特功能的提供商（Anthropic），独立实现。

### 权衡 2：智能匹配 vs 显式配置

**权衡：** 智能匹配可以减少配置负担，但可能产生意外结果。

**决策：** 采用混合策略：优先使用显式指定，其次使用智能匹配，最后回退到网关。提供配置验证和警告。

## Migration Plan

**步骤 1：扩展配置 Schema**
- 更新 `niuma/config/schema.ts`
- 支持新配置格式
- 保持向后兼容

**步骤 2：实现提供商注册表**
- 创建 `niuma/providers/registry.ts`
- 实现两步式注册
- 实现智能匹配

**步骤 3：实现各提供商**
- Anthropic：使用官方 SDK
- OpenRouter：继承 OpenAI 提供商
- DeepSeek：继承 OpenAI 提供商
- 自定义：继承 OpenAI 提供商

**步骤 4：更新配置管理器**
- 修改 `niuma/config/manager.ts`
- 支持多提供商配置
- 实现配置迁移逻辑

**步骤 5：编写测试**
- 单元测试：每个提供商的独立功能
- 集成测试：提供商注册和匹配
- 端到端测试：完整的多提供商场景

**步骤 6：更新文档**
- 更新 `AGENTS.md`
- 更新 `CHANGELOG.md`
- 更新配置示例

**回滚策略：**
- 如果新版本出现问题，用户可以回退到 v0.1.4
- 旧配置格式仍然支持
- 提供配置降级工具

## Open Questions

1. **提供商优先级：** 如果配置了多个提供商，且模型名不包含前缀，应该使用哪个提供商？
   - **倾向：** 使用配置文件中的 `defaultProvider`，如果没有配置则使用第一个可用提供商

2. **网关提供商：** OpenRouter 是否应该作为默认的网关回退？
   - **倾向：** 是的，因为 OpenRouter 支持几乎所有模型

3. **认证方式：** 自定义提供商是否应该支持非 Bearer Token 认证（如 API Key in query）？
   - **倾向：** 暂不支持，因为大多数 OpenAI 兼容服务都使用 Bearer Token

4. **模型验证：** 是否应该在启动时验证每个提供商的模型列表？
   - **倾向：** 暂不支持，因为会增加启动时间和 API 调用成本。可以提供可选的验证工具。