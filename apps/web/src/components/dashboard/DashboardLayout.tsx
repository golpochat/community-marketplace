'use client';

import { APP_BRAND_ABBR, APP_SHORT_NAME } from '@community-marketplace/config';
import type { RbacRole } from '@community-marketplace/types';
import {
  DashboardLayout as UIDashboardLayout,
  type DashboardThemeProp,
} from '@community-marketplace/ui-dashboard';

import { NotificationBell } from '@/components/shared/notification-bell';
import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';

const SETTINGS_HREF: Record<RbacRole, string> = {
  SUPER_ADMIN: '/super-admin/settings',
  ADMIN: '/admin/settings',
  SELLER: '/seller/settings',
  BUYER: '/buyer/settings',
};

const NOTIFICATIONS_HREF: Record<RbacRole, string> = {
  SUPER_ADMIN: '/super-admin/notifications',
  ADMIN: '/admin/notifications',
  SELLER: '/seller/notifications',
  BUYER: '/buyer/notifications',
};

export interface WebDashboardLayoutProps {
  role: RbacRole;
  theme: DashboardThemeProp;
  children: React.ReactNode;
}

export default function DashboardLayout({ role, theme, children }: WebDashboardLayoutProps) {
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

  return (
    <UIDashboardLayout
      role={role}
      theme={theme}
      brand={APP_SHORT_NAME}
      brandAbbr={APP_BRAND_ABBR}
      user={{
        name: user?.displayName,
        email: user?.email,
        avatarUrl: user?.avatarUrl,
      }}
      profileHref={SETTINGS_HREF[role]}
      settingsHref={SETTINGS_HREF[role]}
      onLogout={handleLogout}
      topbarActions={
        <NotificationBell href={NOTIFICATIONS_HREF[role]} role={role} />
      }
    >
      {children}
    </UIDashboardLayout>
  );
}
