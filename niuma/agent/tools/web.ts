/**
 * Web 工具
 * 提供 Web 搜索和网页内容抓取功能
 */

// ==================== 第三方库 ====================
import pino from "pino";
import * as cheerio from "cheerio";
import RE2 from "re2";
import { z } from "zod";

// ==================== 本地模块 ====================
import { BaseTool } from "./base";
import { ToolExecutionError } from "../../types/error";

// ==================== 常量定义 ====================
const logger = pino({ level: "info" });
const CACHE_TTL = 60 * 60 * 1000; // 1 小时
const searchCache: Map<string, SearchCacheEntry> = new Map();

// ==================== 类型定义 ====================

/**
 * 搜索结果
 */
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  date?: string;
}

/**
 * 搜索缓存条目
 */
interface SearchCacheEntry {
  query: string;
  engine: string;
  results: SearchResult[];
  timestamp: number;
}

/**
 * Brave API 响应格式
 */
interface BraveSearchResponse {
  web?: {
    results?: BraveSearchResult[];
  };
}

/**
 * Brave 搜索结果格式
 */
interface BraveSearchResult {
  title?: string;
  url?: string;
  description?: string;
  age?: string;
}

/**
 * 搜索引擎接口
 */
interface SearchProvider {
  name: string;
  search(query: string, options: { num: number }): Promise<SearchResult[]>;
  requiresApiKey: boolean;
  validateApiKey?(key: string): Promise<boolean>;
}

// ==================== 工具函数 ====================

/**
 * 清理过期缓存
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of searchCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      searchCache.delete(key);
    }
  }
}

/**
 * 获取缓存键
 */
function getCacheKey(query: string, engine: string): string {
  return `${engine}:${query.toLowerCase().trim()}`;
}

// ==================== 类定义 ====================

/**
 * Brave Search 提供商
 */
class BraveSearchProvider implements SearchProvider {
  name = "brave";
  requiresApiKey = true;

  async search(
    query: string,
    options: { num: number },
  ): Promise<SearchResult[]> {
    const apiKey = process.env.BRAVE_API_KEY;
    if (!apiKey) {
      throw new ToolExecutionError(
        "web_search",
        "未配置 BRAVE_API_KEY 环境变量",
      );
    }

    const response = await fetch(
      "https://api.search.brave.com/res/v1/web/search",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "Content-Type": "application/json",
          "X-Subscription-Token": apiKey,
        },
        body: JSON.stringify({
          q: query,
          count: Math.min(options.num, 20),
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new ToolExecutionError("web_search", "Brave API 密钥无效");
      }
      throw new ToolExecutionError(
        "web_search",
        `搜索失败，状态码: ${response.status}`,
      );
    }

    const data = (await response.json()) as BraveSearchResponse;

    if (!data.web?.results || data.web.results.length === 0) {
      return [];
    }

    return data.web.results.map(
      (result: BraveSearchResult): SearchResult => ({
        title: result.title || "",
        url: result.url || "",
        snippet: result.description || "",
        date: result.age ? `${result.age}前` : undefined,
      }),
    );
  }

  async validateApiKey(key: string): Promise<boolean> {
    try {
      const response = await fetch(
        "https://api.search.brave.com/res/v1/web/search",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Subscription-Token": key,
          },
          body: JSON.stringify({
            q: "test",
            count: 1,
          }),
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * 搜索引擎注册表
 */
const searchProviders: Record<string, SearchProvider> = {
  brave: new BraveSearchProvider(),
};

/**
 * WebSearch 工具：执行网页搜索
 */
export class WebSearchTool extends BaseTool {
  readonly name = "web_search";
  readonly description = "使用搜索引擎查找信息。默认使用 Brave Search API。";
  readonly parameters = z.object({
    query: z.string().describe("搜索查询"),
    num: z
      .number()
      .int()
      .positive()
      .max(20)
      .optional()
      .describe("结果数量（最多20）"),
    engine: z.enum(["brave"]).optional().describe("搜索引擎"),
    ignoreCache: z.boolean().optional().describe("是否忽略缓存"),
  });

  async execute(args: {
    query: string;
    num?: number;
    engine?: string;
    ignoreCache?: boolean;
  }): Promise<string> {
    const { query, num = 10, engine = "brave", ignoreCache = false } = args;

    if (!query.trim()) {
      throw new ToolExecutionError(this.name, "查询不能为空");
    }

    const provider = searchProviders[engine];
    if (!provider) {
      throw new ToolExecutionError(this.name, `暂不支持搜索引擎: ${engine}`);
    }

    const cacheKey = getCacheKey(query, engine);
    const startTime = Date.now();

    // 检查缓存
    if (!ignoreCache) {
      cleanExpiredCache();
      const cached = searchCache.get(cacheKey);
      if (cached) {
        logger.info({ query, engine, fromCache: true }, "搜索命中缓存");
        return this.formatResults(cached.results, engine, true);
      }
    }

    try {
      // 执行搜索
      const results = await provider.search(query, { num: Math.min(num, 20) });

      // 缓存结果
      if (results.length > 0) {
        searchCache.set(cacheKey, {
          query,
          engine,
          results,
          timestamp: Date.now(),
        });
      }

      const duration = Date.now() - startTime;
      logger.info(
        { query, engine, resultCount: results.length, duration },
        "搜索完成",
      );

      return this.formatResults(results, engine, false);
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }
      throw new ToolExecutionError(
        this.name,
        `搜索失败: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 格式化搜索结果
   */
  private formatResults(
    results: SearchResult[],
    engine: string,
    fromCache: boolean,
  ): string {
    if (results.length === 0) {
      return "未找到搜索结果";
    }

    const output = results
      .map((result, index) => {
        const dateStr = result.date ? ` [${result.date}]` : "";
        return `${index + 1}. ${result.title}${dateStr}\n   ${result.url}\n   ${result.snippet}`;
      })
      .join("\n\n");

    const cacheNote = fromCache ? "\n[注: 结果来自缓存]" : "";
    return `${output}${cacheNote}`;
  }
}

/**
 * WebFetch 工具：抓取网页内容
 */
export class WebFetchTool extends BaseTool {
  readonly name = "web_fetch";
  readonly description =
    "获取和处理网页内容。支持 HTML 解析、文本提取、链接提取等。";
  readonly parameters = z.object({
    url: z.string().url().describe("URL 地址"),
    method: z
      .enum(["GET", "POST", "PUT", "DELETE", "PATCH"])
      .optional()
      .describe("HTTP 方法"),
    headers: z.record(z.string(), z.string()).optional().describe("请求头"),
    body: z.string().optional().describe("请求体（POST/PUT）"),
    timeout: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("超时时间（毫秒）"),
    parseJson: z.boolean().optional().describe("是否解析 JSON"),
    extractText: z.boolean().optional().describe("是否提取文本内容"),
    extractLinks: z.boolean().optional().describe("是否提取链接"),
    extractImages: z.boolean().optional().describe("是否提取图片"),
    extractMetadata: z.boolean().optional().describe("是否提取元数据"),
  });

  async execute(args: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeout?: number;
    parseJson?: boolean;
    extractText?: boolean;
    extractLinks?: boolean;
    extractImages?: boolean;
    extractMetadata?: boolean;
  }): Promise<string> {
    const {
      url,
      method = "GET",
      headers = {},
      body,
      timeout = 30000,
      parseJson = false,
      extractText = false,
      extractLinks = false,
      extractImages = false,
      extractMetadata = false,
    } = args;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get("content-type") || "";
      const isHtml = contentType.includes("text/html");

      let content = await response.text();

      // 处理 JSON 响应
      if (parseJson && contentType.includes("application/json")) {
        try {
          const jsonData = JSON.parse(content);
          content = JSON.stringify(jsonData, null, 2);
        } catch {
          // JSON 解析失败，使用原始内容
        }
      }

      // 处理 HTML 内容
      if (isHtml) {
        const $ = cheerio.load(content);
        const results: string[] = [];

        // 提取元数据
        if (extractMetadata) {
          const metadata: string[] = [];
          const title = $("title").text();
          if (title) metadata.push(`标题: ${title}`);

          const description = $('meta[name="description"]').attr("content");
          if (description) metadata.push(`描述: ${description}`);

          const keywords = $('meta[name="keywords"]').attr("content");
          if (keywords) metadata.push(`关键词: ${keywords}`);

          if (metadata.length > 0) {
            results.push("--- 元数据 ---\n" + metadata.join("\n"));
          }
        }

        // 提取文本
        if (extractText) {
          // 移除脚本和样式
          $("script, style").remove();
          const whitespaceRegex = new RE2("\\s+", "g");
          const text = $("body").text().replace(whitespaceRegex, " ").trim();
          results.push("--- 文本内容 ---\n" + text);
        }

        // 提取链接
        if (extractLinks) {
          const links: string[] = [];
          $("a").each((_, element) => {
            const $el = $(element);
            const href = $el.attr("href");
            const text = $el.text().trim();
            if (href) {
              links.push(`- ${text}: ${href}`);
            }
          });
          if (links.length > 0) {
            results.push("--- 链接 ---\n" + links.join("\n"));
          }
        }

        // 提取图片
        if (extractImages) {
          const images: string[] = [];
          $("img").each((_, element) => {
            const $el = $(element);
            const src = $el.attr("src");
            const alt = $el.attr("alt");
            if (src) {
              images.push(`- ${alt || "(无描述)"}: ${src}`);
            }
          });
          if (images.length > 0) {
            results.push("--- 图片 ---\n" + images.join("\n"));
          }
        }

        if (results.length > 0) {
          content = results.join("\n\n");
        }
      }

      // 返回结果
      const finalUrl = response.url;
      const status = response.status;

      if (!response.ok) {
        throw new ToolExecutionError(
          this.name,
          `HTTP 错误 ${status}: ${response.statusText}`,
        );
      }

      return `${status} ${finalUrl}\n\n${content}`;
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error;
      }
      if ((error as Error).name === "AbortError") {
        throw new ToolExecutionError(this.name, "请求超时");
      }
      throw new ToolExecutionError(
        this.name,
        `请求失败: ${(error as Error).message}`,
      );
    }
  }
}

// 导出工具实例
export const webSearchTool = new WebSearchTool();
export const webFetchTool = new WebFetchTool();
