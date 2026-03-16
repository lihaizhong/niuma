## Why

Archive 工具（压缩与解压）对本地资源消耗大，处理大文件时占用大量 CPU 和内存。这违背了 Niuma 保持核心轻量级的设计理念。根据 MCP 优先架构，这类资源密集型功能应通过 MCP Server 提供，用户可根据需要选择专业化的压缩工具（如支持 GPU 加速的工具）。

## What Changes

- **BREAKING**: 删除 `niuma/agent/tools/archive.ts` 文件
- 删除 `niuma/__tests__/archive-tools.test.ts` 测试文件
- 从工具注册表中移除 `archive` 和 `extract` 工具
- 从 package.json 中移除压缩相关依赖（adm-zip、archiver、tar）
- 更新开发计划，移除 Phase 3.3 的完成状态

## Capabilities

### New Capabilities
无

### Modified Capabilities
- **archive-tools**: 移除压缩与解密功能

## Impact

- **删除文件**：`niuma/agent/tools/archive.ts`、`niuma/__tests__/archive-tools.test.ts`
- **依赖移除**：adm-zip、archiver、tar
- **工具注册**：移除 archive 和 extract 工具的注册
- **API 变更**：archive 和 extract 工具将不再可用
- **迁移建议**：用户可通过 MCP 对接专业的压缩工具