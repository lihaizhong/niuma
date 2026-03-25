# 搜索引擎配置指南

DeepAgent 支持多种搜索引擎进行网络搜索。

## 支持的搜索引擎

| 引擎 | API Key 环境变量 | 免费额度 | 特点 |
|------|-----------------|----------|------|
| **Brave** | `BRAVE_API_KEY` | 免费层可用 | 隐私优先，结果干净 |
| **Google** | `GOOGLE_API_KEY` | 需付费 | 结果全面，自定义搜索 |
| **Bing** | `BING_API_KEY` | 免费层可用 | 微软生态集成 |

## 配置方法

### Brave Search

1. 访问 [Brave Search API](https://brave.com/search/api/)
2. 注册并获取 API Key
3. 设置环境变量：
   ```bash
   export BRAVE_API_KEY="your-api-key"
   ```

4. 在配置中使用：
   ```json
   {
     "search": {
       "engine": "brave",
       "apiKey": "${BRAVE_API_KEY}"
     }
   }
   ```

### Google Custom Search

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 启用 Custom Search API
3. 创建 API Key
4. 设置环境变量：
   ```bash
   export GOOGLE_API_KEY="your-api-key"
   export GOOGLE_CX="your-custom-search-id"
   ```

### Bing Search

1. 访问 [Azure Portal](https://portal.azure.com/)
2. 创建 Bing Search v7 资源
3. 获取 API Key
4. 设置环境变量：
   ```bash
   export BING_API_KEY="your-api-key"
   ```

## 使用示例

```typescript
import { webSearchTool } from "niuma/tools";

const result = await webSearchTool.execute({
  query: "TypeScript best practices",
  engine: "brave"  // 或 "google", "bing"
});
```

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| API Key 无效 | 检查环境变量是否正确设置 |
| 配额超限 | 升级套餐或切换搜索引擎 |
| 搜索结果为空 | 检查网络连接和 API 状态 |

## 默认配置

未指定搜索引擎时，系统按以下优先级选择：
1. Brave (如果配置了 BRAVE_API_KEY)
2. Bing (如果配置了 BING_API_KEY)
3. Google (如果配置了 GOOGLE_API_KEY)
