import { API_NAMESPACES } from './rbac-routes';

export type AdminApiRole = 'SUPER_ADMIN' | 'ADMIN';

/**
 * Endpoints implemented only under `/admin/*` but callable by SUPER_ADMIN
 * (backend controllers use `@RequireRole('ADMIN', 'SUPER_ADMIN')`).
 */
const SUPER_ADMIN_ADMIN_NAMESPACE_PATHS = new Set([
  '/payments',
  '/monetization',
  '/finance',
  '/users/verifications/pending',
  '/users/suspend',
  '/users/ban',
  '/seller-verification/requests',
  '/seller-verification/pending',
  '/seller-verification/approve',
  '/seller-verification/reject',
  '/seller/suspend',
  '/seller/limit',
  '/seller/status-history',
  '/seller/reactivate',
  '/seller/reverify',
  '/disputes',
  '/fraud',
]);

/** Review endpoints live under super-admin but allow ADMIN role on the API. */
function usesSuperAdminReviewNamespace(path: string): boolean {
  return path.startsWith('/delivery-reviews') || path.startsWith('/price-reviews');
}

function superAdminUsesAdminNamespace(path: string): boolean {
  return (
    SUPER_ADMIN_ADMIN_NAMESPACE_PATHS.has(path) ||
    path.startsWith('/payments') ||
    path.startsWith('/users/verifications/') ||
    path.startsWith('/seller-verification') ||
    path.startsWith('/seller/') ||
    path.startsWith('/listings') ||
    path.startsWith('/chat') ||
    path.startsWith('/moderation') ||
    path.startsWith('/monetization') ||
    path.startsWith('/finance') ||
    path.startsWith('/email') ||
    path.startsWith('/disputes') ||
    path.startsWith('/fraud')
  );
}

export function adminApiPath(role: AdminApiRole, path: string): string {
  if (usesSuperAdminReviewNamespace(path)) {
    return `${API_NAMESPACES.SUPER_ADMIN}${path}`;
  }

  if (role === 'SUPER_ADMIN' && (superAdminUsesAdminNamespace(path) || path.startsWith('/rbac'))) {
    return `${API_NAMESPACES.ADMIN}${path}`;
  }

  const namespace = role === 'SUPER_ADMIN' ? API_NAMESPACES.SUPER_ADMIN : API_NAMESPACES.ADMIN;
  return `${namespace}${path}`;
}

/** @deprecated Use adminApiPath(role, path) */
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

export function adminRoutesForRole(role: AdminApiRole) {
  return role === 'SUPER_ADMIN' ? ADMIN_API_ROUTES.superAdmin : ADMIN_API_ROUTES.admin;
}
