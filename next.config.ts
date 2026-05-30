import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Required untuk Docker deployment (standalone mode)
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
};

export default nextConfig;
