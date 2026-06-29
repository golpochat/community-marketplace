'use client';

import type { RbacRole } from '@community-marketplace/types';
import { DashboardLayout } from '@community-marketplace/ui-dashboard';

import { useAdminAuth } from '@/hooks/use-admin-auth';
import { AdminProviders } from '@/components/providers/admin-providers';
import { adminAuthService } from '@/services/auth.service';
import { getStoredAdminRole } from '@/store/admin-auth.store';

interface RoleDashboardShellProps {
  role: RbacRole;
  children: React.ReactNode;
}

function getSettingsPath(role: RbacRole): string {
  if (role === 'SUPER_ADMIN') return '/super-admin/settings';
  return '/admin/settings';
}

function getProfilePath(role: RbacRole): string {
  if (role === 'SUPER_ADMIN') return '/super-admin/profile';
  return '/admin/profile';
}

export function RoleDashboardShell({ role, children }: RoleDashboardShellProps) {
  const { user, session, clearUser } = useAdminAuth();
  const resolvedRole = (user?.role ?? getStoredAdminRole() ?? role) as RbacRole;

  async function handleLogout() {
    try {
      if (session) {
        await adminAuthService.logout({
          refreshToken: session.refreshToken,
          sessionId: session.sessionId,
        });
      }
    } finally {
      clearUser();
      window.location.href = '/auth/login';
    }
  }

  return (
    <AdminProviders>
      <DashboardLayout
        role={resolvedRole}
        theme={
          resolvedRole === 'SUPER_ADMIN'
            ? 'superAdmin'
            : resolvedRole === 'ADMIN'
              ? 'admin'
              : undefined
        }
        user={{
          name: user?.displayName,
          email: user?.email,
          avatarUrl: user?.avatarUrl,
        }}
        profileHref={getProfilePath(resolvedRole)}
        settingsHref={getSettingsPath(resolvedRole)}
        onLogout={handleLogout}
        brand="CM Admin"
      >
        {children}
      </DashboardLayout>
    </AdminProviders>
  );
}
