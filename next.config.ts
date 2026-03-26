import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  distDir: ".next",
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
