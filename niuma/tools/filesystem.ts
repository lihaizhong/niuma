import { existsSync } from "fs";
import { readFile, writeFile, readdir, mkdir } from "fs/promises";
import { dirname } from "path";

import { z } from "zod";

import type { ToolSpec } from "./types";

export const readFileTool: ToolSpec<{ path: string; limit?: number; offset?: number }> = {
  name: "read_file",
  description: "Read file contents",
  parameters: z.object({
    path: z.string(),
    limit: z.number().optional(),
    offset: z.number().optional(),
  }),
  async execute({ path, limit, offset }) {
    const content = await readFile(path, "utf-8");
    if (offset !== undefined || limit !== undefined) {
      const lines = content.split("\n");
      return lines.slice(offset || 0, limit ? (offset || 0) + limit : undefined).join("\n");
    }
    return content;
  },
};

export const writeFileTool: ToolSpec<{ path: string; content: string }> = {
  name: "write_file",
  description: "Write content to file",
  parameters: z.object({
    path: z.string(),
    content: z.string(),
  }),
  async execute({ path, content }) {
    const dir = dirname(path);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(path, content, "utf-8");
    return `File written: ${path}`;
  },
};

export const listDirectoryTool: ToolSpec<{ path: string }> = {
  name: "list_directory",
  description: "List directory contents",
  parameters: z.object({
    path: z.string(),
  }),
  async execute({ path }) {
    const entries = await readdir(path, { withFileTypes: true });
    return entries.map((e) => (e.isDirectory() ? `${e.name}/` : e.name)).join("\n");
  },
};
