/** Standard public page width — matches header, footer, storefront. */
export const SITE_PAGE_CLASS = 'mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8';

/** Wider catalog layouts (browse grid + filters). */
export const SITE_PAGE_WIDE_CLASS = 'mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8';

/** Two-column listing detail layout; minmax prevents main-column overflow. */
export const LISTING_DETAIL_GRID_CLASS =
  'grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]';

export const LISTING_DETAIL_MAIN_CLASS = 'min-w-0';
