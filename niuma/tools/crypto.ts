import { z } from "zod";
import type { ToolSpec } from "./types";
import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";

export const hashTool: ToolSpec<{ input: string; algorithm?: string }> = {
  name: "hash",
  description: "Hash input string",
  parameters: z.object({
    input: z.string(),
    algorithm: z.enum(["sha256", "sha512", "md5"]).default("sha256"),
  }),
  async execute({ input, algorithm }) {
    return createHash(algorithm).update(input).digest("hex");
  },
};
