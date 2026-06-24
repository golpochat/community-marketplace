import { useAdminAuthStore } from '@/store/admin-auth.store';
import { getAdminDashboardPathForRole } from '@/lib/rbac-routes';

export function useAdminAuth() {
  const user = useAdminAuthStore((state) => state.user);
  const session = useAdminAuthStore((state) => state.session);
  const setAuth = useAdminAuthStore((state) => state.setAuth);
  const clearUser = useAdminAuthStore((state) => state.clearUser);

  const dashboardPath = user ? getAdminDashboardPathForRole(user.role) : null;

  return { user, session, setAuth, clearUser, dashboardPath };
}
