## Why

当前 Niuma 仅支持 OpenAI 提供商，限制了用户对其他 LLM 模型的选择。企业用户可能需要使用 Claude（Anthropic）、OpenRouter（多模型网关）、DeepSeek 等其他提供商，以满足不同的成本、性能和合规性需求。扩展提供商支持将提升 Niuma 的灵活性和市场竞争力。

## What Changes

- **新增 Anthropic 提供商**：支持 Claude 3.5 Sonnet、Claude 3 Opus 等模型
- **新增 OpenRouter 提供商**：支持多模型网关访问各类 LLM
- **新增 DeepSeek 提供商**：支持 DeepSeek 系列模型
- **新增自定义提供商**：支持 OpenAI 兼容端点（如 Azure OpenAI、本地 Ollama 等）
- **新增提供商注册表**：实现两步式注册（spec + config field）和智能匹配机制
- **配置文件扩展**：在 `niuma.config.json` 中支持多提供商配置

## Capabilities

### New Capabilities

- `anthropic-provider`: Anthropic Claude 系列模型提供商，支持 Anthropic API v2025-01-24
- `openrouter-provider`: OpenRouter 多模型网关提供商，支持统一 API 访问多种模型
- `deepseek-provider`: DeepSeek 系列模型提供商，支持 DeepSeek API
- `custom-provider`: 自定义 OpenAI 兼容端点提供商，支持用户自定义 API Base 和认证
- `provider-registry`: 提供商注册表，实现两步式注册和智能匹配

### Modified Capabilities

- `llm-provider`: 扩展现有提供商系统，支持多提供商并存和自动选择

## Impact

- **新增文件**：`niuma/providers/anthropic.ts`、`niuma/providers/openrouter.ts`、`niuma/providers/deepseek.ts`、`niuma/providers/custom.ts`、`niuma/providers/registry.ts`
- **修改文件**：`niuma/providers/base.ts`（扩展基类接口）、`niuma/config/schema.ts`（新增多提供商配置 Schema）
- **新增依赖**：@anthropic-ai/sdk（Anthropic SDK）
- **配置变更**：用户需要配置多个提供商的 API 密钥和端点
- **向后兼容**：现有 OpenAI 提供商配置保持兼容，无需迁移