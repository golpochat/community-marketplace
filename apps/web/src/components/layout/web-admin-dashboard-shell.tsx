'use client';

import type { RbacRole } from '@community-marketplace/types';
import { DashboardLayout } from '@community-marketplace/ui-dashboard';

import { NotificationBell } from '@/components/shared/notification-bell';
import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';

interface WebAdminDashboardShellProps {
  children: React.ReactNode;
}

export function WebAdminDashboardShell({ children }: WebAdminDashboardShellProps) {
  const { user, session, clearUser } = useAuth();

  async function handleLogout() {
    try {
      if (session) {
        await authService.logout({
          refreshToken: session.refreshToken,
          sessionId: session.sessionId,
        });
      }
    } finally {
      clearUser();
      window.location.href = '/auth/login';
    }
  }

  const role: RbacRole = 'ADMIN';

  return (
    <DashboardLayout
      role={role}
      theme="adminTheme"
      brand="Community Marketplace"
      user={{
        name: user?.displayName,
        email: user?.email,
        avatarUrl: user?.avatarUrl,
      }}
      profileHref="/admin/settings"
      settingsHref="/admin/settings"
      onLogout={handleLogout}
      topbarActions={<NotificationBell href="/admin/notifications" role="ADMIN" />}
    >
      {children}
    </DashboardLayout>
  );
}
