import {
  getDashboardRouteByRole,
  getRequiredRoleForPath,
  isDashboardRouteAllowed,
} from '@community-marketplace/ui-dashboard';
import type { RbacRole } from '@community-marketplace/types';

import { WEB_APP_ROUTES, isWebDashboardRouteAllowed } from './rbac-routes';
import { getWebRoleFromCookie } from './auth';

export const DASHBOARD_PREFIXES = ['/super-admin', '/admin', '/seller', '/buyer'] as const;

export const LEGACY_DASHBOARD_REDIRECTS: Record<string, string> = {
  '/seller/dashboard/chat': '/seller/chat',
  '/buyer/dashboard/chat': '/buyer/chat',
  '/buyer/payments': '/buyer/purchases',
  '/super-admin/audit-logs': '/super-admin/audit-log',
};

export function isDashboardPath(pathname: string): boolean {
  return DASHBOARD_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function resolveDashboardRedirect(pathname: string, role: RbacRole | null): string | null {
  const legacyTarget = LEGACY_DASHBOARD_REDIRECTS[pathname];
  if (legacyTarget) return legacyTarget;

  if (pathname === '/super-admin') return '/super-admin/dashboard';
  if (pathname === '/admin') return '/admin/dashboard';

  if (pathname.startsWith('/dashboard')) {
    return role ? getDashboardRouteByRole(role) : WEB_APP_ROUTES.login;
  }

  return null;
}

export function canAccessDashboardRoute(role: RbacRole | null, pathname: string): boolean {
  if (!role) return false;

  const requiredRole = getRequiredRoleForPath(pathname);
  if (!requiredRole) return true;

  return isDashboardRouteAllowed(role, pathname) && isWebDashboardRouteAllowed(role, pathname);
}

export function getRoleFromRequest(cookieHeader: string | null | undefined): RbacRole | null {
  return getWebRoleFromCookie(cookieHeader ?? undefined);
}
