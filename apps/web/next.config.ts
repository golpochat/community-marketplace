import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: process.env.NODE_ENV === 'production',
  /** App Router pages break when Workbox caches client navigations. */
  cacheOnFrontEndNav: false,
  cacheStartUrl: false,
  dynamicStartUrl: false,
  reloadOnOnline: true,
  fallbacks: {
    document: '/~offline',
  },
  /**
   * Replace default HTML/RSC runtime caching — it causes `no-response` errors on
   * routes like /listings when Workbox intercepts document requests.
   */
  extendDefaultRuntimeCaching: false,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-static-assets',
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /\/_next\/image\?/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'next-image',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkOnly',
      },
    ],
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
