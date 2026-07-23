import type { Metadata } from 'next';

/** Applied to authenticated dashboards, auth flows, and other non-indexable routes. */
export const NOINDEX_ROBOTS: NonNullable<Metadata['robots']> = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
};

/** Public content pages linked from the site footer. */
export const STATIC_SITEMAP_PATHS = [
  '/',
  '/listings',
  '/about',
  '/help',
  '/safety',
  '/community-rules',
  '/policies/prohibited-items',
  '/terms',
  '/privacy',
  '/contact',
  '/success-stories',
  '/guides',
  '/local',
] as const;

/** Paths disallowed in robots.txt — mirrors noindex route groups. */
export const ROBOTS_DISALLOW_PATHS = [
  '/admin',
  '/super-admin',
  '/seller',
  '/buyer',
  '/auth',
  '/dashboard',
  '/chat',
  '/api',
  '/unauthorized',
  '/~offline',
] as const;
