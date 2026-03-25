import { describe, it, expect, vi } from "vitest";
import { ToolRegistry } from "../tools/registry";
import { z } from "zod";

describe("ToolRegistry", () => {
  describe("register", () => {
    it("should register a tool", () => {
      const registry = new ToolRegistry();
      const tool = {
        name: "test_tool",
        description: "Test tool",
        parameters: z.object({ name: z.string() }),
        execute: vi.fn().mockResolvedValue("result"),
      };

      registry.register(tool);

      expect(registry.list()).toContain("test_tool");
    });

    it("should support method chaining", () => {
      const registry = new ToolRegistry();
      
      const result = registry
        .register({
          name: "tool1",
          description: "Tool 1",
          parameters: z.object({}),
          execute: vi.fn(),
        })
        .register({
          name: "tool2",
          description: "Tool 2",
          parameters: z.object({}),
          execute: vi.fn(),
        });

      expect(result).toBe(registry);
      expect(registry.list()).toHaveLength(2);
    });
  });

  describe("execute", () => {
    it("should execute registered tool", async () => {
      const registry = new ToolRegistry();
      const execute = vi.fn().mockResolvedValue("Tool result");

      registry.register({
        name: "test_tool",
        description: "Test tool",
        parameters: z.object({ value: z.number() }),
        execute,
      });

      const result = await registry.execute("test_tool", { value: 42 });

      expect(result).toBe("Tool result");
      expect(execute).toHaveBeenCalledWith({ value: 42 }, undefined);
    });

    it("should throw for unknown tool", async () => {
      const registry = new ToolRegistry();

      await expect(registry.execute("unknown", {})).rejects.toThrow(
        "Tool 'unknown' not found"
      );
    });

    it("should pass context to tool", async () => {
      const registry = new ToolRegistry();
      const execute = vi.fn().mockResolvedValue("result");
      const context = { cwd: "/test", env: {}, agentId: "test-agent" };

      registry.register({
        name: "context_tool",
        description: "Context tool",
        parameters: z.object({}),
        execute,
      });

      await registry.execute("context_tool", {}, context);

      expect(execute).toHaveBeenCalledWith({}, context);
    });
  });

  describe("list", () => {
    it("should return empty array for new registry", () => {
      const registry = new ToolRegistry();
      expect(registry.list()).toEqual([]);
    });

    it("should return all tool names", () => {
      const registry = new ToolRegistry();
      
      registry.register({
        name: "tool_a",
        description: "Tool A",
        parameters: z.object({}),
        execute: vi.fn(),
      });
      
      registry.register({
        name: "tool_b",
        description: "Tool B",
        parameters: z.object({}),
        execute: vi.fn(),
      });

      const list = registry.list();
      expect(list).toHaveLength(2);
      expect(list).toContain("tool_a");
      expect(list).toContain("tool_b");
    });
  });
});

describe("Builtin Tools", () => {
  describe("Filesystem tools", () => {
    it("should have read_file tool", async () => {
      const { readFileTool } = await import("../tools/filesystem");
      expect(readFileTool.name).toBe("read_file");
      expect(readFileTool.execute).toBeInstanceOf(Function);
    });

    it("should have write_file tool", async () => {
      const { writeFileTool } = await import("../tools/filesystem");
      expect(writeFileTool.name).toBe("write_file");
      expect(writeFileTool.execute).toBeInstanceOf(Function);
    });

    it("should have list_directory tool", async () => {
      const { listDirectoryTool } = await import("../tools/filesystem");
      expect(listDirectoryTool.name).toBe("list_directory");
      expect(listDirectoryTool.execute).toBeInstanceOf(Function);
    });
  });

  describe("Shell tool", () => {
    it("should have shell tool", async () => {
      const { shellTool } = await import("../tools/shell");
      expect(shellTool.name).toBe("shell");
      expect(shellTool.execute).toBeInstanceOf(Function);
    });
  });

  describe("Git tools", () => {
    it("should have git_status tool", async () => {
      const { gitStatusTool } = await import("../tools/git");
      expect(gitStatusTool.name).toBe("git_status");
      expect(gitStatusTool.execute).toBeInstanceOf(Function);
    });

    it("should have git_log tool", async () => {
      const { gitLogTool } = await import("../tools/git");
      expect(gitLogTool.name).toBe("git_log");
      expect(gitLogTool.execute).toBeInstanceOf(Function);
    });
  });

  describe("Web tools", () => {
    it("should have web_search tool", async () => {
      const { webSearchTool } = await import("../tools/web");
      expect(webSearchTool.name).toBe("web_search");
      expect(webSearchTool.execute).toBeInstanceOf(Function);
    });

    it("should have web_fetch tool", async () => {
      const { webFetchTool } = await import("../tools/web");
      expect(webFetchTool.name).toBe("web_fetch");
      expect(webFetchTool.execute).toBeInstanceOf(Function);
    });
  });

  describe("Crypto tools", () => {
    it("should have hash tool", async () => {
      const { hashTool } = await import("../tools/crypto");
      expect(hashTool.name).toBe("hash");
      expect(hashTool.execute).toBeInstanceOf(Function);
    });
  });

  describe("Data tools", () => {
    it("should have parse_json tool", async () => {
      const { parseJsonTool } = await import("../tools/data");
      expect(parseJsonTool.name).toBe("parse_json");
      expect(parseJsonTool.execute).toBeInstanceOf(Function);
    });

    it("should have stringify_json tool", async () => {
      const { stringifyJsonTool } = await import("../tools/data");
      expect(stringifyJsonTool.name).toBe("stringify_json");
      expect(stringifyJsonTool.execute).toBeInstanceOf(Function);
    });
  });

  describe("System tools", () => {
    it("should have get_env tool", async () => {
      const { getEnvTool } = await import("../tools/system");
      expect(getEnvTool.name).toBe("get_env");
      expect(getEnvTool.execute).toBeInstanceOf(Function);
    });

    it("should have get_cwd tool", async () => {
      const { getCwdTool } = await import("../tools/system");
      expect(getCwdTool.name).toBe("get_cwd");
      expect(getCwdTool.execute).toBeInstanceOf(Function);
    });
  });
});
