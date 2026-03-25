import { z } from "zod";
import type { ToolSpec } from "./types";

export const webSearchTool: ToolSpec<{ query: string; engine?: string }> = {
  name: "web_search",
  description: "Search the web",
  parameters: z.object({
    query: z.string(),
    engine: z.enum(["google", "bing", "brave"]).optional(),
  }),
  async execute({ query, engine }) {
    return `Searching for: ${query} using ${engine || "default"} engine`;
  },
};

export const webFetchTool: ToolSpec<{ url: string }> = {
  name: "web_fetch",
  description: "Fetch web page content",
  parameters: z.object({
    url: z.string().url(),
  }),
  async execute({ url }) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.text();
  },
};
