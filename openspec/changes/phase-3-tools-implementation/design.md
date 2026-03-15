## Context

Niuma 项目已经完成了核心基础设施、Agent 核心、多角色配置系统和基础工具（文件系统、Shell、Web、Agent 工具）。当前需要扩展工具能力，添加压缩解压、网络操作和数据处理功能，以提升 Agent 的实用性。

同时，项目中存在代码质量改进需求：
- 文件系统操作使用 Node.js 内置的 `fs` 和 `fs/promises`，API 不一致，需要统一
- import 语句缺乏规范化，影响代码可维护性和可读性
- 部分模块使用 `any` 类型，降低类型安全性，增加运行时风险
- 核心模块（ContextBuilder、ToolRegistry）缺少单元测试覆盖

## Goals / Non-Goals

**Goals:**
- 实现 9 个新工具，覆盖压缩解压、网络操作和数据处理场景
- 使用成熟、维护活跃的 npm 包，确保稳定性和性能
- 遵循现有代码规范和模式，保持代码一致性
- 提供完整的错误处理和安全限制
- 统一文件系统操作 API，提升代码一致性
- 规范化 import 语句，提升代码可维护性
- 消除所有 `any` 类型，提升类型安全性
- 为核心模块添加完整的单元测试覆盖

**Non-Goals:**
- 不实现压缩格式转换（如 zip 转 tar.gz）
- 不实现加密压缩功能
- 不实现高级网络功能（如 WebSocket、FTP）
- 不实现 XML 处理功能
- 不修改工具的核心业务逻辑，仅进行代码质量改进

## Decisions

### 1. 压缩与解压工具

**选择：**
- `archiver` - 用于创建 zip、tar、tar.gz 格式的压缩文件
- `adm-zip` - 用于解压 zip 文件
- `tar` - 用于解压 tar、tar.gz、tar.bz2 格式

**理由：**
- `archiver` 是 Node.js生态中最流行的压缩库，支持流式处理，性能优秀
- `adm-zip` 是纯 JavaScript 实现，无需本地依赖，跨平台兼容性好
- `tar` 是 Node.js 官方推荐的标准库，稳定可靠

**替代方案考虑：**
- `compressing` - 功能更全面，但 API 复杂度较高
- `yauzl` - 性能更好，但只支持 zip 解压

### 2. 网络工具

**选择：**
- `ping` - 用于 ICMP ping 测试
- Node.js 内置 `dns` 模块 - 用于 DNS 查询
- `node-fetch`（已存在） - 用于 HTTP 请求

**理由：**
- `ping` 是专门为 Node.js 设计的 ping 库，支持跨平台
- Node.js 内置 `dns` 模块功能完整，无需额外依赖
- `node-fetch` 已在项目中使用，保持依赖一致性

**替代方案考虑：**
- 系统命令 `ping` - 需要解析不同平台的输出，兼容性问题
- `dns2` - 功能更强大，但内置模块已满足需求

### 3. JSON/YAML 处理工具

**选择：**
- `json5`（已存在） - 用于 JSON 解析和序列化
- `js-yaml` - 用于 YAML 解析和序列化

**理由：**
- `json5` 已在项目中使用，支持 JSON5 格式（注释、尾随逗号）
- `js-yaml` 是最流行的 YAML 库，功能完整，性能优秀

**替代方案考虑：**
- `yaml` - 功能更现代，但 `js-yaml` 生态更成熟
- `fast-json-stringify` - 性能更好，但功能受限

### 4. fs-extra 替换

**选择：**
- `fs-extra` 作为 `fs` 和 `fs/promises` 的统一替代

**理由：**
- `fs-extra` 是 `fs` 的超集，包含所有 Node.js fs 模块方法
- 提供额外实用方法（如 `copy`, `move`, `remove`, `ensureDir`），提升开发效率
- API 一致性更好，减少代码复杂度
- 项目已有使用，无需引入新依赖

**影响范围：**
- 12 个文件：context.ts, memory.ts, skills.ts, agent.ts, filesystem.ts, git.ts, shell.ts, registry.ts, json5-loader.ts, session/manager.ts, 以及相关测试文件

### 5. Import 规范化

**实现：**
- 统一 import 顺序：内置库 → 第三方库 → 本地模块
- 添加分类注释，提升代码可读性

**理由：**
- 提升代码可维护性和可读性
- 便于快速识别依赖来源
- 与项目现有规范保持一致

**影响范围：**
- 所有测试文件（18 个）
- 部分源代码文件

### 6. 类型安全提升

**实现：**
- 消除所有 `any` 类型使用
- 使用 `unknown` 或具体类型替代
- 修复 TypeScript 类型检查错误

**理由：**
- 提升类型安全性，减少运行时错误
- 利用 TypeScript 的类型检查能力
- 改善 IDE 提示和代码补全

**影响范围：**
- 26 处 `any` 类型替换
- 修复 8 处 TypeScript 类型检查错误

### 7. 安全限制

**实现：**
- 文件大小限制：100MB（压缩和解压）
- 命令超时：30 秒（ping、http_request）
- 使用 Zod 进行严格的参数验证
- 防止路径遍历攻击

**理由：**
- 防止资源耗尽攻击
- 防止长时间阻塞 Agent
- 确保输入数据的安全性

## Risks / Trade-offs

### 风险

1. **大文件处理性能** → 使用流式处理（archiver）和大小限制来缓解
2. **跨平台兼容性** → 选择跨平台兼容的 npm 包，测试 macOS 和 Linux
3. **依赖版本冲突** → 使用 pnpm 锁定版本，定期更新
4. **网络超时不可控** → 设置合理的超时时间，提供清晰的错误消息

### 权衡

1. **功能完整性 vs 性能** → 优先选择成熟稳定的库，牺牲部分性能
2. **依赖数量 vs 维护成本** → 选择功能全面的库，减少依赖数量
3. **安全限制 vs 易用性** → 设置合理的安全限制，不影响正常使用

## Migration Plan

### 部署步骤

1. 安装新的 npm 依赖：
   ```bash
   pnpm add archiver adm-zip tar ping js-yaml fs-extra
   pnpm add -D @types/tar @types/js-yaml
   ```

2. 创建 3 个工具模块文件：
   - `niuma/agent/tools/archive.ts`
   - `niuma/agent/tools/network.ts`
   - `niuma/agent/tools/data.ts`

3. 在 `niuma/agent/tools/index.ts` 中导出新工具

4. 编写单元测试，确保所有功能正常工作

5. 运行测试套件，确保没有破坏现有功能

6. 进行代码质量改进：
   - 替换所有 `fs` 和 `fs/promises` 为 `fs-extra`
   - 规范化所有 import 语句
   - 消除所有 `any` 类型

7. 添加核心模块测试：
   - context-builder.test.ts
   - tool-registry.test.ts

8. 运行类型检查和测试，确保所有修改正确

### 回滚策略

- 如果新工具出现问题，可以简单地从工具注册表中移除
- 如果 fs-extra 替换出现问题，可以回退到原始的 fs 用法
- 如果类型检查失败，可以逐个修复
- 不涉及数据迁移或 API 变更，回滚成本低

## Open Questions

无