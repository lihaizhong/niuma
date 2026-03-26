import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["niuma/**/*.test.ts"],
    exclude: ["node_modules/", "dist/"],
  },
  resolve: {
    alias: {
      "@niuma": path.resolve(__dirname, "./niuma"),
    },
  },
});
