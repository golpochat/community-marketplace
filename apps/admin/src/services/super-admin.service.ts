import type { ApiResponse } from '@community-marketplace/types';

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

export const superAdminService = {
  getPlatformOverview: () => fetchApi(ADMIN_API_ROUTES.superAdmin.platform),
  listRoles: () => fetchApi(ADMIN_API_ROUTES.superAdmin.roles),
  listPermissions: () => fetchApi(ADMIN_API_ROUTES.superAdmin.permissions),
  getRoleMatrix: () => fetchApi(ADMIN_API_ROUTES.superAdmin.roleMatrix),
  listAdmins: () => fetchApi(ADMIN_API_ROUTES.superAdmin.admins),
  getAuditLog: () => fetchApi(ADMIN_API_ROUTES.superAdmin.audit),
};
