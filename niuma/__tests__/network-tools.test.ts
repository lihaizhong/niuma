/**
 * 网络工具测试
 */

import { describe, it, expect } from "vitest";
import { pingTool, dnsLookupTool, httpRequestTool } from "../agent/tools/network";
import { ToolExecutionError } from "../types/error";

describe("PingTool", () => {
  describe("ping 主机", () => {
    it("应该成功 ping localhost", async () => {
      const result = await pingTool.execute({
        host: "localhost",
        count: 2,
      });

      expect(result).toContain("localhost");
      expect(result.toLowerCase()).toContain("ping");
    }, 10000);

    it("应该支持指定 ping 次数", async () => {
      const result = await pingTool.execute({
        host: "127.0.0.1",
        count: 1,
      });

      expect(result).toContain("127.0.0.1");
    }, 10000);
  });
});

describe("DnsLookupTool", () => {
  describe("DNS 查询", () => {
    it("应该成功查询 A 记录", async () => {
      const result = await dnsLookupTool.execute({
        hostname: "localhost",
        recordType: "A",
      });

      expect(result).toBeDefined();
      expect(result.toLowerCase()).toContain("localhost");
    }, 10000);

    it("应该成功查询 Google 的 A 记录", async () => {
      const result = await dnsLookupTool.execute({
        hostname: "google.com",
        recordType: "A",
      });

      expect(result).toBeDefined();
      expect(result.toLowerCase()).toContain("google.com");
    }, 10000);

    it("应该成功查询 AAAA 记录", async () => {
      const result = await dnsLookupTool.execute({
        hostname: "localhost",
        recordType: "AAAA",
      });

      expect(result).toBeDefined();
    }, 10000);

    it("应该成功查询 MX 记录", async () => {
      const result = await dnsLookupTool.execute({
        hostname: "gmail.com",
        recordType: "MX",
      });

      expect(result).toBeDefined();
      expect(result.toLowerCase()).toContain("gmail.com");
    }, 10000);

    it("应该成功查询 TXT 记录", async () => {
      const result = await dnsLookupTool.execute({
        hostname: "google.com",
        recordType: "TXT",
      });

      expect(result).toBeDefined();
    }, 10000);

    it("应该失败当主机不存在", async () => {
      const result = await dnsLookupTool.execute({
        hostname: "nonexistent-domain-12345.com",
        recordType: "A",
      });

      // DNS 查询不应该抛出错误，而是返回结果
      expect(result).toBeDefined();
    }, 10000);
  });
});

describe("HttpRequestTool", () => {
  describe("HTTP 请求", () => {
    it("应该成功发送 GET 请求", async () => {
      const result = await httpRequestTool.execute({
        url: "https://httpbin.org/get",
        method: "GET",
        timeout: 10000,
      });

      expect(result).toBeDefined();
      expect(result).toContain("args");
    }, 15000);

    it("应该成功发送 POST 请求", async () => {
      const result = await httpRequestTool.execute({
        url: "https://httpbin.org/post",
        method: "POST",
        body: '{"test": "data"}',
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      expect(result).toBeDefined();
      expect(result).toContain("json");
    }, 15000);

    it("应该支持自定义请求头", async () => {
      const result = await httpRequestTool.execute({
        url: "https://httpbin.org/headers",
        method: "GET",
        headers: {
          "X-Custom-Header": "test-value",
        },
        timeout: 10000,
      });

      expect(result).toBeDefined();
      expect(result).toContain("X-Custom-Header");
    }, 15000);

    it("应该处理超时", async () => {
      await expect(
        httpRequestTool.execute({
          url: "https://httpbin.org/delay/10",
          method: "GET",
          timeout: 1000, // 1 秒超时
        }),
      ).rejects.toThrow(ToolExecutionError);
    }, 15000);

    it("应该处理 404 错误", async () => {
      const result = await httpRequestTool.execute({
        url: "https://httpbin.org/status/404",
        method: "GET",
        timeout: 10000,
      });

      // 404 不应该抛出错误，而是返回结果
      expect(result).toBeDefined();
    }, 15000);

    it("应该处理无效 URL", async () => {
      await expect(
        httpRequestTool.execute({
          url: "not-a-valid-url",
          method: "GET",
          timeout: 10000,
        }),
      ).rejects.toThrow(ToolExecutionError);
    }, 10000);

    it("应该支持 PUT 请求", async () => {
      const result = await httpRequestTool.execute({
        url: "https://httpbin.org/put",
        method: "PUT",
        body: '{"updated": true}',
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      expect(result).toBeDefined();
      expect(result).toContain("json");
    }, 15000);

    it("应该支持 DELETE 请求", async () => {
      const result = await httpRequestTool.execute({
        url: "https://httpbin.org/delete",
        method: "DELETE",
        timeout: 10000,
      });

      expect(result).toBeDefined();
    }, 15000);
  });
});