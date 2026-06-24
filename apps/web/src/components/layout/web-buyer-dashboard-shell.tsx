'use client';

import type { RbacRole } from '@community-marketplace/types';
import { DashboardLayout } from '@community-marketplace/ui-dashboard';

import { NotificationBell } from '@/components/shared/notification-bell';
import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';

interface WebBuyerDashboardShellProps {
  children: React.ReactNode;
}

export function WebBuyerDashboardShell({ children }: WebBuyerDashboardShellProps) {
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

  const role: RbacRole = 'BUYER';

  return (
    <DashboardLayout
      role={role}
      theme="buyerTheme"
      brand="Community Marketplace"
      user={{
        name: user?.displayName,
        email: user?.email,
        avatarUrl: user?.avatarUrl,
      }}
      profileHref="/buyer/settings"
      settingsHref="/buyer/settings"
      onLogout={handleLogout}
      topbarActions={<NotificationBell href="/buyer/notifications" role="BUYER" />}
    >
      {children}
    </DashboardLayout>
  );
}
