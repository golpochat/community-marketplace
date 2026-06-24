import {
  getDashboardRouteByRole,
  getRequiredRoleForPath,
  isDashboardRouteAllowed,
} from '@community-marketplace/ui-dashboard';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { WEB_APP_ROUTES, isWebDashboardRouteAllowed } from '@/lib/rbac-routes';
import { getWebRoleFromCookie } from '@/lib/role-cookie';

const LEGACY_REDIRECTS: Record<string, string> = {
  '/seller/dashboard/chat': '/seller/chat',
  '/buyer/dashboard/chat': '/buyer/chat',
  '/buyer/payments': '/buyer/purchases',
};

const DASHBOARD_PREFIXES = ['/super-admin', '/admin', '/seller', '/buyer'] as const;

function isDashboardPath(pathname: string): boolean {
  return DASHBOARD_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = getWebRoleFromCookie(request.headers.get('cookie') ?? undefined);

  const legacyTarget = LEGACY_REDIRECTS[pathname];
  if (legacyTarget) {
    return NextResponse.redirect(new URL(legacyTarget, request.url));
  }

  if (pathname === '/super-admin') {
    return NextResponse.redirect(new URL('/super-admin/dashboard', request.url));
  }

  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  if (pathname.startsWith('/dashboard')) {
    const target = role ? getDashboardRouteByRole(role) : WEB_APP_ROUTES.login;
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (!isDashboardPath(pathname)) {
    return NextResponse.next();
  }

  if (!role) {
    return NextResponse.redirect(new URL(WEB_APP_ROUTES.login, request.url));
  }

  const requiredRole = getRequiredRoleForPath(pathname);
  if (!requiredRole) {
    return NextResponse.next();
  }

  const allowed =
    isDashboardRouteAllowed(role, pathname) && isWebDashboardRouteAllowed(role, pathname);

  if (!allowed) {
    return NextResponse.redirect(new URL(getDashboardRouteByRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/seller/:path*',
    '/buyer/:path*',
    '/super-admin',
    '/super-admin/:path*',
    '/admin',
    '/admin/:path*',
  ],
};
