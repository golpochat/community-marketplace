'use client';

import type { ReactNode } from 'react';

import { cn } from '@community-marketplace/ui';
import type { RbacRole } from '@community-marketplace/types';

import { PageTitleProvider } from '../lib/page-title-context';
import { SidebarProvider, useSidebar } from '../lib/sidebar-context';
import type { DashboardThemeProp } from '../lib/theme';
import { DashboardSidebar } from './dashboard-sidebar';
import { DashboardTopbar } from './dashboard-topbar';
import { FooterBar } from './footer-bar';
import type { ProfileDropdownUser } from './profile-dropdown';
import { DashboardThemeProvider } from './theme-provider';

export interface DashboardLayoutProps {
  role: RbacRole;
  theme?: DashboardThemeProp;
  children: React.ReactNode;
  user: ProfileDropdownUser;
  profileHref: string;
  settingsHref: string;
  onLogout: () => void | Promise<void>;
  brand?: string;
  topbarTitle?: string;
  topbarActions?: ReactNode;
  footerCopyright?: string;
}

function DashboardLayoutFrame({
  role,
  theme,
  children,
  user,
  profileHref,
  settingsHref,
  onLogout,
  brand,
  topbarTitle,
  topbarActions,
  footerCopyright,
}: DashboardLayoutProps) {
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <DashboardThemeProvider role={role} theme={theme}>
      <div className="flex min-h-screen bg-[hsl(var(--dashboard-main-bg))] text-[hsl(var(--dashboard-main-fg))]">
        <DashboardSidebar role={role} brand={brand} />
        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 md:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <DashboardSidebar role={role} brand={brand} mobile />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardTopbar
            role={role}
            user={user}
            profileHref={profileHref}
            settingsHref={settingsHref}
            onLogout={onLogout}
            title={topbarTitle}
            actions={topbarActions}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
          <FooterBar copyright={footerCopyright} />
        </div>
      </div>
    </DashboardThemeProvider>
  );
}

export function DashboardLayout(props: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <PageTitleProvider>
        <DashboardLayoutFrame {...props} />
      </PageTitleProvider>
    </SidebarProvider>
  );
}
