import { useAuthStore } from '@/store/auth.store';
import { getWebDashboardPathForRole } from '@/lib/rbac-routes';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearUser = useAuthStore((state) => state.clearUser);

  const dashboardPath = user ? getWebDashboardPathForRole(user.role) : null;

  return { user, session, isAuthenticated, setAuth, clearUser, dashboardPath };
}
