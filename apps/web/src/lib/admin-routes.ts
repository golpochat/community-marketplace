export const ADMIN_ROUTES = {
  dashboard: '/admin/dashboard',
  profile: '/admin/profile',
  settings: '/admin/settings',
} as const;

export const SUPER_ADMIN_PERSONAL_ROUTES = {
  profile: '/super-admin/profile',
  settings: '/super-admin/settings',
  platformSettings: '/super-admin/platform-settings',
} as const;

/** Legacy `/admin/profile?tab=` → dedicated routes */
export const ADMIN_PROFILE_TAB_REDIRECTS: Record<string, string> = {
  profile: ADMIN_ROUTES.profile,
  account: ADMIN_ROUTES.profile,
  preferences: ADMIN_ROUTES.settings,
  settings: ADMIN_ROUTES.settings,
};

/** Legacy `/super-admin/profile?tab=` → dedicated routes */
export const SUPER_ADMIN_PROFILE_TAB_REDIRECTS: Record<string, string> = {
  profile: SUPER_ADMIN_PERSONAL_ROUTES.profile,
  account: SUPER_ADMIN_PERSONAL_ROUTES.profile,
  preferences: SUPER_ADMIN_PERSONAL_ROUTES.settings,
  settings: SUPER_ADMIN_PERSONAL_ROUTES.settings,
};

export function resolveAdminProfileRedirect(tab: string | null | undefined): string {
  if (tab && ADMIN_PROFILE_TAB_REDIRECTS[tab]) {
    return ADMIN_PROFILE_TAB_REDIRECTS[tab];
  }
  return ADMIN_ROUTES.profile;
}

export function resolveSuperAdminProfileRedirect(tab: string | null | undefined): string {
  if (tab && SUPER_ADMIN_PROFILE_TAB_REDIRECTS[tab]) {
    return SUPER_ADMIN_PROFILE_TAB_REDIRECTS[tab];
  }
  return SUPER_ADMIN_PERSONAL_ROUTES.profile;
}
