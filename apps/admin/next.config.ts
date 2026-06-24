import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: [
    '@community-marketplace/ui',
    '@community-marketplace/types',
    '@community-marketplace/utils',
    '@community-marketplace/validation',
    '@community-marketplace/config',
  ],
};

export default nextConfig;
