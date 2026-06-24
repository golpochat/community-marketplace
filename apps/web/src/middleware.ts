import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import {
  WEB_APP_ROUTES,
  getWebDashboardPathForRole,
  isWebDashboardRouteAllowed,
} from '@/lib/rbac-routes';
import { getWebRoleFromCookie } from '@/lib/role-cookie';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = getWebRoleFromCookie(request.headers.get('cookie') ?? undefined);

  if (pathname.startsWith('/dashboard')) {
    const target = role ? getWebDashboardPathForRole(role) : WEB_APP_ROUTES.login;
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (!pathname.startsWith('/seller/dashboard') && !pathname.startsWith('/buyer/dashboard')) {
    return NextResponse.next();
  }

  if (!role) {
    return NextResponse.redirect(new URL(WEB_APP_ROUTES.login, request.url));
  }

  if (!isWebDashboardRouteAllowed(role, pathname)) {
    return NextResponse.redirect(new URL(getWebDashboardPathForRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/seller/dashboard/:path*', '/buyer/dashboard/:path*'],
};
