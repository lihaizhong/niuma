import { z } from "zod";
import type { ToolSpec } from "./types";

export const parseJsonTool: ToolSpec<{ input: string }> = {
  name: "parse_json",
  description: "Parse JSON string",
  parameters: z.object({
    input: z.string(),
  }),
  async execute({ input }) {
    return JSON.stringify(JSON.parse(input), null, 2);
  },
};

export const stringifyJsonTool: ToolSpec<{ input: unknown }> = {
  name: "stringify_json",
  description: "Stringify to JSON",
  parameters: z.object({
    input: z.unknown(),
  }),
  async execute({ input }) {
    return JSON.stringify(input, null, 2);
  },
};
