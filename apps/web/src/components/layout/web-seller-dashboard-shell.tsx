'use client';

import type { RbacRole } from '@community-marketplace/types';
import { DashboardLayout } from '@community-marketplace/ui-dashboard';

import { NotificationBell } from '@/components/shared/notification-bell';
import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';

interface WebSellerDashboardShellProps {
  children: React.ReactNode;
}

export function WebSellerDashboardShell({ children }: WebSellerDashboardShellProps) {
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

  const role: RbacRole = 'SELLER';

  return (
    <DashboardLayout
      role={role}
      theme="sellerTheme"
      brand="Community Marketplace"
      user={{
        name: user?.displayName,
        email: user?.email,
        avatarUrl: user?.avatarUrl,
      }}
      profileHref="/seller/settings"
      settingsHref="/seller/settings"
      onLogout={handleLogout}
      topbarActions={<NotificationBell href="/seller/notifications" role="SELLER" />}
    >
      {children}
    </DashboardLayout>
  );
}
