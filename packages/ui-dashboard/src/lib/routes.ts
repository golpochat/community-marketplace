import type { RbacRole } from '@community-marketplace/types';
import { getLoginRedirectPath } from '@community-marketplace/types';

import {
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
  SELLER: SELLER_SIDEBAR,
  BUYER: BUYER_SIDEBAR,
};

/** Canonical post-login dashboard path for each role. */
export function getDashboardRouteByRole(role: RbacRole): string {
  return getLoginRedirectPath(role);
}

export function getSidebarItemsByRole(role: RbacRole): SidebarNavItem[] {
  return SIDEBAR_BY_ROLE[role];
}
