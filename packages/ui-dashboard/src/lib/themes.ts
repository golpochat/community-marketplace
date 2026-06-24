import type { RbacRole } from '@community-marketplace/types';

import {
  adminTheme,
  buyerTheme,
  resolveThemeToken,
  sellerTheme,
  superAdminTheme,
  type DashboardThemeProp,
  type DashboardThemeToken,
  type RoleThemeDefinition,
} from './theme';

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

export {
  superAdminTheme,
  adminTheme,
  sellerTheme,
  buyerTheme,
  resolveThemeToken,
  getThemeDefinition,
  type DashboardThemeProp,
  type DashboardThemeToken,
  type RoleThemeDefinition,
} from './theme';
