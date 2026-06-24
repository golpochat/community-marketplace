import type { ApiResponse, UserEffectivePermissions } from '@community-marketplace/types';

import { API_BASE_URL } from '@/lib/constants';
import { ADMIN_API_ROUTES } from '@/lib/api-routes';

async function fetchApi<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
}

export const rbacService = {
  listScopes: () => fetchApi(ADMIN_API_ROUTES.admin.rbac.scopes),
  listRoles: () => fetchApi(ADMIN_API_ROUTES.admin.rbac.roles),
  listPermissions: (scope?: string) =>
    fetchApi(
      scope
        ? `${ADMIN_API_ROUTES.admin.rbac.permissions}?scope=${scope}`
        : ADMIN_API_ROUTES.admin.rbac.permissions,
    ),
  getRolePermissions: (roleId: string) =>
    fetchApi(ADMIN_API_ROUTES.admin.rbac.rolePermissions(roleId)),
  assignUserRole: (body: { userId: string; roleId: string; reason?: string }) =>
    fetchApi(ADMIN_API_ROUTES.admin.rbac.assignRole, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  removeUserRole: (userId: string, fallbackRoleId?: string) =>
    fetchApi(ADMIN_API_ROUTES.admin.rbac.removeRole(userId), {
      method: 'DELETE',
      body: JSON.stringify({ fallbackRoleId }),
    }),
  syncRolePermissions: (roleId: string, permissionIds: string[]) =>
    fetchApi(ADMIN_API_ROUTES.admin.rbac.rolePermissions(roleId), {
      method: 'PUT',
      body: JSON.stringify({ permissionIds }),
    }),
  addRolePermission: (roleId: string, permissionId: string) =>
    fetchApi(ADMIN_API_ROUTES.admin.rbac.rolePermissions(roleId), {
      method: 'POST',
      body: JSON.stringify({ permissionId }),
    }),
  removeRolePermission: (roleId: string, permissionId: string) =>
    fetchApi(`${ADMIN_API_ROUTES.admin.rbac.rolePermissions(roleId)}/${permissionId}`, {
      method: 'DELETE',
    }),
  assignPermissionOverride: (body: {
    userId: string;
    permissionId: string;
    effect: 'GRANT' | 'DENY';
    reason?: string;
    expiresAt?: string;
  }) =>
    fetchApi(ADMIN_API_ROUTES.admin.rbac.assignPermissionOverride, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  revokePermissionOverride: (userId: string, permissionId: string) =>
    fetchApi(ADMIN_API_ROUTES.admin.rbac.revokePermissionOverride(userId, permissionId), {
      method: 'DELETE',
    }),
  listUserPermissionOverrides: (userId: string) =>
    fetchApi(ADMIN_API_ROUTES.admin.rbac.userPermissionOverrides(userId)),
  getEffectivePermissions: (userId: string) =>
    fetchApi<UserEffectivePermissions>(ADMIN_API_ROUTES.admin.rbac.effectivePermissions(userId)),
};
