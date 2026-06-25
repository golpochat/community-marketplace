import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: process.env.NODE_ENV === 'production',
  /** Avoids broken async cacheWillUpdate helpers in generated sw.js */
  dynamicStartUrl: false,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
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
  async rewrites() {
    const apiOrigin = process.env.INTERNAL_API_URL ?? 'http://localhost:4000';
    return [
      {
        source: '/api/dev-upload',
        destination: `${apiOrigin}/api/dev-upload`,
      },
    ];
  },
};

export default withPWA(nextConfig);
