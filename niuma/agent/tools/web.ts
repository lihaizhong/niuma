/**
 * Web 工具
 * 提供 Web 搜索和网页内容抓取功能
 */

import { z } from 'zod'
import { BaseTool } from './base.js'
import { ToolExecutionError } from '../../types/error.js'
import * as cheerio from 'cheerio'

/**
 * WebSearch 工具：执行网页搜索
 */
export class WebSearchTool extends BaseTool {
  readonly name = 'web_search'
  readonly description = '使用搜索引擎查找信息。默认使用 Brave Search API。'
  readonly parameters = z.object({
    query: z.string().describe('搜索查询'),
    num: z.number().int().positive().max(20).optional().describe('结果数量（最多20）'),
    engine: z.enum(['brave']).optional().describe('搜索引擎'),
  })

  async execute(args: { query: string; num?: number; engine?: string }): Promise<string> {
    const { query, num = 10, engine = 'brave' } = args

    if (!query.trim()) {
      throw new ToolExecutionError(this.name, '查询不能为空')
    }

    if (engine !== 'brave') {
      throw new ToolExecutionError(this.name, `暂不支持搜索引擎: ${engine}`)
    }

    const apiKey = process.env.BRAVE_API_KEY
    if (!apiKey) {
      throw new ToolExecutionError(this.name, '未配置 BRAVE_API_KEY 环境变量')
    }

    try {
      const response = await fetch('https://api.search.brave.com/res/v1/web/search', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'Content-Type': 'application/json',
          'X-Subscription-Token': apiKey,
        },
        body: JSON.stringify({
          q: query,
          count: Math.min(num, 20),
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new ToolExecutionError(this.name, 'Brave API 密钥无效')
        }
        throw new ToolExecutionError(this.name, `搜索失败，状态码: ${response.status}`)
      }

      const data = (await response.json()) as any

      if (!data.web?.results || data.web.results.length === 0) {
        return '未找到搜索结果'
      }

      const results = data.web.results.map((result: any) => {
        return {
          title: result.title || '',
          url: result.url || '',
          snippet: result.description || '',
          date: result.age ? `${result.age}前` : undefined,
        }
      })

      // 格式化输出
      const output = results
        .map((result: any, index: number) => {
          const dateStr = result.date ? ` [${result.date}]` : ''
          return `${index + 1}. ${result.title}${dateStr}\n   ${result.url}\n   ${result.snippet}`
        })
        .join('\n\n')

      return output
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error
      }
      throw new ToolExecutionError(this.name, `搜索失败: ${(error as Error).message}`)
    }
  }
}

/**
 * WebFetch 工具：抓取网页内容
 */
export class WebFetchTool extends BaseTool {
  readonly name = 'web_fetch'
  readonly description = '获取和处理网页内容。支持 HTML 解析、文本提取、链接提取等。'
  readonly parameters = z.object({
    url: z.string().url().describe('URL 地址'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional().describe('HTTP 方法'),
    headers: z.record(z.string(), z.string()).optional().describe('请求头'),
    body: z.string().optional().describe('请求体（POST/PUT）'),
    timeout: z.number().int().positive().optional().describe('超时时间（毫秒）'),
    parseJson: z.boolean().optional().describe('是否解析 JSON'),
    extractText: z.boolean().optional().describe('是否提取文本内容'),
    extractLinks: z.boolean().optional().describe('是否提取链接'),
    extractImages: z.boolean().optional().describe('是否提取图片'),
    extractMetadata: z.boolean().optional().describe('是否提取元数据'),
  })

  async execute(args: {
    url: string
    method?: string
    headers?: Record<string, string>
    body?: string
    timeout?: number
    parseJson?: boolean
    extractText?: boolean
    extractLinks?: boolean
    extractImages?: boolean
    extractMetadata?: boolean
  }): Promise<string> {
    const {
      url,
      method = 'GET',
      headers = {},
      body,
      timeout = 30000,
      parseJson = false,
      extractText = false,
      extractLinks = false,
      extractImages = false,
      extractMetadata = false,
    } = args

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const contentType = response.headers.get('content-type') || ''
      const isHtml = contentType.includes('text/html')

      let content = await response.text()

      // 处理 JSON 响应
      if (parseJson && contentType.includes('application/json')) {
        try {
          const jsonData = JSON.parse(content)
          content = JSON.stringify(jsonData, null, 2)
        } catch {
          // JSON 解析失败，使用原始内容
        }
      }

      // 处理 HTML 内容
      if (isHtml) {
        const $ = cheerio.load(content)
        const results: string[] = []

        // 提取元数据
        if (extractMetadata) {
          const metadata: string[] = []
          const title = $('title').text()
          if (title) metadata.push(`标题: ${title}`)

          const description = $('meta[name="description"]').attr('content')
          if (description) metadata.push(`描述: ${description}`)

          const keywords = $('meta[name="keywords"]').attr('content')
          if (keywords) metadata.push(`关键词: ${keywords}`)

          if (metadata.length > 0) {
            results.push('--- 元数据 ---\n' + metadata.join('\n'))
          }
        }

        // 提取文本
        if (extractText) {
          // 移除脚本和样式
          $('script, style').remove()
          const text = $('body').text().replace(/\s+/g, ' ').trim()
          results.push('--- 文本内容 ---\n' + text)
        }

        // 提取链接
        if (extractLinks) {
          const links: string[] = []
          $('a').each((_, element) => {
            const $el = $(element)
            const href = $el.attr('href')
            const text = $el.text().trim()
            if (href) {
              links.push(`- ${text}: ${href}`)
            }
          })
          if (links.length > 0) {
            results.push('--- 链接 ---\n' + links.join('\n'))
          }
        }

        // 提取图片
        if (extractImages) {
          const images: string[] = []
          $('img').each((_, element) => {
            const $el = $(element)
            const src = $el.attr('src')
            const alt = $el.attr('alt')
            if (src) {
              images.push(`- ${alt || '(无描述)'}: ${src}`)
            }
          })
          if (images.length > 0) {
            results.push('--- 图片 ---\n' + images.join('\n'))
          }
        }

        if (results.length > 0) {
          content = results.join('\n\n')
        }
      }

      // 返回结果
      const finalUrl = response.url
      const status = response.status

      if (!response.ok) {
        throw new ToolExecutionError(this.name, `HTTP 错误 ${status}: ${response.statusText}`)
      }

      return `${status} ${finalUrl}\n\n${content}`
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        throw error
      }
      if ((error as Error).name === 'AbortError') {
        throw new ToolExecutionError(this.name, '请求超时')
      }
      throw new ToolExecutionError(this.name, `请求失败: ${(error as Error).message}`)
    }
  }
}

// 导出工具实例
export const webSearchTool = new WebSearchTool()
export const webFetchTool = new WebFetchTool()
