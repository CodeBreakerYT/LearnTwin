import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the Next.js dev-mode "N" badge.
  devIndicators: false,
  experimental: {
    // Turbopack's build cache records the values of env vars it sees, which would put secrets in .next/cache.
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
