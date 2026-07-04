import type { MetadataRoute } from 'next';

import { APP_SHORT_NAME, BRAND_COLORS } from '@community-marketplace/config';

const PWA_DESCRIPTION =
  'Buy and sell within your community in Ireland.';

/** Web app manifest — drives install prompt name, icon, and theme. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: APP_SHORT_NAME,
    short_name: APP_SHORT_NAME,
    description: PWA_DESCRIPTION,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: BRAND_COLORS.surfacePage,
    theme_color: BRAND_COLORS.primary,
    orientation: 'portrait-primary',
    categories: ['shopping', 'business'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
