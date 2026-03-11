# Web Search 工具规格

## ADDED Requirements

### Requirement: web_search 工具执行网页搜索

系统 SHALL 提供 web_search 工具，能够使用搜索引擎查找信息。

#### Scenario: 基本搜索
- **WHEN** Agent 调用 web_search 并提供查询词
- **THEN** 系统调用搜索引擎 API
- **AND** 返回搜索结果列表
- **AND** 每个结果包含标题、链接和摘要

#### Scenario: 限制结果数量
- **WHEN** Agent 提供 num 参数
- **THEN** 系统返回指定数量的结果
- **AND** 不超过请求的数量

#### Scenario: 搜索结果排序
- **WHEN** 搜索成功
- **THEN** 结果按相关性排序
- **AND** 最相关的结果在前面

#### Scenario: 空查询
- **WHEN** Agent 提供空查询
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息说明查询不能为空

#### Scenario: 搜索失败
- **WHEN** 搜索引擎 API 调用失败
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息包含失败原因

### Requirement: Brave Search API 集成

系统 SHALL 默认使用 Brave Search API 进行搜索。

#### Scenario: 使用 Brave API
- **WHEN** 未配置其他搜索引擎
- **THEN** 系统使用 Brave Search API
- **AND** 提供搜索结果

#### Scenario: API 密钥配置
- **WHEN** 环境变量包含 BRAVE_API_KEY
- **THEN** 系统使用该密钥调用 API
- **AND** 验证密钥有效性

#### Scenario: 缺少 API 密钥
- **WHEN** 未配置 BRAVE_API_KEY
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息说明需要配置 API 密钥

### Requirement: 搜索结果处理

系统 SHALL 正确处理和格式化搜索结果。

#### Scenario: 结果包含所有必要信息
- **WHEN** 搜索成功
- **THEN** 每个结果包含标题、URL、片段和日期
- **AND** 信息格式清晰易读

#### Scenario: 过滤低质量结果
- **WHEN** 搜索返回结果
- **THEN** 系统过滤明显的垃圾结果
- **AND** 优先返回权威来源

#### Scenario: 处理特殊字符
- **WHEN** 查询包含特殊字符或空格
- **THEN** 系统正确编码查询
- **AND** 返回准确结果

### Requirement: 多搜索引擎支持

系统 SHALL 支持配置多个搜索引擎。

#### Scenario: 配置搜索引擎
- **WHEN** 配置文件定义多个搜索引擎
- **THEN** 系统加载所有配置
- **AND** 可以指定使用哪个搜索引擎

#### Scenario: 搜索引擎切换
- **WHEN** Agent 提供搜索引擎参数
- **THEN** 系统使用指定的搜索引擎
- **AND** 返回该引擎的结果

#### Scenario: 默认搜索引擎
- **WHEN** Agent 未指定搜索引擎
- **THEN** 系统使用默认搜索引擎（Brave）
- **AND** 返回结果

### Requirement: 搜索历史记录

系统 SHALL 记录搜索查询和结果。

#### Scenario: 记录搜索
- **WHEN** 执行搜索
- **THEN** 系统记录查询词
- **AND** 记录搜索时间
- **AND** 记录结果数量
- **AND** 记录使用的搜索引擎

#### Scenario: 搜索缓存
- **WHEN** 最近搜索过相同的查询
- **THEN** 系统返回缓存的结果
- **AND** 减少重复 API 调用
- **AND** 注明数据来自缓存

#### Scenario: 缓存过期
- **WHEN** 缓存超过指定时间（如 1 小时）
- **THEN** 系统执行新的搜索
- **AND** 更新缓存

## TypeScript Interface Definitions

```typescript
/**
 * Web Search 工具参数
 */
interface WebSearchParams {
  /** 搜索查询 */
  query: string;
  /** 结果数量 */
  num?: number;
  /** 搜索引擎名称 */
  engine?: 'brave' | 'google' | 'bing';
  /** 语言代码 */
  lang?: string;
  /** 地区代码 */
  country?: string;
  /** 是否忽略缓存 */
  ignoreCache?: boolean;
}

/**
 * Web Search 工具返回值
 */
interface WebSearchResult {
  /** 搜索结果列表 */
  results: SearchResult[];
  /** 总结果数 */
  totalResults?: number;
  /** 使用的搜索引擎 */
  engine: string;
  /** 查询词 */
  query: string;
  /** 是否来自缓存 */
  fromCache?: boolean;
}

/**
 * 单个搜索结果
 */
interface SearchResult {
  /** 标题 */
  title: string;
  /** URL */
  url: string;
  /** 摘要片段 */
  snippet: string;
  /** 发布日期 */
  date?: string;
  /** 来源网站 */
  source?: string;
  /** 相关性分数 */
  relevance?: number;
}

/**
 * 搜索引擎接口
 */
interface SearchProvider {
  /** 提供商名称 */
  name: string;
  /** 执行搜索 */
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  /** 是否需要 API 密钥 */
  requiresApiKey: boolean;
  /** 验证 API 密钥 */
  validateApiKey(key: string): Promise<boolean>;
}

/**
 * 搜索选项
 */
interface SearchOptions {
  /** 结果数量 */
  num?: number;
  /** 语言 */
  lang?: string;
  /** 地区 */
  country?: string;
}

/**
 * 搜索日志记录
 */
interface SearchLog {
  /** 查询词 */
  query: string;
  /** 执行时间 */
  timestamp: Date;
  /** 使用的搜索引擎 */
  engine: string;
  /** 结果数量 */
  resultCount: number;
  /** Agent ID */
  agentId: string;
  /** 执行时长（毫秒） */
  duration: number;
}
```

## Dependencies

- `niuma/agent/tools/base.ts` - BaseTool 基类
- `niuma/types/error.ts` - ToolExecutionError
- `niuma/types/tool.ts` - Tool 定义
- 原生 `fetch` API（Node.js 18+）

## Environment Variables

- `BRAVE_API_KEY` - Brave Search API 密钥（可选，需要时配置）