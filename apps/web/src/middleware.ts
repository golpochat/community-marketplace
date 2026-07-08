import {
  canAccessDashboardRoute,
  getRoleFromRequest,
  isDashboardPath,
  resolveDashboardRedirect,
  resolveGuestAuthRedirect,
  resolveSuperAdminAdminNamespaceRedirect,
} from '@/lib/route-guards';
import { getDashboardRouteByRole } from '@community-marketplace/ui-dashboard';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = getRoleFromRequest(request.headers.get('cookie'));

  const guestAuthRedirect = resolveGuestAuthRedirect(pathname, role);
  if (guestAuthRedirect) {
    return NextResponse.redirect(new URL(guestAuthRedirect, request.url));
  }

  const superAdminNamespaceRedirect = resolveSuperAdminAdminNamespaceRedirect(pathname, role);
  if (superAdminNamespaceRedirect) {
    return NextResponse.redirect(new URL(superAdminNamespaceRedirect, request.url));
  }

  const redirectTarget = resolveDashboardRedirect(pathname, role);
  if (redirectTarget) {
    return NextResponse.redirect(new URL(redirectTarget, request.url));
  }

  if (!isDashboardPath(pathname)) {
    return NextResponse.next();
  }

  if (!role) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (!canAccessDashboardRoute(role, pathname)) {
    return NextResponse.redirect(new URL(getDashboardRouteByRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
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
