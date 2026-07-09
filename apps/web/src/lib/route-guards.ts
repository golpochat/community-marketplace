import {
  getDashboardRouteByRole,
  getRequiredRoleForPath,
  isDashboardRouteAllowed,
} from '@community-marketplace/ui-dashboard';
import type { RbacRole, RoleCodeValue } from '@community-marketplace/types';
import { isAdminPanelRoleCode } from '@community-marketplace/types';

import { WEB_APP_ROUTES, getWebDashboardPathForRole, isWebDashboardRouteAllowed } from './rbac-routes';
import { getWebRoleFromAuthTokenCookie, getWebRoleFromCookie } from './auth';

export const DASHBOARD_PREFIXES = ['/super-admin', '/admin', '/seller', '/buyer'] as const;

export const GUEST_ONLY_AUTH_PATHS = [
  WEB_APP_ROUTES.login,
  WEB_APP_ROUTES.register,
  '/auth/activate',
  '/auth/forgot-password',
  '/auth/reset-password',
] as const;

export function isGuestOnlyAuthPath(pathname: string): boolean {
  return GUEST_ONLY_AUTH_PATHS.some((path) => pathname === path);
}

/** Redirect signed-in users away from login, register, and activation pages. */
export function resolveGuestAuthRedirect(pathname: string, role: RoleCodeValue | null): string | null {
  if (!role || !isGuestOnlyAuthPath(pathname)) return null;
  return getWebDashboardPathForRole(role);
}

export const LEGACY_DASHBOARD_REDIRECTS: Record<string, string> = {
  '/seller/dashboard/chat': '/seller/chat',
  '/buyer/dashboard/chat': '/buyer/chat',
  '/buyer/payments': '/buyer/purchases',
  '/super-admin/audit-logs': '/super-admin/audit-log',
  '/admin/reports': '/admin/moderation',
  '/admin/preferences': '/admin/settings',
  '/super-admin/preferences': '/super-admin/settings',
  '/admin/account': '/admin/profile',
  '/super-admin/account': '/super-admin/profile',
  '/buyer/account': '/buyer/profile',
  '/buyer/preferences': '/buyer/settings',
  '/seller/account': '/seller/profile',
};

export function isDashboardPath(pathname: string): boolean {
  if (pathname === '/admin/invite/accept' || pathname.startsWith('/admin/invite/')) {
    return false;
  }
  return DASHBOARD_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Map `/admin/*` to the super-admin namespace so privileged users stay on `/super-admin/*`. */
export function resolveSuperAdminAdminNamespaceRedirect(
  pathname: string,
  role: RoleCodeValue | null,
): string | null {
  if (role !== 'SUPER_ADMIN') return null;
  if (pathname.startsWith('/admin/invite')) return null;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return `/super-admin${pathname.slice('/admin'.length)}`;
  }
  return null;
}

export function resolveDashboardRedirect(pathname: string, role: RoleCodeValue | null): string | null {
  const legacyTarget = LEGACY_DASHBOARD_REDIRECTS[pathname];
  if (legacyTarget) return legacyTarget;

  if (pathname === '/super-admin') return '/super-admin/dashboard';
  if (pathname === '/admin') return '/admin/dashboard';

  if (pathname.startsWith('/dashboard')) {
    return role ? getDashboardRouteByRole(role) : WEB_APP_ROUTES.login;
  }

  return null;
}

export function canAccessDashboardRoute(role: RoleCodeValue | null, pathname: string): boolean {
  if (!role) return false;

  const requiredRole = getRequiredRoleForPath(pathname);
  if (!requiredRole) return true;

  return isDashboardRouteAllowed(role, pathname) && isWebDashboardRouteAllowed(role, pathname);
}

export function isAdminSubdomainHost(host: string | null | undefined): boolean {
  const hostname = host?.split(':')[0]?.toLowerCase() ?? '';
  return hostname === 'admin.localhost' || hostname.startsWith('admin.');
}

/** On admin.{domain}, keep operators in the panel and send everyone else to the main site. */
export function resolveAdminSubdomainRedirect(
  pathname: string,
  host: string | null | undefined,
  role: RoleCodeValue | null,
): string | null {
  if (!isAdminSubdomainHost(host)) return null;

  const isOperator = role === 'SUPER_ADMIN' || (role != null && isAdminPanelRoleCode(role));

  if (pathname === '/') {
    if (role === 'SUPER_ADMIN') return '/super-admin/dashboard';
    if (role && isAdminPanelRoleCode(role)) return '/admin/dashboard';
    return WEB_APP_ROUTES.login;
  }

  const isOperatorPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/super-admin') ||
    pathname.startsWith('/auth');

  if (isOperator) {
    if (pathname.startsWith('/seller') || pathname.startsWith('/buyer') || pathname.startsWith('/listings')) {
      return role === 'SUPER_ADMIN' ? '/super-admin/dashboard' : '/admin/dashboard';
    }
    return null;
  }

  if (isOperatorPath) {
    return null;
  }

  return '__MAIN_SITE__';
}

/** @deprecated Use resolveAdminSubdomainRedirect */
export function resolveAdminSubdomainRootRedirect(
  pathname: string,
  host: string | null | undefined,
  role: RoleCodeValue | null,
): string | null {
  return resolveAdminSubdomainRedirect(pathname, host, role);
}

export function getMainSiteOriginFromAdminHost(host: string | null | undefined, protocol: string): string | null {
  const hostname = host?.split(':')[0]?.toLowerCase() ?? '';
  if (!hostname.startsWith('admin.')) return null;
  const port = host?.includes(':') ? host.split(':')[1] : '';
  const mainHost = hostname.slice('admin.'.length);
  const portSuffix = port ? `:${port}` : '';
  return `${protocol}//${mainHost}${portSuffix}`;
}

export function getRoleFromRequest(cookieHeader: string | null | undefined): RoleCodeValue | null {
  const header = cookieHeader ?? undefined;
  const roleFromToken = getWebRoleFromAuthTokenCookie(header);
  if (roleFromToken) return roleFromToken;

  // A legacy role hint without a bound access token must not drive routing.
  if (getWebRoleFromCookie(header)) return null;

  return null;
}
