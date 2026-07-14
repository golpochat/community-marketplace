import type { RbacRole } from '@community-marketplace/types';
import { RBAC_ROLES } from '@community-marketplace/config';

export const DASHBOARD_ROLES = RBAC_ROLES;

export const ROLE_ROUTE_PREFIX: Record<RbacRole, string> = {
  SUPER_ADMIN: '/super-admin',
  ADMIN: '/admin',
  MEMBER: '/account',
  SELLER: '/account',
  BUYER: '/account',
};

export function isDashboardRole(role: string): role is RbacRole {
  return DASHBOARD_ROLES.includes(role as RbacRole);
}

export function getRoleRoutePrefix(role: RbacRole): string {
  return ROLE_ROUTE_PREFIX[role];
}
