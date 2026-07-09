import {
  canAccessDashboardRoute,
  getMainSiteOriginFromAdminHost,
  getRoleFromRequest,
  isDashboardPath,
  resolveAdminSubdomainRedirect,
  resolveDashboardRedirect,
  resolveGuestAuthRedirect,
  resolveSuperAdminAdminNamespaceRedirect,
} from '@/lib/route-guards';
import { ROLE_COOKIE_NAME, getWebRoleFromAuthTokenCookie, getWebRoleFromCookie } from '@/lib/role-cookie';
import { getDashboardRouteByRole } from '@community-marketplace/ui-dashboard';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function withLegacyRoleCookieCleanup(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const cookieHeader = request.headers.get('cookie') ?? undefined;
  if (!getWebRoleFromAuthTokenCookie(cookieHeader) && getWebRoleFromCookie(cookieHeader)) {
    response.cookies.set(ROLE_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  }
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = getRoleFromRequest(request.headers.get('cookie'));

  const adminSubdomainRedirect = resolveAdminSubdomainRedirect(
    pathname,
    request.headers.get('host'),
    role,
  );
  if (adminSubdomainRedirect) {
    if (adminSubdomainRedirect === '__MAIN_SITE__') {
      const mainOrigin =
        getMainSiteOriginFromAdminHost(request.headers.get('host'), request.nextUrl.protocol) ??
        request.nextUrl.origin;
      return withLegacyRoleCookieCleanup(
        request,
        NextResponse.redirect(new URL(`${pathname}${request.nextUrl.search}`, mainOrigin)),
      );
    }
    return withLegacyRoleCookieCleanup(
      request,
      NextResponse.redirect(new URL(adminSubdomainRedirect, request.url)),
    );
  }

  if (pathname === '/') {
    return withLegacyRoleCookieCleanup(request, NextResponse.next());
  }

  const guestAuthRedirect = resolveGuestAuthRedirect(pathname, role);
  if (guestAuthRedirect) {
    return withLegacyRoleCookieCleanup(
      request,
      NextResponse.redirect(new URL(guestAuthRedirect, request.url)),
    );
  }

  const superAdminNamespaceRedirect = resolveSuperAdminAdminNamespaceRedirect(pathname, role);
  if (superAdminNamespaceRedirect) {
    return withLegacyRoleCookieCleanup(
      request,
      NextResponse.redirect(new URL(superAdminNamespaceRedirect, request.url)),
    );
  }

  const redirectTarget = resolveDashboardRedirect(pathname, role);
  if (redirectTarget) {
    return withLegacyRoleCookieCleanup(
      request,
      NextResponse.redirect(new URL(redirectTarget, request.url)),
    );
  }

  if (!isDashboardPath(pathname)) {
    return withLegacyRoleCookieCleanup(request, NextResponse.next());
  }

  if (!role) {
    return withLegacyRoleCookieCleanup(
      request,
      NextResponse.redirect(new URL('/auth/login', request.url)),
    );
  }

  if (!canAccessDashboardRoute(role, pathname)) {
    return withLegacyRoleCookieCleanup(
      request,
      NextResponse.redirect(new URL(getDashboardRouteByRole(role), request.url)),
    );
  }

  return withLegacyRoleCookieCleanup(request, NextResponse.next());
}

export const config = {
  matcher: [
    '/',
    '/listings',
    '/listings/:path*',
    '/auth/login',
    '/auth/register',
    '/auth/activate',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/admin/invite/accept',
    '/dashboard',
    '/dashboard/:path*',
    '/seller/:path*',
    '/buyer/:path*',
    '/super-admin',
    '/super-admin/:path*',
    '/admin',
    '/admin/:path*',
  ],
};
