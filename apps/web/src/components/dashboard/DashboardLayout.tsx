'use client';

import { APP_SHORT_NAME } from '@community-marketplace/config';
import type { RbacRole } from '@community-marketplace/types';
import {
  DashboardLayout as UIDashboardLayout,
  getDashboardRouteByRole,
  type DashboardThemeProp,
} from '@community-marketplace/ui-dashboard';

import { Logo } from '@/components/brand/logo';
import { NotificationBell } from '@/components/shared/notification-bell';
import { useAuth } from '@/hooks/use-auth';
import { useUserProfile } from '@/hooks/use-user-profile';
import { filterSidebarItems } from '@/lib/admin-sidebar';
import { authService } from '@/services/auth.service';

const PROFILE_HREF: Record<RbacRole, string> = {
  SUPER_ADMIN: '/super-admin/profile',
  ADMIN: '/admin/profile',
  SELLER: '/seller/profile',
  BUYER: '/buyer/profile',
};

const SETTINGS_HREF: Record<RbacRole, string | undefined> = {
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
  const { profile, permissions } = useUserProfile();

  const sidebarItems =
    role === 'ADMIN' || role === 'SUPER_ADMIN'
      ? filterSidebarItems(role, permissions?.effective ?? [])
      : undefined;

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
      brandLogo={
        <Logo variant="light" size="footer" href={getDashboardRouteByRole(role)} />
      }
      brandLogoCollapsed={
        <Logo variant="icon" size="icon" href={getDashboardRouteByRole(role)} />
      }
      user={{
        name: profile?.displayName ?? user?.displayName,
        email: user?.email,
        avatarUrl: profile?.avatarUrl ?? user?.avatarUrl,
      }}
      profileHref={PROFILE_HREF[role]}
      settingsHref={SETTINGS_HREF[role]}
      onLogout={handleLogout}
      topbarActions={
        <NotificationBell href={NOTIFICATIONS_HREF[role]} role={role} />
      }
      sidebarItems={sidebarItems}
    >
      {children}
    </UIDashboardLayout>
  );
}
