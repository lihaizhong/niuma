## Why

Niuma 当前缺乏环境变量和进程管理的基础工具，无法支持系统级操作和自动化运维场景。这些工具是系统监控、环境配置和进程控制的基础功能，对于企业级应用至关重要。

## What Changes

新增 4 个系统工具：
- **env_get**: 获取环境变量
- **env_set**: 设置环境变量（仅当前进程）
- **process_list**: 列出系统进程
- **process_kill**: 终止指定进程

## Capabilities

### New Capabilities
- `environment-variables`: 环境变量读取和设置功能
- `process-management`: 进程列表查询和终止功能

### Modified Capabilities
无现有 spec 需要修改。

## Impact

**新增依赖：**
- `ps-tree`: 进程树遍历库
- `@types/ps-tree`: TypeScript 类型定义

**影响范围：**
- 新增文件：`niuma/agent/tools/system.ts`
- 修改文件：`niuma/agent/tools/registry.ts`（注册新工具）
- 新增测试：`niuma/__tests__/system-tools.test.ts`

**向后兼容性：** 完全兼容，无破坏性变更