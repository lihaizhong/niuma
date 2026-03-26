import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@engine": "/niuma",
      "@app": "/src"
    },
  },
  optimizeDeps: {
    include: ["@sqliteai/sqlite-wasm"],
  },
});
