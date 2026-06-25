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
  description: 'Light purple operator theme',
  /** #9333EA */
  primary: '271 81% 56%',
  /** #FAF5FF */
  sidebarBackground: '270 100% 98%',
  /** #F3E8FF */
  sidebarActive: '270 100% 95%',
  text: '0 0% 10%',
};

export const adminTheme: RoleThemeDefinition = {
  id: 'admin',
  label: 'Admin',
  description: 'Neutral slate management theme',
  /** #64748B */
  primary: '215 16% 47%',
  /** #F8FAFC */
  sidebarBackground: '210 40% 98%',
  /** #E2E8F0 */
  sidebarActive: '214 32% 91%',
  /** #1A1A1A */
  text: '0 0% 10%',
};

export const sellerTheme: RoleThemeDefinition = {
  id: 'seller',
  label: 'Seller',
  description: 'Light teal and emerald commerce theme',
  primary: '160 84% 36%',
  sidebarBackground: '168 33% 97%',
  sidebarActive: '160 45% 89%',
  text: '0 0% 10%',
};

export const buyerTheme: RoleThemeDefinition = {
  id: 'buyer',
  label: 'Buyer',
  description: 'Light blue marketplace theme',
  primary: '217 91% 60%',
  sidebarBackground: '220 100% 98%',
  sidebarActive: '214 100% 94%',
  text: '0 0% 10%',
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

export type DashboardThemeId = RbacRole;
export type DashboardThemeVariant = DashboardThemeProp;

export interface DashboardTheme {
  id: DashboardThemeId;
  label: string;
  description: string;
}

const DASHBOARD_THEMES: Record<RbacRole, DashboardTheme> = {
  SUPER_ADMIN: {
    id: 'SUPER_ADMIN',
    label: superAdminTheme.label,
    description: superAdminTheme.description,
  },
  ADMIN: {
    id: 'ADMIN',
    label: adminTheme.label,
    description: adminTheme.description,
  },
  SELLER: {
    id: 'SELLER',
    label: sellerTheme.label,
    description: sellerTheme.description,
  },
  BUYER: {
    id: 'BUYER',
    label: buyerTheme.label,
    description: buyerTheme.description,
  },
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

export function getThemeByRole(role: RbacRole): DashboardTheme {
  return DASHBOARD_THEMES[role];
}

export function getThemeClassName(role: RbacRole): string {
  return `dashboard-theme-${role.toLowerCase().replace('_', '-')}`;
}

export function resolveDashboardThemeAttribute(
  role: RbacRole,
  theme?: DashboardThemeVariant,
): { role: RbacRole; theme?: DashboardThemeToken } {
  const token = resolveThemeToken(theme, role);
  return token ? { role, theme: token } : { role };
}
