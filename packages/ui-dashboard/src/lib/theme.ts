import type { RbacRole } from '@community-marketplace/types';

/** CSS `data-dashboard-theme` attribute values */
export type DashboardThemeToken = 'superAdmin' | 'admin' | 'seller' | 'buyer';

/** Prop values accepted by DashboardLayout */
export type DashboardThemeProp =
  | 'superAdminTheme'
  | 'adminTheme'
  | 'sellerTheme'
  | 'buyerTheme'
  | DashboardThemeToken;

export interface RoleThemeDefinition {
  id: DashboardThemeToken;
  label: string;
  description: string;
  primary: string;
  sidebarBackground: string;
  sidebarActive: string;
  text: string;
}

export const superAdminTheme: RoleThemeDefinition = {
  id: 'superAdmin',
  label: 'Super Admin',
  description: 'Light indigo and violet operator theme',
  primary: '250 84% 54%',
  sidebarBackground: '250 60% 98%',
  sidebarActive: '250 55% 94%',
  text: '222 47% 11%',
};

export const adminTheme: RoleThemeDefinition = {
  id: 'admin',
  label: 'Admin',
  description: 'Light blue management theme',
  primary: '217 91% 55%',
  sidebarBackground: '214 60% 98%',
  sidebarActive: '214 55% 94%',
  text: '222 47% 11%',
};

export const sellerTheme: RoleThemeDefinition = {
  id: 'seller',
  label: 'Seller',
  description: 'Light teal and emerald commerce theme',
  primary: '160 84% 36%',
  sidebarBackground: '158 55% 97%',
  sidebarActive: '158 50% 92%',
  text: '222 47% 11%',
};

export const buyerTheme: RoleThemeDefinition = {
  id: 'buyer',
  label: 'Buyer',
  description: 'Light orange and amber marketplace theme',
  primary: '24 95% 50%',
  sidebarBackground: '32 60% 98%',
  sidebarActive: '32 55% 93%',
  text: '222 47% 11%',
};

export const ROLE_THEME_BY_TOKEN: Record<DashboardThemeToken, RoleThemeDefinition> = {
  superAdmin: superAdminTheme,
  admin: adminTheme,
  seller: sellerTheme,
  buyer: buyerTheme,
};

const THEME_PROP_TO_TOKEN: Record<DashboardThemeProp, DashboardThemeToken> = {
  superAdminTheme: 'superAdmin',
  adminTheme: 'admin',
  sellerTheme: 'seller',
  buyerTheme: 'buyer',
  superAdmin: 'superAdmin',
  admin: 'admin',
  seller: 'seller',
  buyer: 'buyer',
};

const DEFAULT_THEME_BY_ROLE: Record<RbacRole, DashboardThemeToken> = {
  SUPER_ADMIN: 'superAdmin',
  ADMIN: 'admin',
  SELLER: 'seller',
  BUYER: 'buyer',
};

export function resolveThemeToken(theme?: DashboardThemeProp, role?: RbacRole): DashboardThemeToken | undefined {
  if (theme) {
    return THEME_PROP_TO_TOKEN[theme];
  }
  if (role) {
    return DEFAULT_THEME_BY_ROLE[role];
  }
  return undefined;
}

export function getThemeDefinition(theme: DashboardThemeProp | DashboardThemeToken): RoleThemeDefinition {
  const token = THEME_PROP_TO_TOKEN[theme as DashboardThemeProp] ?? (theme as DashboardThemeToken);
  return ROLE_THEME_BY_TOKEN[token];
}
