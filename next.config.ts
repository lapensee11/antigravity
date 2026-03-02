import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['lightningcss', 'lightningcss-darwin-arm64'],
};

export default nextConfig;
