## ADDED Requirements

### Requirement: 按渠道查询会话
SessionManager 系统必须支持从文件系统加载指定渠道的所有会话。

#### Scenario: 成功查询指定渠道的会话
- **WHEN** 调用 `getSessionsByChannel(channel)` 方法
- **THEN** 系统扫描 `~/.niuma/sessions/` 目录中的所有会话文件
- **THEN** 系统解析每个文件的 SessionKey 提取 channel 信息
- **THEN** 系统过滤出指定 channel 的会话
- **THEN** 系统返回会话列表

#### Scenario: 渠道不存在
- **WHEN** 查询不存在的渠道
- **THEN** 系统返回空数组

#### Scenario: 文件系统查询缓存
- **WHEN** 首次查询指定渠道
- **THEN** 系统扫描文件系统并缓存结果
- **WHEN** 再次查询相同渠道
- **THEN** 系统从缓存返回结果，不重复扫描文件系统

### Requirement: 按用户查询会话
SessionManager 系统必须支持从文件系统加载指定用户的所有会话。

#### Scenario: 成功查询指定用户的会话
- **WHEN** 调用 `getSessionsByUser(userId)` 方法
- **THEN** 系统扫描 `~/.niuma/sessions/` 目录中的所有会话文件
- **THEN** 系统解析每个文件的 SessionKey 提取 userId 信息
- **THEN** 系统过滤出指定 userId 的会话
- **THEN** 系统返回会话列表

#### Scenario: 用户不存在
- **WHEN** 查询不存在的用户
- **THEN** 系统返回空数组

#### Scenario: 用户跨多个渠道的会话
- **WHEN** 用户在多个渠道有会话
- **THEN** 系统返回所有渠道的会话

### Requirement: 会话统计
SessionManager 系统必须支持统计文件系统中的会话信息。

#### Scenario: 统计总会话数
- **WHEN** 调用 `getSessionStats()` 方法
- **THEN** 系统扫描 `~/.niuma/sessions/` 目录中的所有会话文件
- **THEN** 系统返回总会话数

#### Scenario: 统计各渠道的会话数
- **WHEN** 调用 `getSessionStats()` 方法
- **THEN** 系统按 channel 分组统计会话数
- **THEN** 系统返回各渠道的会话数统计

#### Scenario: 统计活跃会话数
- **WHEN** 调用 `getSessionStats()` 方法
- **THEN** 系统统计 24 小时内有活动的会话数
- **THEN** 系统返回活跃会话数

#### Scenario: 返回完整统计信息
- **WHEN** 调用 `getSessionStats()` 方法
- **THEN** 系统返回包含总会话数、各渠道会话数、活跃会话数的统计对象

### Requirement: 文件系统缓存策略
SessionManager 系统必须使用缓存策略优化文件系统查询性能。

#### Scenario: LRU 缓存淘汰
- **WHEN** 缓存达到最大容量
- **THEN** 系统淘汰最久未使用的缓存条目

#### Scenario: 缓存失效
- **WHEN** 会话文件被修改或删除
- **THEN** 系统使相关缓存失效

#### Scenario: 异步扫描
- **WHEN** 执行文件系统扫描
- **THEN** 系统使用异步方式扫描，不阻塞主线程