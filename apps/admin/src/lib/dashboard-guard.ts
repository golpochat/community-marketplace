import { redirect } from 'next/navigation';

import type { RbacRole } from '@community-marketplace/types';
import {
  getDashboardRouteByRole,
  getRequiredRoleForPath,
  isDashboardRouteAllowed,
} from '@community-marketplace/ui-dashboard';

import { ADMIN_APP_ROUTES } from '@/lib/rbac-routes';
import { getServerAdminContext } from '@/lib/server-api-client';

export async function requireDashboardRole(pathname: string): Promise<RbacRole> {
  const { role } = await getServerAdminContext();
  if (!role) redirect(ADMIN_APP_ROUTES.login);

  const required = getRequiredRoleForPath(pathname);
  if (!required || !isDashboardRouteAllowed(role, pathname)) {
    redirect('/unauthorized');
  }

  return role;
}

export async function requireRoleDashboard(role: RbacRole): Promise<void> {
  const { role: current } = await getServerAdminContext();
  if (!current) redirect(ADMIN_APP_ROUTES.login);
  if (current !== role && !(role === 'ADMIN' && current === 'SUPER_ADMIN')) {
    redirect(getDashboardRouteByRole(current));
  }
}
