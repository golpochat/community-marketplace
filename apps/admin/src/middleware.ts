import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import {
  ADMIN_APP_ROUTES,
  getAdminDashboardPathForRole,
  getRequiredAdminRoleForPath,
  isAdminAppRouteAllowed,
} from '@/lib/rbac-routes';
import { getAdminRoleFromCookie } from '@/lib/role-cookie';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = getAdminRoleFromCookie(request.headers.get('cookie') ?? undefined);

  if (pathname.startsWith('/auth')) {
    if (role && (role === 'ADMIN' || role === 'SUPER_ADMIN')) {
      return NextResponse.redirect(
        new URL(getAdminDashboardPathForRole(role), request.url),
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard')) {
    const suffix = pathname.replace(/^\/dashboard/, '') || '';
    const target = suffix.startsWith('/super-admin')
      ? `/super-admin/dashboard${suffix.replace('/super-admin', '')}`
      : `/admin/dashboard${suffix}`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (!pathname.startsWith('/admin/dashboard') && !pathname.startsWith('/super-admin/dashboard')) {
    return NextResponse.next();
  }

  if (!role) {
    return NextResponse.redirect(new URL(ADMIN_APP_ROUTES.login, request.url));
  }

  const requiredRole = getRequiredAdminRoleForPath(pathname);
  if (requiredRole === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL(ADMIN_APP_ROUTES.adminDashboard, request.url));
  }

  if (!isAdminAppRouteAllowed(role, pathname)) {
    return NextResponse.redirect(new URL(ADMIN_APP_ROUTES.login, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/dashboard/:path*',
    '/super-admin/dashboard/:path*',
    '/auth/:path*',
  ],
};
