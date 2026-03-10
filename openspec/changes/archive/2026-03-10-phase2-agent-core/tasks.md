## 1. 类型扩展

- [x] 1.1 扩展 `types/llm.ts`，添加 `reasoningContent` 到 `ChatMessage` 接口
- [x] 1.2 添加 `ProviderConfig` 类型定义
- [x] 1.3 确保类型导出正确

## 2. 上下文构建器 (agent/context.ts)

- [x] 2.1 实现 `ContextBuilder` 类基础结构
- [x] 2.2 实现 `_getIdentity()` 方法，生成核心身份信息
- [x] 2.3 实现 `_loadBootstrapFiles()` 方法，加载 AGENTS.md 等引导文件
- [x] 2.4 实现 `_buildRuntimeContext()` 静态方法，生成运行时上下文（时间、渠道）
- [x] 2.5 实现 `buildSystemPrompt()` 方法，组装完整 System Prompt
- [x] 2.6 实现 `_buildUserContent()` 方法，处理媒体内容（图片 base64 编码）
- [x] 2.7 实现 `buildMessages()` 方法，组装消息列表
- [x] 2.8 实现 `addAssistantMessage()` 方法，添加含工具调用的助手消息
- [x] 2.9 实现 `addToolResult()` 方法，添加工具结果消息
- [x] 2.10 编写单元测试

## 3. 技能系统 (agent/skills.ts)

- [x] 3.1 实现 `SkillsLoader` 类基础结构
- [x] 3.2 实现 `listSkills()` 方法，发现工作区和内置技能
- [x] 3.3 实现 `_checkRequirements()` 方法，检查依赖（CLI 工具、环境变量）
- [x] 3.4 实现 `loadSkill()` 方法，加载技能内容
- [x] 3.5 实现 `_stripFrontmatter()` 方法，去除 YAML frontmatter
- [x] 3.6 实现 `getSkillMetadata()` 方法，解析元数据
- [x] 3.7 实现 `_parseNanobotMetadata()` 方法，解析 nanobot 特定元数据
- [x] 3.8 实现 `buildSkillsSummary()` 方法，生成 XML 格式摘要
- [x] 3.9 实现 `getAlwaysSkills()` 方法，获取 always=true 技能
- [x] 3.10 实现 `loadSkillsForContext()` 方法，加载指定技能内容
- [x] 3.11 编写单元测试

## 4. 记忆系统 (agent/memory.ts)

- [x] 4.1 实现 `MemoryStore` 类基础结构
- [x] 4.2 实现 `readLongTerm()` 和 `writeLongTerm()` 方法
- [x] 4.3 实现 `appendHistory()` 方法
- [x] 4.4 实现 `getMemoryContext()` 方法
- [x] 4.5 定义 `save_memory` 工具 Schema
- [x] 4.6 实现 `consolidate()` 方法，LLM 驱动的记忆整合
- [x] 4.7 处理整合结果（写入 MEMORY.md 和 HISTORY.md）
- [x] 4.8 实现增量整合和全量归档两种模式
- [x] 4.9 编写单元测试

## 5. 会话管理 (session/manager.ts)

- [x] 5.1 定义 `Session` 和 `SessionMessage` 接口
- [x] 5.2 实现 `SessionManager` 类基础结构
- [x] 5.3 实现 `getOrCreate()` 方法，创建或加载会话
- [x] 5.4 实现文件持久化（保存到 `sessions/`）
- [x] 5.5 实现 `save()` 方法
- [x] 5.6 实现 `getHistory()` 方法，转换为 ChatMessage 格式
- [x] 5.7 实现 `addMessage()` 方法
- [x] 5.8 实现 `clear()` 方法
- [x] 5.9 实现 `invalidate()` 方法，清理内存缓存
- [x] 5.10 编写单元测试

## 6. LLM 提供商抽象 (providers/base.ts)

- [x] 6.1 定义 `LLMProvider` 接口
- [x] 6.2 定义 `ChatOptions` 接口
- [x] 6.3 扩展 `LLMResponse` 接口（添加 reasoningContent）
- [x] 6.4 定义 `LLMStreamChunk` 接口
- [x] 6.5 编写接口文档注释

## 7. OpenAI 提供商实现 (providers/openai.ts)

- [x] 7.1 安装 `@langchain/openai` 依赖
- [x] 7.2 实现 `OpenAIProvider` 类
- [x] 7.3 实现构造函数，处理配置（apiKey, apiBase, model）
- [x] 7.4 实现 `chat()` 方法，调用 LangChain ChatOpenAI
- [x] 7.5 实现工具调用解析（LangChain tool_calls → ToolCall[]）
- [x] 7.6 实现 `chatStream()` 方法，流式响应
- [x] 7.7 实现 `getDefaultModel()` 方法
- [x] 7.8 处理 API 错误（限流、无效请求等）
- [x] 7.9 编写单元测试（使用 mock）

## 8. Agent 循环 (agent/loop.ts)

- [x] 8.1 定义 `AgentLoopOptions` 和 `AgentLoop` 接口
- [x] 8.2 实现 `AgentLoop` 类基础结构
- [x] 8.3 实现构造函数，初始化依赖（ContextBuilder, MemoryStore, SkillsLoader 等）
- [x] 8.4 实现 `_registerDefaultTools()` 方法，注册内置工具
- [x] 8.5 实现 `_runAgentLoop()` 方法，核心迭代逻辑
- [x] 8.6 实现工具执行和结果处理
- [x] 8.7 实现迭代次数控制
- [x] 8.8 实现 `run()` 方法，主循环（监听消息总线）
- [x] 8.9 实现 `stop()` 方法
- [x] 8.10 实现 `_processMessage()` 方法，处理单条消息
- [x] 8.11 实现斜杠命令处理（/new, /help）
- [x] 8.12 实现记忆整合触发（异步）
- [x] 8.13 实现 `processDirect()` 方法
- [x] 8.14 实现进度通知回调
- [x] 8.15 实现 LLM 调用失败重试（指数退避）
- [x] 8.16 编写集成测试

## 9. 子智能体管理 (agent/subagent.ts)

- [x] 9.1 实现 `SubagentManager` 类基础结构
- [x] 9.2 实现 `spawn()` 方法，创建后台任务
- [x] 9.3 实现 `_runSubagent()` 方法，执行子智能体循环
- [x] 9.4 实现工具隔离（禁用 message, spawn）
- [x] 9.5 实现 `_buildSubagentPrompt()` 方法
- [x] 9.6 实现 `_announceResult()` 方法，通知主 Agent
- [x] 9.7 实现 `cancelBySession()` 方法
- [x] 9.8 实现 `getRunningCount()` 方法
- [x] 9.9 实现任务自动清理
- [x] 9.10 编写单元测试

## 10. 配置扩展

- [x] 10.1 扩展 `config/schema.ts`，添加 Agent 配置项
- [x] 10.2 添加 `progressMode`, `showReasoning`, `showToolDuration` 配置
- [x] 10.3 添加 LLM 重试配置

## 11. 集成与测试

- [ ] 11.1 编写端到端测试：完整对话流程
- [ ] 11.2 编写集成测试：记忆整合流程
- [ ] 11.3 编写集成测试：技能加载流程
- [ ] 11.4 编写集成测试：子智能体执行流程
- [ ] 11.5 编写集成测试：LLM 调用失败重试
- [ ] 11.6 验证所有 Acceptance Criteria
