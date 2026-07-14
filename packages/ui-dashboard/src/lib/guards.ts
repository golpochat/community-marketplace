import type { RbacRole, RoleCodeValue } from '@community-marketplace/types';
import { canActAsBuyer, canEnterSellerNamespace, isAdminPanelRoleCode } from '@community-marketplace/types';

import { getDashboardRouteByRole } from './routes';

const ROLE_ROUTE_PREFIXES: Record<RbacRole, string> = {
  SUPER_ADMIN: '/super-admin',
  ADMIN: '/admin',
  MEMBER: '/account',
  SELLER: '/account',
  BUYER: '/account',
};

const ADMIN_ROLES: RbacRole[] = ['SUPER_ADMIN', 'ADMIN'];
const WEB_ROLES: RbacRole[] = ['SUPER_ADMIN', 'ADMIN', 'MEMBER', 'SELLER', 'BUYER'];

export function getRoleRoutePrefix(role: RbacRole): string {
  return ROLE_ROUTE_PREFIXES[role];
}

export function isAdminDashboardRole(role: RbacRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function isWebDashboardRole(role: RbacRole): boolean {
  return WEB_ROLES.includes(role);
}

export function getRequiredRoleForPath(pathname: string): RbacRole | null {
  if (pathname.startsWith('/super-admin')) return 'SUPER_ADMIN';
  if (pathname.startsWith('/admin')) return 'ADMIN';
  if (pathname.startsWith('/account')) return 'MEMBER';
  if (pathname.startsWith('/seller')) return 'SELLER';
  if (pathname.startsWith('/buyer')) return 'BUYER';
  return null;
}

export function isDashboardRouteAllowed(role: RoleCodeValue | null, pathname: string): boolean {
  if (!role) return false;

  const required = getRequiredRoleForPath(pathname);
  if (!required) return false;

  if (required === 'SUPER_ADMIN') return role === 'SUPER_ADMIN';
  if (required === 'ADMIN') return isAdminPanelRoleCode(role);

  if (required === 'MEMBER') {
    return canActAsBuyer(role as RbacRole) || canEnterSellerNamespace(role as RbacRole);
  }

  if (required === 'BUYER') {
    return canActAsBuyer(role as RbacRole);
  }

  if (required === 'SELLER') {
    return canEnterSellerNamespace(role as RbacRole);
  }

  return role === required;
}

export function getUnauthorizedRedirectPath(role: RoleCodeValue | null): string {
  if (role) return getDashboardRouteByRole(role);
  return '/auth/login';
}
