## ADDED Requirements

### Requirement: 加密工具
系统 SHALL 提供数据加密功能，使用 AES-256-GCM 算法加密用户提供的明文数据。

#### Scenario: 成功加密数据
- **WHEN** 用户提供有效的明文数据和密钥
- **THEN** 系统返回加密后的数据（Base64 编码）
- **AND** 系统返回使用的初始化向量 IV（Base64 编码）
- **AND** 系统返回认证标签 tag（Base64 编码）

#### Scenario: 加密时生成随机 IV
- **WHEN** 用户不提供 IV 参数
- **THEN** 系统自动生成随机 IV
- **AND** 每次加密使用不同的 IV

#### Scenario: 使用自定义 IV
- **WHEN** 用户提供自定义 IV
- **THEN** 系统使用用户提供的 IV 进行加密
- **AND** 验证 IV 长度为 16 字节（128 位）

#### Scenario: 密钥格式验证
- **WHEN** 用户提供密钥
- **THEN** 系统验证密钥为有效的 Base64 编码
- **AND** 解码后密钥长度为 32 字节（256 位）

#### Scenario: 加密失败处理
- **WHEN** 加密过程中发生错误
- **THEN** 系统抛出 CryptoError 异常
- **AND** 错误消息明确描述失败原因

### Requirement: 解密工具
系统 SHALL 提供数据解密功能，使用 AES-256-GCM 算法解密加密的数据。

#### Scenario: 成功解密数据
- **WHEN** 用户提供加密数据、密钥、IV 和 tag
- **AND** 所有参数格式正确
- **THEN** 系统返回解密后的明文数据

#### Scenario: 解密验证失败
- **WHEN** 提供的密钥或数据被篡改
- **THEN** 系统检测到认证失败
- **AND** 系统抛出 CryptoError 异常
- **AND** 错误消息指示解密验证失败

#### Scenario: IV 长度验证
- **WHEN** 用户提供长度不正确的 IV
- **THEN** 系统抛出 ValidationError 异常
- **AND** 错误消息指示 IV 长度必须为 16 字节

#### Scenario: Tag 长度验证
- **WHEN** 用户提供长度不正确的 tag
- **THEN** 系统抛出 ValidationError 异常
- **AND** 错误消息指示 tag 长度必须为 16 字节

### Requirement: 哈希工具
系统 SHALL 提供哈希计算功能，支持 SHA-256、SHA-512 和 MD5 算法。

#### Scenario: 计算 SHA-256 哈希
- **WHEN** 用户选择 SHA-256 算法并提供数据
- **THEN** 系统返回 64 位十六进制哈希值

#### Scenario: 计算 SHA-512 哈希
- **WHEN** 用户选择 SHA-512 算法并提供数据
- **THEN** 系统返回 128 位十六进制哈希值

#### Scenario: 计算 MD5 哈希
- **WHEN** 用户选择 MD5 算法并提供数据
- **THEN** 系统返回 32 位十六进制哈希值

#### Scenario: 不支持的算法
- **WHEN** 用户提供不支持的算法名称
- **THEN** 系统抛出 ValidationError 异常
- **AND** 错误消息列出支持的算法

#### Scenario: 空数据哈希
- **WHEN** 用户提供空字符串
- **THEN** 系统成功计算哈希值
- **AND** 返回对应算法的空字符串哈希值

#### Scenario: 大数据哈希
- **WHEN** 用户提供大文件内容（> 10MB）
- **THEN** 系统成功计算哈希值
- **AND** 处理时间在合理范围内（< 1 秒）

### Requirement: 类型安全
系统 SHALL 使用 TypeScript 严格类型定义所有工具的输入和输出。

#### Scenario: 工具输入类型定义
- **WHEN** 定义工具输入参数
- **THEN** 所有参数都有明确的 TypeScript 类型
- **AND** 使用 Zod schema 进行运行时验证

#### Scenario: 工具输出类型定义
- **WHEN** 定义工具返回值
- **THEN** 返回值有明确的 TypeScript 类型
- **AND** 所有字段都是必填的（除非明确标记为可选）

### Requirement: 错误处理
系统 SHALL 提供清晰的错误信息和异常类型。

#### Scenario: 密钥格式错误
- **WHEN** 用户提供无效的 Base64 密钥
- **THEN** 系统抛出 CryptoError 异常
- **AND** 错误消息包含 "密钥格式错误" 描述

#### Scenario: 缺少必需参数
- **WHEN** 用户缺少必需的参数（如 data、key）
- **THEN** 系统抛出 ValidationError 异常
- **AND** 错误消息列出缺少的参数

#### Scenario: 参数类型错误
- **WHEN** 用户提供错误类型的参数（如数字代替字符串）
- **THEN** 系统抛出 ValidationError 异常
- **AND** 错误消息指示期望的类型