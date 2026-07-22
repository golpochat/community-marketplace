import {
  canAccessDashboardRoute,
  getRoleFromRequest,
  isDashboardPath,
  resolveDashboardRedirect,
  resolveGuestAuthRedirect,
  resolveSuperAdminAdminNamespaceRedirect,
} from '@/lib/route-guards';
import { ROLE_COOKIE_NAME, getWebRoleFromAuthTokenCookie, getWebRoleFromCookie } from '@/lib/role-cookie';
import { rewriteLegacyListingRouteParam } from '@/lib/listing-slug';
import { getDashboardRouteByRole } from '@community-marketplace/ui-dashboard';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Compact legacy `/listings/{title}-{full-uuid}` URLs before the page renders (avoids address-bar flash). */
function redirectLegacyListingUrl(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/listings/')) return null;

  const param = pathname.slice('/listings/'.length);
  if (!param || param.includes('/')) return null;

  const rewritten = rewriteLegacyListingRouteParam(param);
  if (!rewritten) return null;

  const url = request.nextUrl.clone();
  url.pathname = `/listings/${rewritten}`;
  return NextResponse.redirect(url, 308);
}

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

  const listingRedirect = redirectLegacyListingUrl(request);
  if (listingRedirect) {
    return withLegacyRoleCookieCleanup(request, listingRedirect);
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

  const redirectTarget = resolveDashboardRedirect(pathname, role, request.nextUrl.searchParams);
  if (redirectTarget) {
    const url = new URL(redirectTarget, request.url);
    // Profile tab redirects already encode the destination; don't re-attach ?tab=.
    if (pathname !== '/seller/profile' && pathname !== '/buyer/profile') {
      url.search = request.nextUrl.search;
    }
    return withLegacyRoleCookieCleanup(request, NextResponse.redirect(url));
  }

  if (!isDashboardPath(pathname)) {
    return withLegacyRoleCookieCleanup(request, NextResponse.next());
  }

  if (!role) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set(
      'returnUrl',
      `${pathname}${request.nextUrl.search}`,
    );
    return withLegacyRoleCookieCleanup(
      request,
      NextResponse.redirect(loginUrl),
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
