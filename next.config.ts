import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['api.placeholder.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;