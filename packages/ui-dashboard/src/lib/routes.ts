import type { RbacRole, RoleCodeValue } from '@community-marketplace/types';
import { getPanelLoginRedirectPath } from '@community-marketplace/types';

import {
  ACCOUNT_SIDEBAR,
  ADMIN_SIDEBAR,
  BUYER_SIDEBAR,
  SELLER_SIDEBAR,
  SUPER_ADMIN_SIDEBAR,
  type SidebarNavItem,
} from '../sidebar/sidebar-config';

export type { SidebarNavItem } from '../sidebar/sidebar-config';
export {
  SUPER_ADMIN_SIDEBAR,
  ADMIN_SIDEBAR,
  SELLER_SIDEBAR,
  BUYER_SIDEBAR,
} from '../sidebar/sidebar-config';

const SIDEBAR_BY_ROLE: Record<RbacRole, SidebarNavItem[]> = {
  SUPER_ADMIN: SUPER_ADMIN_SIDEBAR,
  ADMIN: ADMIN_SIDEBAR,
  MEMBER: ACCOUNT_SIDEBAR,
  SELLER: ACCOUNT_SIDEBAR,
  BUYER: ACCOUNT_SIDEBAR,
};

/** Canonical post-login dashboard path for each role. */
export function getDashboardRouteByRole(role: RoleCodeValue): string {
  return getPanelLoginRedirectPath(role);
}

export function getSidebarItemsByRole(role: RbacRole): SidebarNavItem[] {
  return SIDEBAR_BY_ROLE[role];
}
