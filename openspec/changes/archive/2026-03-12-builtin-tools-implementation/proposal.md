# 提案：内置工具实现

## Why

Agent 需要一套内置工具来执行常见操作，包括文件读写、命令执行、网络请求等。目前虽然已有工具框架（BaseTool、ToolRegistry），但缺少具体的工具实现，导致 Agent 无法执行实际任务。Phase 1 和 Phase 2 已完成工具框架和 Agent 核心，现在是实现内置工具的最佳时机。

## What Changes

实现一套完整的内置工具集，涵盖以下类别：

- **文件系统工具**：read_file、write_file、edit_file、list_dir
- **Shell 工具**：exec（带安全黑名单）
- **Web 工具**：web_search（Brave）、web_fetch
- **消息工具**：message（发送消息）
- **Agent 工具**：spawn（创建子智能体）、cron（定时任务）

## Capabilities

### New Capabilities

- `filesystem-tools`: 提供文件和目录操作能力，支持读取、写入、编辑文件和列出目录内容
- `shell-tool`: 提供安全的 Shell 命令执行能力，包含危险命令黑名单防护
- `web-search-tool`: 提供基于 Brave API 的网页搜索能力
- `web-fetch-tool`: 提供网页内容抓取和处理能力
- `message-tool`: 提供跨渠道发送消息的能力
- `agent-spawn-tool`: 提供创建和管理子智能体的能力
- `cron-tool`: 提供定时任务调度和执行能力

### Modified Capabilities

无。这是纯新增功能，不修改现有规格要求。

## Impact

- **代码影响**：新增 `niuma/agent/tools/` 下的具体工具实现文件
- **API 影响**：通过 ToolRegistry 注册，对外接口不变
- **依赖影响**：需要新增以下依赖：
  - `node-fetch` 或 `axios`（web_fetch）
  - Brave Search API（web_search，可选环境变量）
  - `commander` 或类似库（exec）
- **系统影响**：Shell 工具涉及系统命令执行，需要严格的安全控制
- **测试影响**：每个工具需要独立的单元测试

## 非目标

- 不实现图形界面工具
- 不实现数据库专用工具（已在 Session Manager 中处理）
- 不实现 MCP 协议集成（Phase 7）
- 不实现渠道特定的工具（Phase 5）

## 验收标准

- [ ] 所有工具继承自 BaseTool 并正确注册到 ToolRegistry
- [ ] Shell 工具实现危险命令黑名单防护
- [ ] 文件工具支持绝对路径和相对路径
- [ ] Web 工具支持超时和错误处理
- [ ] 所有工具有完整的 Zod 参数验证
- [ ] 所有工具有单元测试覆盖
- [ ] 工具文档包含示例和安全注意事项