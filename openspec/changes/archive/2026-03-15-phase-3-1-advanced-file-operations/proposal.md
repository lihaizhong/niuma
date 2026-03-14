## Why

当前文件系统工具仅支持基本的读取、写入、编辑和列表操作，缺乏高级功能如文件搜索、移动、复制、删除等。这些操作对于日常开发和维护工作是必需的，参考 nanobot 工具集，我们需要完善文件系统工具的能力。

## What Changes

在现有 `filesystem-tools` 基础上新增 7 个工具：

- **file_search**: 在文件中搜索内容（支持正则表达式）
- **file_move**: 移动文件到新位置
- **file_copy**: 复制文件到新位置
- **file_delete**: 删除文件（带安全确认）
- **file_info**: 获取文件详细信息（大小、权限、修改时间等）
- **dir_create**: 创建目录（支持递归创建）
- **dir_delete**: 删除目录（支持递归删除）

## Capabilities

### New Capabilities
无（所有新工具都是对现有 filesystem-tools 的扩展）

### Modified Capabilities

- **filesystem-tools**: 扩展现有文件系统工具，新增 7 个高级操作工具

## Impact

- **代码**: `niuma/agent/tools/filesystem.ts` - 需要添加 7 个新工具实现
- **测试**: 需要为新工具添加完整的单元测试
- **工具注册**: 通过 registry 自动注册新工具
- **依赖**: 无新增外部依赖，使用 Node.js 原生 fs 和 path 模块

## Non-goals

- 不会添加文件监控功能
- 不会实现符号链接特殊处理
- 不会添加文件版本控制功能

## Acceptance Criteria

1. 所有 7 个新工具按照 Tool 抽象类实现
2. 每个工具有完整的参数验证和错误处理
3. 每个工具有对应的单元测试（100% 覆盖）
4. 危险操作（delete）有安全确认机制
5. 工具能够正确处理绝对路径和相对路径
6. 所有测试通过