# Phase 4: LLM 提供商扩展 - 实施任务

## 任务列表

### 阶段 1：配置 Schema 扩展

- [x] **任务 1.1：扩展 LLM 配置 Schema**
  - 位置：`niuma/config/schema.ts`
  - 描述：扩展配置 Schema 以支持多提供商配置
  - 具体步骤：
    1. 添加 `LLMConfigSchema` 接口，包含 `defaultProvider` 和 `providers` 字段
    2. 添加 `LLMProviderConfig` 接口，定义单个提供商的配置结构
    3. 保持向后兼容，支持旧配置格式
    4. 添加配置验证规则（如 API Base URL 验证）
  - 验收标准：
    - 新配置格式通过 Zod 验证
    - 旧配置格式仍然有效
    - 配置错误能够正确捕获和报告

### 阶段 2：提供商注册表

- [x] **任务 2.1：创建提供商注册表**
  - 位置：`niuma/providers/registry.ts`
  - 描述：实现两步式提供商注册和智能匹配机制
  - 具体步骤：
    1. 定义 `ProviderSpec` 接口
    2. 创建 `ProviderRegistry` 类
    3. 实现 `register()` 和 `registerMultiple()` 方法
    4. 实现 `getProvider(model)` 方法，支持显式指定、关键词匹配、网关回退
    5. 实现 `getProviderByName(name)` 方法
    6. 实现 `setDefaultProvider()` 和 `getDefaultProvider()` 方法
    7. 实现 `listProviders()` 和 `listAvailableProviders()` 方法
    8. 实现 `_registerBuiltinProviders()` 方法，自动注册内置提供商
  - 验收标准：
    - 所有内置提供商自动注册
    - 模型名匹配逻辑正确（优先级：显式指定 > 关键词匹配 > 网关回退 > 默认提供商）
    - 注册和查询方法正常工作

- [x] **任务 2.2：编写提供商注册表测试**
  - 位置：`niuma/__tests__/provider-registry.test.ts`
  - 描述：为提供商注册表编写完整的单元测试
  - 具体步骤：
    1. 测试提供商注册和查询
    2. 测试模型名匹配逻辑（显式指定、关键词匹配、网关回退）
    3. 测试默认提供商设置和获取
    4. 测试批量注册和重复注册
    5. 测试提供商列表查询
  - 验收标准：
    - 所有测试通过（覆盖率 >= 90%）
    - 边界情况得到处理

### 阶段 3：提供商实现

- [x] **任务 3.1：安装 Anthropic SDK**
  - 位置：`package.json`
  - 描述：添加 Anthropic 官方 SDK 依赖
  - 具体步骤：
    1. 运行 `pnpm add @anthropic-ai/sdk`
    2. 验证依赖安装成功
  - 验收标准：
    - 依赖成功添加到 package.json
    - pnpm-lock.yaml 正确更新

- [x] **任务 3.2：实现 Anthropic 提供商**
  - 位置：`niuma/providers/anthropic.ts`
  - 描述：使用 Anthropic SDK 实现 Claude 系列模型提供商
  - 具体步骤：
    1. 创建 `AnthropicConfig` 接口
    2. 创建 `AnthropicProvider` 类，实现 `LLMProvider` 接口
    3. 实现 `chat()` 方法，处理 Anthropic API 调用
    4. 实现 `chatStream()` 方法，支持流式响应
    5. 实现 `getDefaultModel()` 方法
    6. 实现 `isAvailable()` 方法
    7. 实现 `_convertMessages()` 方法，转换消息格式
    8. 实现 `_parseResponse()` 和 `_parseStreamChunk()` 方法
    9. 实现 `_handleError()` 方法，处理 Anthropic 特定错误
    10. 支持 Anthropic beta 功能（prompt caching、computer use）
  - 验收标准：
    - 实现 `LLMProvider` 接口的所有方法
    - 支持所有 Claude 模型（3.5 Sonnet、3 Opus、3 Haiku）
    - 流式响应和工具调用正常工作
    - 错误处理正确

- [x] **任务 3.3：实现 OpenRouter 提供商**
  - 位置：`niuma/providers/openrouter.ts`
  - 描述：基于 OpenAI 提供商实现 OpenRouter 多模型网关
  - 具体步骤：
    1. 创建 `OpenRouterConfig` 接口
    2. 创建 `OpenRouterProvider` 类，继承 `OpenAIProvider`
    3. 覆盖构造函数，设置默认 API Base
    4. 覆盖 `_createClient()` 方法，添加 OpenRouter 特定的 HTTP 头
    5. 设置 `isGateway = true` 标记
  - 验收标准：
    - 继承 `OpenAIProvider` 的所有功能
    - 默认 API Base 正确设置
    - OpenRouter HTTP 头正确添加
    - 支持所有 OpenAI 功能（流式响应、工具调用）

- [x] **任务 3.4：实现 DeepSeek 提供商**
  - 位置：`niuma/providers/deepseek.ts`
  - 描述：基于 OpenAI 提供商实现 DeepSeek 系列模型
  - 具体步骤：
    1. 创建 `DeepSeekConfig` 接口
    2. 创建 `DeepSeekProvider` 类，继承 `OpenAIProvider`
    3. 覆盖构造函数，设置默认 API Base
    4. 设置默认模型为 `deepseek-chat`
  - 验收标准：
    - 继承 `OpenAIProvider` 的所有功能
    - 默认 API Base 正确设置
    - 支持 DeepSeek Chat 和 Coder 模型

- [x] **任务 3.5：实现自定义提供商**
  - 位置：`niuma/providers/custom.ts`
  - 描述：基于 OpenAI 提供商实现自定义 OpenAI 兼容端点
  - 具体步骤：
    1. 创建 `CustomConfig` 接口
    2. 创建 `CustomProvider` 类，继承 `OpenAIProvider`
    3. 覆盖构造函数，添加配置验证
    4. 实现 `_validateConfig()` 方法，验证 API Base
    5. 支持自定义 HTTP 头
    6. 支持自定义模型列表验证
  - 验收标准：
    - 继承 `OpenAIProvider` 的所有功能
    - API Base 配置正确验证
    - 支持常见的 OpenAI 兼容端点（Azure OpenAI、Ollama、vLLM）
    - 自定义 HTTP 头正确应用

- [ ] **任务 3.6：编写提供商测试**
  - 位置：`niuma/__tests__/anthropic-provider.test.ts`, `openrouter-provider.test.ts`, `deepseek-provider.test.ts`, `custom-provider.test.ts`
  - 描述：为每个提供商编写单元测试
  - 具体步骤：
    1. Anthropic 提供商测试
    2. OpenRouter 提供商测试
    3. DeepSeek 提供商测试
    4. 自定义提供商测试
  - 验收标准：
    - 所有测试通过（覆盖率 >= 90%）
    - Mock 测试覆盖所有 API 调用场景

### 阶段 4：配置管理器更新

- [ ] **任务 4.1：实现配置迁移逻辑**
  - 位置：`niuma/config/manager.ts`
  - 描述：实现从旧配置格式到新配置格式的自动迁移
  - 具体步骤：
    1. 添加 `ConfigMigration` 接口
    2. 实现 `detectOldConfig()` 方法
    3. 实现 `migrateConfig()` 方法
    4. 实现 `validateNewConfig()` 方法
    5. 记录迁移日志
  - 验收标准：
    - 旧配置格式能够正确检测
    - 迁移逻辑正确生成新配置
    - 迁移日志清晰记录变更

- [ ] **任务 4.2：更新配置管理器**
  - 位置：`niuma/config/manager.ts`
  - 描述：支持多提供商配置和提供商实例创建
  - 具体步骤：
    1. 更新 `createProvider()` 方法，使用 `ProviderRegistry`
    2. 支持从多提供商配置创建提供商实例
    3. 实现默认提供商选择逻辑
    4. 添加健康检查方法
  - 验收标准：
    - 能够从新配置格式创建提供商
    - 能够根据模型名自动选择提供商
    - 健康检查功能正常工作

- [ ] **任务 4.3：编写配置管理器测试**
  - 位置：`niuma/__tests__/config-manager-llm.test.ts`
  - 描述：为配置管理器的 LLM 相关功能编写测试
  - 具体步骤：
    1. 测试配置迁移
    2. 测试多提供商配置加载
    3. 测试提供商实例创建
    4. 测试提供商自动选择
    5. 测试健康检查
  - 验收标准：
    - 所有测试通过（覆盖率 >= 90%）
    - 迁移逻辑正确处理各种配置格式

### 阶段 5：集成测试

- [ ] **任务 5.1：编写端到端测试**
  - 位置：`niuma/__tests__/llm-providers-e2e.test.ts`
  - 描述：编写完整的多提供商场景测试
  - 具体步骤：
    1. 测试多提供商配置加载
    2. 测试显式指定提供商
    3. 测试关键词匹配
    4. 测试网关回退
    5. 测试默认提供商回退
    6. 测试配置迁移
  - 验收标准：
    - 所有端到端场景测试通过
    - 提供商选择逻辑正确

### 阶段 6：文档更新

- [ ] **任务 6.1：更新项目文档**
  - 位置：`AGENTS.md`, `CHANGELOG.md`, `docs/niuma-development-plan.md`
  - 描述：更新项目文档以反映多提供商支持
  - 具体步骤：
    1. 更新 `AGENTS.md`，添加多提供商配置示例
    2. 更新 `CHANGELOG.md`，记录 v0.2.0 变更
    3. 更新 `docs/niuma-development-plan.md`，标记 Phase 4 为已完成
  - 验收标准：
    - 文档清晰说明多提供商配置方法
    - 配置示例正确且可运行
    - 版本历史准确

- [ ] **任务 6.2：创建配置示例**
  - 位置：`niuma/niuma.config.example.json`
  - 描述：创建完整的多提供商配置示例
  - 具体步骤：
    1. 包含所有内置提供商的配置示例
    2. 添加详细的注释说明
    3. 提供常见使用场景的示例
  - 验收标准：
    - 配置示例完整且正确
    - 注释清晰易懂
    - 用户能够根据示例快速配置

### 阶段 7：构建和发布

- [ ] **任务 7.1：运行构建和测试**
  - 描述：确保所有更改通过构建和测试
  - 具体步骤：
    1. 运行 `pnpm type-check`
    2. 运行 `pnpm test`
    3. 运行 `pnpm lint`
    4. 运行 `pnpm build`
  - 验收标准：
    - 类型检查通过
    - 所有测试通过（覆盖率 >= 85%）
    - 代码规范检查通过
    - 构建成功

- [ ] **任务 7.2：更新版本号**
  - 位置：`package.json`
  - 描述：将版本号从 v0.1.4 更新到 v0.2.0
  - 具体步骤：
    1. 更新 `package.json` 中的版本号
  - 验收标准：
    - 版本号正确更新

- [ ] **任务 7.3：创建 Git 提交**
  - 描述：创建清晰的提交记录
  - 具体步骤：
    1. 添加所有更改的文件
    2. 创建提交，使用清晰的提交信息
  - 验收标准：
    - 提交信息遵循 Conventional Commits 规范
    - 所有更改包含在提交中

---

## 验收标准

- [ ] 所有提供商实现 `LLMProvider` 接口
- [ ] 提供商注册表支持两步式注册和智能匹配
- [ ] 配置 Schema 支持多提供商配置
- [ ] 配置迁移逻辑正确处理旧配置格式
- [ ] 所有测试通过（覆盖率 >= 85%）
- [ ] 文档完整且准确
- [ ] 构建成功，无类型错误
- [ ] 向后兼容，现有 OpenAI 配置无需修改

---

## 预计工作量

- **阶段 1：配置 Schema 扩展** - 0.5 天
- **阶段 2：提供商注册表** - 1 天
- **阶段 3：提供商实现** - 2 天
- **阶段 4：配置管理器更新** - 1 天
- **阶段 5：集成测试** - 0.5 天
- **阶段 6：文档更新** - 0.5 天
- **阶段 7：构建和发布** - 0.5 天

**总计：6 天**