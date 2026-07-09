import { redirect } from 'next/navigation';

import type { RoleCodeValue } from '@community-marketplace/types';
import {
  getDashboardRouteByRole,
  getRequiredRoleForPath,
  isDashboardRouteAllowed,
} from '@community-marketplace/ui-dashboard';

import { WEB_APP_ROUTES } from '@/lib/rbac-routes';
import { getWebRoleFromAuthTokenCookie } from '@/lib/role-cookie';
import { cookies } from 'next/headers';

export async function requireWebDashboardRole(pathname: string): Promise<RoleCodeValue> {
  const cookieStore = await cookies();
  const role = getWebRoleFromAuthTokenCookie(cookieStore.toString());

  if (!role) redirect(WEB_APP_ROUTES.login);

  const required = getRequiredRoleForPath(pathname);
  if (!required || !isDashboardRouteAllowed(role, pathname)) {
    redirect('/unauthorized');
  }

  return role;
}

export async function requireWebRole(expected: 'SELLER' | 'BUYER'): Promise<void> {
  const cookieStore = await cookies();
  const role = getWebRoleFromAuthTokenCookie(cookieStore.toString());
  if (!role) redirect(WEB_APP_ROUTES.login);
  if (role !== expected) redirect(getDashboardRouteByRole(role));
}
