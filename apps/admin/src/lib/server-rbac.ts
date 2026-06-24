import { redirect } from 'next/navigation';

import type { AdminMeResponse, PermissionCode, RbacRole } from '@community-marketplace/types';

import { ADMIN_API_ROUTES } from '@/lib/api-routes';
import { ROUTE_PERMISSIONS } from '@/lib/navigation';
import { hasPermission } from '@/lib/permissions';
import { ADMIN_APP_ROUTES, getAdminDashboardPathForRole } from '@/lib/rbac-routes';
import { getServerAdminContext, serverAdminApiClient } from '@/lib/server-api-client';

export async function requireAdminPermission(section: keyof typeof ROUTE_PERMISSIONS) {
  const { role, token } = await getServerAdminContext();
  if (!role || !token) redirect(ADMIN_APP_ROUTES.login);

  const required = ROUTE_PERMISSIONS[section];
  if (!required) return { role, permissions: [] as PermissionCode[] };

  if (role === 'SUPER_ADMIN') {
    return { role, permissions: [] as PermissionCode[] };
  }

  try {
    const me = await serverAdminApiClient<AdminMeResponse>(ADMIN_API_ROUTES.admin.me);
    if (!hasPermission(me.permissions as PermissionCode[], role, required)) {
      redirect(getAdminDashboardPathForRole(role as RbacRole));
    }
    return { role, permissions: me.permissions as PermissionCode[] };
  } catch {
    redirect(ADMIN_APP_ROUTES.login);
  }
}
