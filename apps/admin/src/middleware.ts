import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';



import {

  getDashboardRouteByRole,

  getRequiredRoleForPath,

  isDashboardRouteAllowed,

} from '@community-marketplace/ui-dashboard';



import { SERVER_API_BASE_URL } from '@/lib/constants';

import { ADMIN_APP_ROUTES } from '@/lib/rbac-routes';

import {

  AUTH_TOKEN_COOKIE_NAME,

  getAdminAuthTokenFromCookie,

  getAdminRefreshTokenFromCookie,

  getAdminRoleFromCookie,

  REFRESH_TOKEN_COOKIE_NAME,

} from '@/lib/role-cookie';



function parseJwtExp(token: string): number | null {

  const parts = token.split('.');

  if (parts.length < 2) return null;

  try {

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');

    const json = atob(base64);

    const payload = JSON.parse(json) as { exp?: number };

    return typeof payload.exp === 'number' ? payload.exp : null;

  } catch {

    return null;

  }

}



function isTokenExpiringSoon(token: string, skewSeconds = 60): boolean {

  const exp = parseJwtExp(token);

  if (!exp) return true;

  return exp * 1000 <= Date.now() + skewSeconds * 1000;

}



async function refreshSession(refreshToken: string) {

  const response = await fetch(`${SERVER_API_BASE_URL}/auth/refresh`, {

    method: 'POST',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({ refreshToken }),

    cache: 'no-store',

  });



  if (!response.ok) return null;



  const json = (await response.json()) as {

    data?: { accessToken?: string; refreshToken?: string };

  };



  if (!json.data?.accessToken || !json.data?.refreshToken) return null;

  return {

    accessToken: json.data.accessToken,

    refreshToken: json.data.refreshToken,

  };

}



function applyAuthCookies(

  response: NextResponse,

  accessToken: string,

  refreshToken: string,

): NextResponse {

  response.cookies.set(AUTH_TOKEN_COOKIE_NAME, encodeURIComponent(accessToken), {

    path: '/',

    sameSite: 'lax',

  });

  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, encodeURIComponent(refreshToken), {

    path: '/',

    sameSite: 'lax',

  });

  return response;

}



function isProtectedAdminPath(pathname: string): boolean {

  return (

    pathname.startsWith('/admin') ||

    pathname.startsWith('/super-admin') ||

    pathname.startsWith('/dashboard')

  );

}



function isRoleScopedPath(pathname: string): boolean {

  return pathname.startsWith('/admin') || pathname.startsWith('/super-admin');

}



export async function middleware(request: NextRequest) {

  const { pathname } = request.nextUrl;

  const cookieHeader = request.headers.get('cookie') ?? undefined;

  const role = getAdminRoleFromCookie(cookieHeader);

  let accessToken = getAdminAuthTokenFromCookie(cookieHeader);

  const refreshToken = getAdminRefreshTokenFromCookie(cookieHeader);



  let refreshedTokens: { accessToken: string; refreshToken: string } | null = null;



  if (

    accessToken &&

    refreshToken &&

    isTokenExpiringSoon(accessToken) &&

    isRoleScopedPath(pathname)

  ) {

    refreshedTokens = await refreshSession(refreshToken);

    if (refreshedTokens) {

      accessToken = refreshedTokens.accessToken;

    }

  }



  if (pathname.startsWith('/auth')) {

    if (role && (role === 'ADMIN' || role === 'SUPER_ADMIN')) {

      const response = NextResponse.redirect(

        new URL(getDashboardRouteByRole(role), request.url),

      );

      if (refreshedTokens) {

        applyAuthCookies(response, refreshedTokens.accessToken, refreshedTokens.refreshToken);

      }

      return response;

    }

    return NextResponse.next();

  }



  if (pathname.startsWith('/dashboard')) {

    const suffix = pathname.replace(/^\/dashboard/, '') || '';

    const target = suffix.startsWith('/super-admin')

      ? `/super-admin/dashboard${suffix.replace('/super-admin', '')}`

      : `/admin/dashboard${suffix}`;

    const response = NextResponse.redirect(new URL(target, request.url));

    if (refreshedTokens) {

      applyAuthCookies(response, refreshedTokens.accessToken, refreshedTokens.refreshToken);

    }

    return response;

  }



  if (!isProtectedAdminPath(pathname)) {

    return NextResponse.next();

  }



  if (!isRoleScopedPath(pathname)) {

    return NextResponse.next();

  }



  if (!role) {

    return NextResponse.redirect(new URL(ADMIN_APP_ROUTES.login, request.url));

  }



  const requiredRole = getRequiredRoleForPath(pathname);

  if (requiredRole === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {

    return NextResponse.rewrite(new URL('/unauthorized', request.url));

  }



  if (!isDashboardRouteAllowed(role, pathname)) {

    return NextResponse.rewrite(new URL('/unauthorized', request.url));

  }



  const response = NextResponse.next();

  if (refreshedTokens) {

    applyAuthCookies(response, refreshedTokens.accessToken, refreshedTokens.refreshToken);

  }

  return response;

}



export const config = {

  matcher: [

    '/dashboard/:path*',

    '/admin/:path*',

    '/super-admin/:path*',

    '/auth/:path*',

  ],

};

