## Why

Niuma 智能体需要执行 Git 版本控制操作来管理代码变更、提交历史和分支管理。当前工具集中缺乏 Git 操作能力，限制了智能体在代码仓库管理、版本发布、协作开发等场景下的自动化能力。实现 Git 操作工具将使智能体能够完整地参与软件开发生命周期。

## What Changes

- 新增 6 个 Git 操作工具：git_status、git_commit、git_push、git_pull、git_branch、git_log
- 在 `niuma/agent/tools/` 下创建 `git.ts` 文件实现这些工具
- 为每个工具提供完整的类型定义、参数验证和错误处理
- 添加单元测试确保工具的正确性和安全性

## Capabilities

### New Capabilities
- `git-tools`: Git 版本控制操作工具集，包括状态查看、代码提交、推送拉取、分支管理和日志查询

### Modified Capabilities
- 无

## Impact

- **代码**: 新增 `niuma/agent/tools/git.ts` 文件
- **测试**: 新增 `niuma/agent/tools/__tests__/git.test.ts` 测试文件
- **依赖**: 需要确保系统已安装 Git（通常已预装）
- **API**: 工具注册表新增 6 个 Git 操作工具
- **系统**: 无系统级变更