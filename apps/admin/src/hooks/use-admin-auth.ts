import { useAdminAuthStore } from '@/store/admin-auth.store';
import { getAdminDashboardPathForRole } from '@/lib/rbac-routes';

export function useAdminAuth() {
  const user = useAdminAuthStore((state) => state.user);
  const session = useAdminAuthStore((state) => state.session);
  const permissions = useAdminAuthStore((state) => state.permissions);
  const setAuth = useAdminAuthStore((state) => state.setAuth);
  const setPermissions = useAdminAuthStore((state) => state.setPermissions);
  const clearUser = useAdminAuthStore((state) => state.clearUser);

  const dashboardPath = user ? getAdminDashboardPathForRole(user.role) : null;

  return { user, session, permissions, setAuth, setPermissions, clearUser, dashboardPath };
}
