import { APP_NAME } from '@community-marketplace/config';

/** Dynamic 1200×630 brand card — same pipeline as listing OG images. */
export const DEFAULT_OG_IMAGE_PATH = '/api/og/home';

export const DEFAULT_OG_TITLE = `${APP_NAME} — Buy and sell locally in Ireland`;

export const DEFAULT_OG_DESCRIPTION =
  "Ireland's trusted community marketplace. Discover local listings, message sellers safely, and keep trade in your neighbourhood — without platform commission fees.";

export const DEFAULT_OG_IMAGE = {
  url: DEFAULT_OG_IMAGE_PATH,
  width: 1200,
  height: 630,
  alt: APP_NAME,
  type: 'image/jpeg',
} as const;

export const DEFAULT_OPEN_GRAPH = {
  type: 'website' as const,
  siteName: APP_NAME,
  title: DEFAULT_OG_TITLE,
  description: DEFAULT_OG_DESCRIPTION,
  images: [DEFAULT_OG_IMAGE],
};

export const DEFAULT_TWITTER = {
  card: 'summary_large_image' as const,
  title: DEFAULT_OG_TITLE,
  description: DEFAULT_OG_DESCRIPTION,
  images: [DEFAULT_OG_IMAGE_PATH],
};
