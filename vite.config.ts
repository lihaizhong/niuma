import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@niuma-engine": "/src/niuma-engine",
      "@app": "/src",
    },
  },
  optimizeDeps: {
    include: ["@sqliteai/sqlite-wasm"],
  },
});
