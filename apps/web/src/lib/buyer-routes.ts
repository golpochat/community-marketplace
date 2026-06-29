export const BUYER_ROUTES = {
  dashboard: '/buyer/dashboard',
  profile: '/buyer/profile',
  settings: '/buyer/settings',
  favorites: '/buyer/favorites',
  purchases: '/buyer/purchases',
  wallet: '/buyer/wallet',
} as const;

/** Legacy `/buyer/profile?tab=` → dedicated routes */
export const BUYER_PROFILE_TAB_REDIRECTS: Record<string, string> = {
  profile: BUYER_ROUTES.profile,
  account: BUYER_ROUTES.profile,
  preferences: BUYER_ROUTES.settings,
  settings: BUYER_ROUTES.settings,
};

export function resolveBuyerProfileRedirect(tab: string | null | undefined): string {
  if (tab && BUYER_PROFILE_TAB_REDIRECTS[tab]) {
    return BUYER_PROFILE_TAB_REDIRECTS[tab];
  }
  return BUYER_ROUTES.profile;
}
