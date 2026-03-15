## 1. 环境准备

- [x] 1.1 安装压缩相关依赖：archiver、adm-zip、tar
- [x] 1.2 安装网络相关依赖：ping
- [x] 1.3 安装数据处理相关依赖：js-yaml
- [x] 1.4 安装类型定义依赖：@types/tar、@types/js-yaml
- [x] 1.5 安装 fs-extra 依赖（用于统一文件系统操作）

## 2. 实现压缩与解压工具

- [x] 2.1 创建 archive.ts 文件，导入必要的依赖和类型
- [x] 2.2 实现 ArchiveTool 工具类，支持 zip、tar、tar.gz 格式
- [x] 2.3 为 ArchiveTool 添加 Zod 参数验证
- [x] 2.4 为 ArchiveTool 添加错误处理和安全限制（100MB 大小限制）
- [x] 2.5 实现 ExtractTool 工具类，支持 zip、tar、tar.gz、tar.bz2 格式
- [x] 2.6 为 ExtractTool 添加 Zod 参数验证
- [x] 2.7 为 ExtractTool 添加错误处理和安全限制（100MB 大小限制）
- [x] 2.8 导出 ArchiveTool 和 ExtractTool 类

## 3. 实现网络工具

- [x] 3.1 创建 network.ts 文件，导入必要的依赖和类型
- [x] 3.2 实现 PingTool 工具类，支持 ICMP ping 测试
- [x] 3.3 为 PingTool 添加 Zod 参数验证（host、count）
- [x] 3.4 为 PingTool 添加错误处理和超时限制（5 秒）
- [x] 3.5 实现 DnsLookupTool 工具类，支持 A、AAAA、MX、TXT 记录查询
- [x] 3.6 为 DnsLookupTool 添加 Zod 参数验证（hostname、recordType）
- [x] 3.7 为 DnsLookupTool 添加错误处理
- [x] 3.8 实现 HttpRequestTool 工具类，支持 GET、POST、PUT、DELETE 方法
- [x] 3.9 为 HttpRequestTool 添加 Zod 参数验证（url、method、headers、body）
- [x] 3.10 为 HttpRequestTool 添加错误处理和超时限制
- [x] 3.11 导出 PingTool、DnsLookupTool 和 HttpRequestTool 类

## 4. 实现 JSON/YAML 处理工具

- [x] 4.1 创建 data.ts 文件，导入必要的依赖和 类型
- [x] 4.2 实现 JsonParseTool 工具类，支持 JSON 和 JSON5 格式
- [x] 4.3 为 JsonParseTool 添加 Zod 参数验证（data）
- [x] 4.4 为 JsonParseTool 添加错误处理（空字符串、无效 JSON）
- [x] 4.5 实现 JsonStringifyTool 工具类
- [x] 4.6 为 JsonStringifyTool 添加 Zod 参数验证（data、indent）
- [x] 4.7 为 JsonStringifyTool 添加错误处理（循环引用）
- [x] 4.8 实现 YamlParseTool 工具类
- [x] 4.9 为 YamlParseTool 添加 Zod 参数验证（data）
- [x] 4.10 为 YamlParseTool 添加错误处理（空字符串、无效 YAML）
- [x] 4.11 实现 YamlStringifyTool 工具类
- [x] 4.12 为 YamlStringifyTool 添加 Zod 参数验证（data、indent）
- [x] 4.13 为 YamlStringifyTool 添加错误处理（循环引用、特殊值）
- [x] 4.14 导出 JsonParseTool、JsonStringifyTool、YamlParseTool 和 YamlStringifyTool 类

## 5. 工具注册

- [x] 5.1 在 niuma/agent/tools/index.ts 中导入所有新工具类
- [x] 5.2 更新工具注册表，添加所有新工具

## 6. fs 替换

- [x] 6.1 替换 context.ts 中的 fs/promises 为 fs-extra
- [x] 6.2 替换 memory.ts 中的 fs/promises 为 fs-extra
- [x] 6.3 替换 skills.ts 中的 fs/promises 为 fs-extra
- [x] 6.4 替换 agent.ts 中的 fs/promises 为 fs-extra
- [x] 6.5 替换 filesystem.ts 中的 fs/promises 为 fs-extra
- [x] 6.6 替换 git.ts 中的 fs 和 fs/promises 为 fs-extra
- [x] 6.7 替换 shell.ts 中的 child_process 和 util 为 fs-extra（移除未使用的 util）
- [x] 6.8 替换 registry.ts 中的 path 模块分类（内置库）
- [x] 6.9 替换 json5-loader.ts 中的 fs 为 fs-extra
- [x] 6.10 替换 session/manager.ts 中的 fs 为 fs-extra
- [x] 6.11 替换所有相关测试文件中的 fs 为 fs-extra

## 7. Import 语句规范化

- [x] 7.1 规范化 tools-acceptance.test.ts 的 import 顺序
- [x] 7.2 规范化 json5-loader.test.ts 的 import 顺序
- [x] 7.3 规范化 config-manager.test.ts 的 import 顺序
- [x] 7.4 规范化 git-tools.test.ts 的 import 顺序
- [x] 7.5 规范化 shell-tool.test.ts 的 import 顺序
- [x] 7.6 规范化 agent-tools.test.ts 的 import 顺序
- [x] 7.7 规范化 filesystem-tools.test.ts 的 import 顺序
- [x] 7.8 规范化 web-tools.test.ts 的 import 顺序
- [x] 7.9 规范化 agent-tools.test.ts、message-tool.test.ts、merger.test.ts、types.test.ts、utils.test.ts、env-resolver.test.ts 的 import 顺序
- [x] 7.10 规范化 archive-tools.test.ts、data-tools.test.ts、network-tools.test.ts 的 import 顺序

## 8. 类型安全提升

- [x] 8.1 消除 archive.ts 中的 any 类型（tar 模块导入）
- [x] 8.2 消除 data.ts 中的 any 类型（循环引用测试）
- [x] 8.3 消除 agent.ts 中的 any 类型（全局任务列表）
- [x] 8.4 消除 message-tool.test.ts 中的 any 类型（全局消息历史）
- [x] 8.5 消除 merger.test.ts 中的 any 类型（AgentDefinition 和配置对象）
- [x] 8.6 消除 web-tools.test.ts 中的 any 类型（mockResponse）
- [x] 8.7 消除 utils.test.ts 中的 any 类型（对象属性访问）
- [x] 8.8 修复 context-builder.test.ts 中的 TypeScript 类型错误
- [x] 8.9 修复 web-tools.test.ts 中的 Response 类型错误

## 9. 测试覆盖提升

- [x] 9.1 创建 archive-tools.test.ts，包含 10 个测试用例
- [x] 9.2 创建 data-tools.test.ts，包含 21 个测试用例
- [x] 9.3 创建 network-tools.test.ts，包含 16 个测试用例
- [x] 9.4 创建 context-builder.test.ts，包含 30 个测试用例
- [x] 9.5 创建 tool-registry.test.ts，包含 15 个测试用例
- [x] 9.6 为 utils.test.ts 添加 sanitize 功能的 21 个测试用例
- [x] 9.7 修复所有测试文件的 import 顺序问题
- [x] 9.8 测试总数从 252 增加到 318

## 10. 测试与验证

- [x] 10.1 运行类型检查：pnpm type-check
- [x] 10.2 运行代码检查：pnpm lint
- [x] 10.3 运行单元测试：pnpm test
- [x] 10.4 验证所有测试通过（318/318）
- [x] 10.5 验证类型检查通过
- [x] 10.6 手动测试所有新工具的基本功能
- [x] 10.7 验证所有工具的错误处理和安全限制
- [x] 10.8 更新 OpenSpec 文档，反映所有改动

## 11. 额外代码质量改进

- [x] 11.1 消除 merger.ts 中的 any 类型（导入 AgentConfig、ProviderConfig 类型）
- [x] 11.2 修复 merger.ts 中的泛型类型问题（使用 Record<string, unknown>）
- [x] 11.3 安装 deepmerge@4.3.1 库替代自定义 deepMerge 实现
- [x] 11.4 移除 merger.ts 中的 33 行自定义深度合并代码
- [x] 11.5 规范化配置模块的 import 语句（json5-loader、loader、manager、merger）
- [x] 11.6 规范化会话模块的 import 语句（session/manager）
- [x] 11.7 规范化事件总线的 import 语句（bus/events）
- [x] 11.8 规范化 Agent 模块的 import 语句（context、loop、skills、memory、subagent）
- [x] 11.9 规范化 Provider 模块的 import 语句（providers/openai）
- [x] 11.10 规范化工具模块的 import 语句（agent/tools/base）
- [x] 11.11 规范化测试文件的 import 语句（data-tools、env-resolver、merger、message-tool、network-tools、types、tool-registry、utils、web-tools）
- [x] 11.12 验证所有修改后的文件类型检查通过
- [x] 11.13 验证所有修改后的文件测试通过（318/318）