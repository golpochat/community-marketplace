import { APP_NAME } from '@community-marketplace/config';

/** Default social preview image for non-listing public pages (1200×630 brand asset). */
export const DEFAULT_OG_IMAGE_PATH = '/brand/sellnearby/png/logo-horizontal-full.png';

export const DEFAULT_OG_IMAGE = {
  url: DEFAULT_OG_IMAGE_PATH,
  width: 1200,
  height: 630,
  alt: APP_NAME,
} as const;

export const DEFAULT_OPEN_GRAPH = {
  type: 'website' as const,
  siteName: APP_NAME,
  images: [DEFAULT_OG_IMAGE],
};

export const DEFAULT_TWITTER = {
  card: 'summary_large_image' as const,
  images: [DEFAULT_OG_IMAGE_PATH],
};
