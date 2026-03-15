## Why

Niuma 需要内置加密与解密功能，用于保护敏感数据（API 密钥、数据库密码）、配置文件加密、数据传输加密等场景。Node.js 内置的 crypto 模块提供了强大的加密能力，无需额外依赖，且性能优异，适合高频使用的安全功能。

## What Changes

- 新增 `agent/tools/crypto.ts` 文件，实现加密与解密工具
- 实现 `encrypt` 工具：使用 AES-256-GCM 算法加密数据
- 实现 `decrypt` 工具：解密 AES-256-GCM 加密的数据
- 实现 `hash` 工具：计算 SHA-256/512、MD5 哈希值
- 在工具注册表中注册三个新工具
- 添加完整的单元测试

## Capabilities

### New Capabilities
- `crypto-tools`: 提供数据加密、解密和哈希计算功能

### Modified Capabilities
无

## Impact

- **新增文件**：`niuma/agent/tools/crypto.ts`
- **测试文件**：`niuma/__tests__/crypto-tools.test.ts`
- **工具注册**：需要在工具注册表中注册三个新工具
- **依赖**：使用 Node.js 内置 crypto 模块，无额外依赖
- **API 兼容性**：新增工具，不影响现有 API