import {
  getDashboardRouteByRole,
  getRequiredRoleForPath,
  isDashboardRouteAllowed,
} from '@community-marketplace/ui-dashboard';
import type { RoleCodeValue } from '@community-marketplace/types';
import { WEB_APP_ROUTES, getWebDashboardPathForRole, isWebDashboardRouteAllowed } from './rbac-routes';
import { getWebRoleFromAuthTokenCookie, getWebRoleFromCookie } from './auth';

export const DASHBOARD_PREFIXES = ['/super-admin', '/admin', '/account', '/seller', '/buyer'] as const;

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
  '/chat': '/account/messages',
  '/buyer/dashboard': '/account',
  '/seller/dashboard': '/account',
  '/buyer/purchases': '/account/purchases',
  '/buyer/favorites': '/account/saved',
  '/buyer/chat': '/account/messages',
  '/buyer/settings': '/account/settings',
  '/buyer/profile': '/account/settings',
  '/buyer/notifications': '/account/notifications',
  '/buyer/listings': '/listings',
  '/buyer/search': '/listings',
  '/seller/listings': '/account/listings',
  '/seller/listings/create': '/account/listings/create',
  '/account/start-selling': '/account/selling',
  '/seller/earnings': '/account/earnings',
  '/seller/verification': '/account/verification',
  '/seller/storefront': '/account/storefront',
  '/seller/chat': '/account/messages',
  '/seller/settings': '/account/settings',
  '/seller/profile': '/account/settings',
  '/seller/notifications': '/account/notifications',
  '/seller/dashboard/chat': '/account/messages',
  '/buyer/dashboard/chat': '/account/messages',
  '/buyer/disputes': '/account/disputes',
  '/seller/disputes': '/account/disputes',
  '/buyer/wallet': '/account/wallet',
  '/buyer/payments': '/account/purchases',
  '/seller/sales': '/account/earnings',
  '/seller/search': '/account/listings',
  '/seller/analytics/shares': '/account/earnings',
  '/super-admin/audit-logs': '/super-admin/audit-log',
  '/admin/reports': '/admin/moderation',
  '/admin/preferences': '/admin/settings',
  '/super-admin/preferences': '/super-admin/settings',
  '/admin/account': '/admin/profile',
  '/super-admin/account': '/super-admin/profile',
  '/buyer/account': '/account/settings',
  '/buyer/preferences': '/account/settings',
  '/seller/account': '/account/settings',
};

/** Nested legacy paths that must rewrite into /account (or public listings). */
function resolveLegacyPrefixRedirect(pathname: string): string | null {
  if (pathname.startsWith('/buyer/disputes/')) {
    return `/account/disputes${pathname.slice('/buyer/disputes'.length)}`;
  }
  if (pathname.startsWith('/seller/disputes/')) {
    return `/account/disputes${pathname.slice('/seller/disputes'.length)}`;
  }
  if (pathname.startsWith('/seller/listings/') && !pathname.startsWith('/seller/listings/create')) {
    return `/account/listings${pathname.slice('/seller/listings'.length)}`;
  }
  if (pathname.startsWith('/buyer/purchases/')) {
    return `/account/purchases${pathname.slice('/buyer/purchases'.length)}`;
  }
  return null;
}

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

  const prefixTarget = resolveLegacyPrefixRedirect(pathname);
  if (prefixTarget) return prefixTarget;

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

export function getRoleFromRequest(cookieHeader: string | null | undefined): RoleCodeValue | null {
  const header = cookieHeader ?? undefined;
  const roleFromToken = getWebRoleFromAuthTokenCookie(header);
  if (roleFromToken) return roleFromToken;

  // A legacy role hint without a bound access token must not drive routing.
  if (getWebRoleFromCookie(header)) return null;

  return null;
}
