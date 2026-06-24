import { redirect } from 'next/navigation';

import type { PermissionCode, RbacRole } from '@community-marketplace/types';

import { ROUTE_PERMISSIONS } from '@/lib/navigation';
import { hasPermission } from '@/lib/permissions';
import { ADMIN_APP_ROUTES, getAdminDashboardPathForRole } from '@/lib/rbac-routes';
import { getServerAdminContext } from '@/lib/server-api-client';
import { adminAuthService } from '@/services/auth.service';

export async function requireAdminPermission(section: keyof typeof ROUTE_PERMISSIONS) {
  const { role, token } = await getServerAdminContext();
  if (!role || !token) redirect(ADMIN_APP_ROUTES.login);

  const required = ROUTE_PERMISSIONS[section];
  if (!required) return { role, permissions: [] as PermissionCode[] };

  if (role === 'SUPER_ADMIN') {
    return { role, permissions: [] as PermissionCode[] };
  }

  try {
    const me = await adminAuthService.fetchMe(token, role as 'ADMIN' | 'SUPER_ADMIN');
    if (!hasPermission(me.permissions as PermissionCode[], role, required)) {
      redirect(getAdminDashboardPathForRole(role as RbacRole));
    }
    return { role, permissions: me.permissions as PermissionCode[] };
  } catch {
    redirect(ADMIN_APP_ROUTES.login);
  }
}
