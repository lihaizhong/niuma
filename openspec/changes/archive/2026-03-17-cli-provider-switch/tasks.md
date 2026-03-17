## 1. AgentLoop 接口扩展

- [x] 1.1 修改 `AgentLoopOptions` 接口，新增 `providerRegistry` 和 `configManager` 参数
- [x] 1.2 修改 `AgentLoop` 构造函数，接收并存储 registry 和 configManager 引用
- [x] 1.3 将 `provider` 属性从 readonly 改为可变，新增 `setProvider()` 方法

## 2. Provider 切换方法实现

- [x] 2.1 实现 `listProviders()` 方法，返回所有可用 provider 信息
- [x] 2.2 实现 `getCurrentProvider()` 方法，返回当前 provider 信息
- [x] 2.3 实现 `switchProvider(name)` 方法，切换到指定 provider
- [x] 2.4 实现 `switchByModel(modelName)` 方法，根据模型名匹配并切换 provider

## 3. 斜杠命令处理

- [x] 3.1 在 `_handleSlashCommand()` 中添加 `/provider` 命令分支
- [x] 3.2 实现 `/provider` 无参数时列出所有 provider
- [x] 3.3 实现 `/provider <name>` 切换到指定 provider
- [x] 3.4 实现 `/provider current` 显示当前 provider 信息
- [x] 3.5 在 `_handleSlashCommand()` 中添加 `/model` 命令分支
- [x] 3.6 实现 `/model <model-name>` 根据模型名切换 provider
- [x] 3.7 更新 `_getHelpText()` 方法，添加 provider 命令说明

## 4. CLI 入口更新

- [x] 4.1 修改 `niuma/index.ts`，在创建 AgentLoop 时传递 `providerRegistry` 参数
- [x] 4.2 修改 `niuma/index.ts`，在创建 AgentLoop 时传递 `configManager` 参数

## 5. 测试与验证

- [x] 5.1 编写 AgentLoop provider 切换方法的单元测试
- [x] 5.2 编写斜杠命令处理的单元测试
- [x] 5.3 手动测试 `/provider` 命令各项功能
- [x] 5.4 手动测试 `/model` 命令各项功能
- [x] 5.5 运行 `pnpm test` 确保所有测试通过
- [x] 5.6 运行 `pnpm lint` 确保代码风格符合规范
