import { createHash } from "crypto";

import { z } from "zod";

import type { ToolSpec } from "./types";

export const hashTool: ToolSpec<{ input: string; algorithm?: string }> = {
  name: "hash",
  description: "Hash input string",
  parameters: z.object({
    input: z.string(),
    algorithm: z.enum(["sha256", "sha512", "md5"]).default("sha256"),
  }),
  async execute({ input, algorithm }) {
    return createHash(algorithm || "sha256").update(input).digest("hex");
  },
};
