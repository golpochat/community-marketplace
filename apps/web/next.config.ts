import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  workboxOptions: {
    skipWaiting: true,
  },
});

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

export default withPWA(nextConfig);
