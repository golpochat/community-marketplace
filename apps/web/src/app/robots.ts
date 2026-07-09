import type { MetadataRoute } from 'next';

import { ROBOTS_DISALLOW_PATHS } from '@/lib/seo/constants';
import { getAppUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...ROBOTS_DISALLOW_PATHS],
    },
    sitemap: `${getAppUrl()}/sitemap.xml`,
    host: getAppUrl(),
  };
}
