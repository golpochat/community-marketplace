export const SELLER_ROUTES = {
  dashboard: '/seller/dashboard',
  listings: '/seller/listings',
  storefront: '/seller/storefront',
  verification: '/seller/verification',
  profile: '/seller/profile',
  settings: '/seller/settings',
} as const;

/** Legacy `/seller/profile?tab=` → new destinations */
export const SELLER_PROFILE_TAB_REDIRECTS: Record<string, string> = {
  overview: SELLER_ROUTES.dashboard,
  listings: SELLER_ROUTES.listings,
  verification: SELLER_ROUTES.verification,
  settings: SELLER_ROUTES.settings,
  account: SELLER_ROUTES.profile,
  profile: SELLER_ROUTES.profile,
  preferences: SELLER_ROUTES.settings,
};

export function resolveSellerProfileRedirect(tab: string | null | undefined): string {
  if (tab && SELLER_PROFILE_TAB_REDIRECTS[tab]) {
    return SELLER_PROFILE_TAB_REDIRECTS[tab];
  }
  return SELLER_ROUTES.profile;
}
