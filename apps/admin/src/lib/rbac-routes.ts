import type { RbacRole } from '@community-marketplace/types';

/** Backend API path prefixes (after /api) */
export const API_NAMESPACES = {
  SUPER_ADMIN: '/super-admin',
  ADMIN: '/admin',
  SELLER: '/seller',
  BUYER: '/buyer',
} as const;

export const ADMIN_APP_ROUTES = {
  login: '/auth/login',
  adminDashboard: '/admin/dashboard',
  superAdminDashboard: '/super-admin/dashboard',
  users: '/admin/dashboard/users',
  listings: '/admin/dashboard/listings',
  analytics: '/admin/dashboard/analytics',
  settings: '/admin/dashboard/settings',
} as const;

const SUPER_ADMIN_ONLY_PREFIXES = ['/super-admin/dashboard'];
const ADMIN_BLOCKED_FROM_SUPER = ['/super-admin/dashboard'];

export function getAdminDashboardPathForRole(role: RbacRole): string {
  if (role === 'SUPER_ADMIN') return ADMIN_APP_ROUTES.superAdminDashboard;
  if (role === 'ADMIN') return ADMIN_APP_ROUTES.adminDashboard;
  return ADMIN_APP_ROUTES.login;
}

export function isAdminAppRouteAllowed(role: RbacRole | null, pathname: string): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;
  if (role === 'ADMIN') {
    return !SUPER_ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  }
  return false;
}

export function getRequiredAdminRoleForPath(pathname: string): RbacRole | null {
  if (ADMIN_BLOCKED_FROM_SUPER.some((prefix) => pathname.startsWith(prefix))) {
    return 'SUPER_ADMIN';
  }
  if (pathname.startsWith('/admin/dashboard') || pathname.startsWith('/dashboard')) {
    return 'ADMIN';
  }
  return null;
}
