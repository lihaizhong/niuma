import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@": "/niuma",
    },
  },
  optimizeDeps: {
    include: ["@sqliteai/sqlite-wasm"],
  },
});
