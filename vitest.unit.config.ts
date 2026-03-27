import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/niuma-engine/**/*.test.ts"],
    exclude: ["node_modules/", "dist/"],
  },
  resolve: {
    alias: {
      "@niuma-engine": path.resolve(__dirname, "./src/niuma-engine"),
    },
  },
});
