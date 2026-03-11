## 实施任务

## 1. 准备工作

- [x] 1.1 添加 `json5` 依赖到 `package.json`
- [x] 1.2 添加 `@types/json5` 开发依赖到 `package.json`（已移除，json5 自带类型）
- [x] 1.3 运行 `pnpm install` 安装新依赖
- [x] 1.4 验证 `json5` 库正确安装并可用

## 2. 配置 Schema 扩展

- [x] 2.1 在 `niuma/config/schema.ts` 中添加 `AgentDefinition` 接口
- [x] 2.2 在 `niuma/config/schema.ts` 中添加 `MultiRoleConfig` 接口
- [x] 2.3 在 `niuma/config/schema.ts` 中添加 `EnvVarResolverOptions` 接口
- [x] 2.4 扩展 `NiumaConfigSchema` 添加 `agents` 字段和 `list` 数组
- [x] 2.5 创建 `AgentDefinitionSchema` 并使用 Zod 验证
- [x] 2.6 创建 `StrictNiumaConfigSchema` 使用 strict 模式
- [x] 2.7 导出新增的类型和 Schema

## 3. JSON5 配置加载器实现

- [x] 3.1 在 `niuma/config/` 目录下创建 `json5-loader.ts` 文件
- [x] 3.2 实现 `JSON5ConfigLoader` 接口
- [x] 3.3 实现 `load()` 方法，支持 JSON5 和 JSON 格式
- [x] 3.4 实现 `exists()` 方法，检查配置文件是否存在
- [x] 3.5 添加错误处理，提供清晰的错误信息
- [x] 3.6 编写 JSON5 加载器的单元测试

## 4. 环境变量解析实现

- [x] 4.1 在 `niuma/config/` 目录下创建 `env-resolver.ts` 文件
- [x] 4.2 实现 `resolveEnvVars()` 函数，支持递归解析
- [x] 4.3 实现环境变量引用语法匹配（`${VAR}` 和 `${VAR:default}`）
- [x] 4.4 实现从 `.env` 文件加载环境变量
- [x] 4.5 实现环境变量优先级逻辑（`.env` 文件优先）
- [x] 4.6 添加严格模式支持（未知环境变量报错）
- [x] 4.7 编写环境变量解析的单元测试

## 5. 配置合并实现

- [x] 5.1 在 `niuma/config/` 目录下创建 `merger.ts` 文件
- [x] 5.2 实现 `mergeConfigs()` 函数
- [x] 5.3 实现对象字段深度合并逻辑
- [x] 5.4 实现数组字段完全替换逻辑
- [x] 5.5 处理特殊字段（如 `channels`、`cronTasks`）
- [x] 5.6 编写配置合并的单元测试

## 6. ConfigManager 类实现

- [x] 6.1 在 `niuma/config/` 目录下创建 `manager.ts` 文件
- [x] 6.2 实现 `ConfigManager` 类构造函数
- [x] 6.3 实现 `load()` 方法，集成 JSON5 加载和环境变量解析
- [x] 6.4 实现 `getAgentConfig()` 方法，合并全局和角色配置
- [x] 6.5 实现 `getAgentWorkspaceDir()` 方法，计算工作区路径
- [x] 6.6 实现 `getAgentLogPath()` 方法，计算日志文件路径
- [x] 6.7 实现 `getAgentSessionDir()` 方法，计算会话存储路径
- [x] 6.8 实现 `listAgents()` 方法，列出所有角色
- [x] 6.9 实现配置缓存逻辑
- [x] 6.10 添加错误处理和验证逻辑
- [x] 6.11 编写 ConfigManager 的单元测试

## 7. 工作区管理实现

- [x] 7.1 在 `niuma/config/` 目录下创建 `workspace.ts` 文件
- [x] 7.2 实现 `AgentWorkspaceManager` 类
- [x] 7.3 实现 `getWorkspaceDir()` 方法
- [x] 7.4 实现 `getSessionDir()` 方法
- [x] 7.5 实现 `getLogPath()` 方法
- [x] 7.6 实现 `getMemoryPath()` 方法
- [x] 7.7 实现 `getHistoryPath()` 方法
- [x] 7.8 实现 `ensureWorkspace()` 方法，自动创建目录
- [x] 7.9 实现 `ensureSessionDir()` 方法，自动创建目录
- [x] 7.10 编写工作区管理的单元测试

## 8. 更新 loader.ts

- [x] 8.1 修改 `niuma/config/loader.ts` 使用新的 `ConfigManager`
- [x] 8.2 更新 `loadConfig()` 函数支持多角色配置
- [x] 8.3 添加 `agentId` 参数支持
- [x] 8.4 更新 `getWorkspaceDir()` 函数使用 `ConfigManager`
- [x] 8.5 保持向后兼容性（不指定 agentId 时使用默认行为）
- [x] 8.6 更新相关的类型定义
- [x] 8.7 编写集成测试验证 loader 功能

## 9. CLI 命令实现

- [x] 9.1 在 CLI 入口文件中添加 `--agent` 参数支持
- [x] 9.2 实现 `--agent` 参数解析逻辑
- [x] 9.3 添加默认角色选择逻辑
- [x] 9.4 实现 `agents` 命令组
- [x] 9.5 实现 `agents list` 子命令
- [x] 9.6 实现 `agents get --id <id>` 子命令
- [x] 9.7 添加 `--json` 参数支持（格式化输出）
- [x] 9.8 实现命令帮助信息
- [x] 9.9 添加命令错误处理
- [x] 9.10 编写 CLI 命令的集成测试

## 10. 集成和测试

- [x] 10.1 创建示例配置文件 `~/.niuma/niuma.json.example`
- [x] 10.2 创建示例环境变量文件 `~/.niuma/.env.example`
- [x] 10.3 编写端到端测试（多角色配置加载）
- [x] 10.4 编写端到端测试（角色隔离）
- [x] 10.5 编写端到端测试（环境变量解析）
- [x] 10.6 编写端到端测试（CLI 命令）
- [x] 10.7 验证向后兼容性（旧版本配置文件）
- [x] 10.8 运行所有测试确保通过
- [x] 10.9 修复测试中发现的问题

## 11. 文档更新

- [x] 11.1 更新 README.md，添加多角色配置说明
- [x] 11.2 创建配置指南文档（如何配置多角色）
- [x] 11.3 创建 CLI 命令文档（agents 命令用法）
- [x] 11.4 创建迁移指南（从单一配置迁移到多角色配置）
- [x] 11.5 更新 AGENTS.md 项目上下文
- [x] 11.6 添加配置示例和最佳实践

## 12. 代码审查和优化

- [x] 12.1 运行 ESLint 检查代码规范
- [x] 12.2 运行 TypeScript 类型检查
- [x] 12.3 优化性能（配置缓存、懒加载等）
- [x] 12.4 优化错误信息，提高用户体验
- [x] 12.5 代码审查和重构
- [x] 12.6 更新 CHANGELOG.md 记录变更

## 13. 发布准备

- [x] 13.1 更新版本号
- [x] 13.2 构建项目（`pnpm build`）
- [x] 13.3 运行完整测试套件
- [x] 13.4 验证构建产物
- [x] 13.5 准备发布说明