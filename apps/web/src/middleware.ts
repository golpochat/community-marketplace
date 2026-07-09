import {
  canAccessDashboardRoute,
  getRoleFromRequest,
  isDashboardPath,
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
    '/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
