'use client';

import type { RbacRole } from '@community-marketplace/types';
import { DashboardLayout } from '@community-marketplace/ui-dashboard';

import { NotificationBell } from '@/components/shared/notification-bell';
import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';

interface WebSuperAdminDashboardShellProps {
  children: React.ReactNode;
}

function getSuperAdminNotificationsHref(): string {
  return '/super-admin/notifications';
}

export function WebSuperAdminDashboardShell({ children }: WebSuperAdminDashboardShellProps) {
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

  const role: RbacRole = 'SUPER_ADMIN';

  return (
    <DashboardLayout
      role={role}
      theme="superAdminTheme"
      brand="Community Marketplace"
      user={{
        name: user?.displayName,
        email: user?.email,
        avatarUrl: user?.avatarUrl,
      }}
      profileHref="/super-admin/settings"
      settingsHref="/super-admin/settings"
      onLogout={handleLogout}
      topbarActions={
        <NotificationBell href={getSuperAdminNotificationsHref()} role="SUPER_ADMIN" />
      }
    >
      {children}
    </DashboardLayout>
  );
}
