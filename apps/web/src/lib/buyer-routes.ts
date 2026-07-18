import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

export const BUYER_ROUTES = {
  dashboard: WEB_APP_ROUTES.account,
  profile: WEB_APP_ROUTES.accountProfile,
  settings: WEB_APP_ROUTES.accountSettings,
  favorites: WEB_APP_ROUTES.accountSaved,
  purchases: WEB_APP_ROUTES.accountPurchases,
  wallet: WEB_APP_ROUTES.accountWallet,
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
