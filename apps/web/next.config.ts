import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  /** Avoids broken async cacheWillUpdate helpers in generated sw.js */
  dynamicStartUrl: false,
  workboxOptions: {
    skipWaiting: true,
  },
});

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: [
    '@community-marketplace/ui',
    '@community-marketplace/ui-dashboard',
    '@community-marketplace/types',
    '@community-marketplace/utils',
    '@community-marketplace/validation',
    '@community-marketplace/config',
  ],
};

export default withPWA(nextConfig);
