# web-fetch-tool Specification

## Purpose
TBD - created by archiving change builtin-tools-implementation. Update Purpose after archive.
## Requirements
### Requirement: web_fetch 工具抓取网页内容

系统 SHALL 提供 web_fetch 工具，能够获取和处理网页内容。

#### Scenario: 获取网页 HTML
- **WHEN** Agent 调用 web_fetch 并提供 URL
- **THEN** 系统发送 HTTP 请求
- **AND** 返回网页 HTML 内容
- **AND** 包含响应元数据

#### Scenario: 处理重定向
- **WHEN** URL 重定向到其他地址
- **THEN** 系统自动跟随重定向
- **AND** 返回最终 URL 的内容
- **AND** 记录重定向链

#### Scenario: 处理 HTTPS
- **WHEN** URL 使用 HTTPS 协议
- **THEN** 系统验证 SSL 证书
- **AND** 使用安全连接
- **AND** 返回内容

#### Scenario: 请求失败
- **WHEN** 网络请求失败（超时、连接错误等）
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息包含失败原因

#### Scenario: 无效 URL
- **WHEN** Agent 提供无效的 URL
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息说明 URL 格式错误

### Requirement: 请求超时控制

系统 SHALL 支持请求超时控制。

#### Scenario: 默认超时
- **WHEN** Agent 未指定超时时间
- **THEN** 系统使用默认超时（30 秒）
- **AND** 超时后终止请求

#### Scenario: 自定义超时
- **WHEN** Agent 提供超时参数
- **THEN** 系统使用指定的超时时间
- **AND** 超时后终止请求

#### Scenario: 超时处理
- **WHEN** 请求超时
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息标记为超时错误

### Requirement: 请求方法支持

系统 SHALL 支持多种 HTTP 请求方法。

#### Scenario: GET 请求
- **WHEN** Agent 使用 GET 方法（默认）
- **THEN** 系统发送 GET 请求
- **AND** 返回响应内容

#### Scenario: POST 请求
- **WHEN** Agent 使用 POST 方法
- **THEN** 系统发送 POST 请求
- **AND** 发送请求体
- **AND** 返回响应内容

#### Scenario: 自定义请求头
- **WHEN** Agent 提供自定义请求头
- **THEN** 系统添加自定义请求头
- **AND** 发送请求
- **AND** 返回响应内容

### Requirement: 响应处理

系统 SHALL 正确处理 HTTP 响应。

#### Scenario: 成功响应
- **WHEN** 服务器返回 2xx 状态码
- **THEN** 系统返回响应内容
- **AND** 包含状态码和响应头

#### Scenario: 错误响应
- **WHEN** 服务器返回 4xx 或 5xx 状态码
- **THEN** 系统返回错误信息
- **AND** 包含状态码和错误消息
- **AND** 不抛出异常（除非设置了严格模式）

#### Scenario: JSON 响应
- **WHEN** 响应内容是 JSON 格式
- **THEN** 系统解析 JSON
- **AND** 返回解析后的对象
- **AND** 如果解析失败返回原始字符串

#### Scenario: 内容类型处理
- **WHEN** 响应指定内容类型
- **THEN** 系统根据内容类型处理响应
- **AND** 支持文本、JSON、HTML 等类型

### Requirement: HTML 内容提取

系统 SHALL 能够从 HTML 中提取主要内容。

#### Scenario: 提取纯文本
- **WHEN** Agent 请求提取文本
- **THEN** 系统移除 HTML 标签
- **AND** 返回纯文本内容
- **AND** 保留基本结构

#### Scenario: 提取链接
- **WHEN** Agent 请求提取链接
- **THEN** 系统提取所有 `<a>` 标签
- **AND** 返回链接列表
- **AND** 包含链接文本和 URL

#### Scenario: 提取图片
- **WHEN** Agent 请求提取图片
- **THEN** 系统提取所有 `<img>` 标签
- **AND** 返回图片 URL 列表
- **AND** 包含 alt 文本

#### Scenario: 提取元数据
- **WHEN** Agent 请求提取元数据
- **THEN** 系统提取 meta 标签
- **AND** 返回标题、描述、关键词等
- **AND** 包含 Open Graph 数据

