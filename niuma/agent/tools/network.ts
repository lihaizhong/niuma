/**
 * 网络工具
 * 提供网络连通性测试、DNS 查询和 HTTP 请求功能
 */

// ==================== 内置库 ====================
import { lookup, resolveMx, resolveTxt } from "dns";
import { URL } from "url";
import { promisify } from "util";

// ==================== 第三方库 ====================
import fetch from "node-fetch";
import ping from "ping";
import { z } from "zod";

// ==================== 本地模块 ====================
import { ToolExecutionError } from "../../types/error";

import { BaseTool } from "./base";

// ==================== 常量定义 ====================
const PING_TIMEOUT = 5000; // 5 秒超时
const HTTP_TIMEOUT = 30000; // 30 秒超时

// ==================== 工具函数 ====================

/**
 * 将 DNS lookup 转换为 Promise
 */
const lookupAsync = promisify(lookup);

/**
 * 将 DNS resolveMx 转换为 Promise
 */
const resolveMxAsync = promisify(resolveMx) as (
  hostname: string,
) => Promise<Array<{ exchange: string; priority: number }>>;

/**
 * 将 DNS resolveTxt 转换为 Promise
 */
const resolveTxtAsync = promisify(resolveTxt) as (
  hostname: string,
) => Promise<string[][]>;

/**
 * 验证 URL 格式
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ==================== 类定义 ====================

/**
 * Ping 工具：网络连通性测试
 */
export class PingTool extends BaseTool {
  readonly name = "ping";
  readonly description =
    "测试网络连通性，发送 ICMP 请求包并返回延迟统计。默认发送 4 个包，超时 5 秒。";
  readonly parameters = z.object({
    host: z.string().describe("主机名或 IP 地址"),
    count: z
      .number()
      .int()
      .positive()
      .default(4)
      .describe("ping 次数，默认 4"),
  });

  async execute(args: { host: string; count?: number }): Promise<string> {
    const { host, count = 4 } = args;

    try {
      const result = await ping.promise.probe(host, {
        timeout: PING_TIMEOUT,
        extra: ["-i", "0.2", "-c", count.toString()], // 快速 ping，指定次数
      });

      if (result.alive) {
        const stats = `最小延迟: ${result.min}ms, 最大延迟: ${result.max}ms, 平均延迟: ${result.avg}ms`;
        const packetLoss = result.packetLoss
          ? `, 丢包率: ${result.packetLoss}%`
          : "";
        return `Ping ${host} 成功！\n${stats}${packetLoss}`;
      } else {
        return `Ping ${host} 失败：主机不可达或无响应`;
      }
    } catch (error) {
      throw new ToolExecutionError(
        this.name,
        `Ping 失败: ${(error as Error).message}`,
      );
    }
  }
}

/**
 * DnsLookup 工具：DNS 查询
 */
export class DnsLookupTool extends BaseTool {
  readonly name = "dns_lookup";
  readonly description =
    "查询 DNS 记录。支持记录类型：A（IPv4）、AAAA（IPv6）、MX（邮件服务器）、TXT（文本记录）。";
  readonly parameters = z.object({
    hostname: z.string().describe("主机名或域名"),
    recordType: z
      .enum(["A", "AAAA", "MX", "TXT"])
      .describe("DNS 记录类型"),
  });

  async execute(args: {
    hostname: string;
    recordType: string;
  }): Promise<string> {
    const { hostname, recordType } = args;

    try {
      if (recordType === "A" || recordType === "AAAA") {
        // 查询 A 或 AAAA 记录
        const address = await lookupAsync(hostname, {
          family: recordType === "A" ? 4 : 6,
        });
        return `DNS 查询 ${hostname} (${recordType}):\n${address.address}`;
      } else if (recordType === "MX") {
        // 查询 MX 记录
        const mxRecords = await resolveMxAsync(hostname);
        if (mxRecords.length === 0) {
          return `DNS 查询 ${hostname} (MX): 无 MX 记录`;
        }
        const result = mxRecords
          .map((record) => `${record.exchange} (优先级: ${record.priority})`)
          .join("\n");
        return `DNS 查询 ${hostname} (MX):\n${result}`;
      } else if (recordType === "TXT") {
        // 查询 TXT 记录
        const txtRecords = await resolveTxtAsync(hostname);
        if (txtRecords.length === 0) {
          return `DNS 查询 ${hostname} (TXT): 无 TXT 记录`;
        }
        const result = txtRecords.map((record) => record.join("")).join("\n");
        return `DNS 查询 ${hostname} (TXT):\n${result}`;
      }
      return `DNS 查询 ${hostname} (${recordType}): 完成`;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOTFOUND" || err.code === "ENODATA") {
        return `DNS 查询 ${hostname} (${recordType}): 域名不存在或无该类型记录`;
      }
      throw new ToolExecutionError(
        this.name,
        `DNS 查询失败: ${(error as Error).message}`,
      );
    }
  }
}

/**
 * HttpRequest 工具：通用 HTTP 请求
 */
export class HttpRequestTool extends BaseTool {
  readonly name = "http_request";
  readonly description =
    "发送 HTTP 请求。支持 GET、POST、PUT、DELETE 方法。默认超时 30 秒。";
  readonly parameters = z.object({
    url: z.string().describe("请求的 URL"),
    method: z
      .enum(["GET", "POST", "PUT", "DELETE"])
      .default("GET")
      .describe("HTTP 方法"),
    headers: z
      .record(z.string(), z.string())
      .optional()
      .describe("请求头（可选）"),
    body: z.string().optional().describe("请求体（可选，仅 POST/PUT 有效）"),
    timeout: z
      .number()
      .int()
      .positive()
      .default(HTTP_TIMEOUT)
      .describe("超时时间（毫秒），默认 30 秒"),
  });

  async execute(args: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeout?: number;
  }): Promise<string> {
    const { url, method = "GET", headers = {}, body, timeout = HTTP_TIMEOUT } = args;

    // 验证 URL 格式
    if (!isValidUrl(url)) {
      throw new ToolExecutionError(this.name, `无效的 URL: ${url}`);
    }

    try {
      // 使用 AbortController 实现超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers: {
          "User-Agent": "Niuma/1.0",
          ...headers,
        },
        body: (method === "POST" || method === "PUT") ? body : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 获取响应头
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // 获取响应体
      const responseBody = await response.text();

      // 构建返回消息
      let result = `HTTP ${method} ${url}\n`;
      result += `状态码: ${response.status} ${response.statusText}\n`;
      result += `\n响应头:\n`;
      for (const [key, value] of Object.entries(responseHeaders)) {
        result += `  ${key}: ${value}\n`;
      }
      result += `\n响应体:\n`;
      result += responseBody;

      return result;
    } catch (error) {
      const err = error as Error;
      if (err.name === "AbortError" || err.message.includes("timeout")) {
        throw new ToolExecutionError(this.name, `请求超时 (${timeout}ms)`);
      }
      throw new ToolExecutionError(
        this.name,
        `HTTP 请求失败: ${(error as Error).message}`,
      );
    }
  }
}

// ==================== 导出工具实例 ====================
export const pingTool = new PingTool();
export const dnsLookupTool = new DnsLookupTool();
export const httpRequestTool = new HttpRequestTool();
