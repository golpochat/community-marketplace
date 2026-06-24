import { API_NAMESPACES } from './rbac-routes';

export const ADMIN_API_ROUTES = {
  superAdmin: {
    stats: `${API_NAMESPACES.SUPER_ADMIN}/stats`,
    platform: `${API_NAMESPACES.SUPER_ADMIN}/platform`,
    settings: `${API_NAMESPACES.SUPER_ADMIN}/settings`,
    users: `${API_NAMESPACES.SUPER_ADMIN}/users`,
    listings: `${API_NAMESPACES.SUPER_ADMIN}/listings`,
    admins: `${API_NAMESPACES.SUPER_ADMIN}/admins`,
    audit: `${API_NAMESPACES.SUPER_ADMIN}/audit`,
    roleMatrix: `${API_NAMESPACES.SUPER_ADMIN}/roles/matrix`,
  },
  admin: {
    stats: `${API_NAMESPACES.ADMIN}/stats`,
    users: `${API_NAMESPACES.ADMIN}/users`,
    listings: `${API_NAMESPACES.ADMIN}/listings`,
    audit: `${API_NAMESPACES.ADMIN}/audit`,
    payments: `${API_NAMESPACES.ADMIN}/payments`,
    verificationsPending: `${API_NAMESPACES.ADMIN}/users/verifications/pending`,
  },
} as const;

export function adminRoutesForRole(role: 'SUPER_ADMIN' | 'ADMIN') {
  return role === 'SUPER_ADMIN' ? ADMIN_API_ROUTES.superAdmin : ADMIN_API_ROUTES.admin;
}
