'use client';

import type { ReactNode } from 'react';

import { cn } from '@community-marketplace/ui';
import type { RbacRole } from '@community-marketplace/types';

import { FooterBar } from '../footer/FooterBar';
import { MobileSidebarEffects } from '../lib/mobile-sidebar-effects';
import { PageTitleProvider } from '../lib/page-title-context';
import { SidebarProvider, useSidebar } from '../lib/sidebar-context';
import type { DashboardThemeProp } from '../theme/theme-tokens';
import { ThemeProvider } from '../theme/ThemeProvider';
import { Sidebar } from '../sidebar/Sidebar';
import { Topbar } from '../topbar/Topbar';
import type { ProfileDropdownUser } from '../ui/ProfileDropdown';

export interface DashboardLayoutProps {
  role: RbacRole;
  theme?: DashboardThemeProp;
  children: React.ReactNode;
  user: ProfileDropdownUser;
  profileHref: string;
  settingsHref?: string;
  onLogout: () => void | Promise<void>;
  brand?: string;
  brandAbbr?: string;
  brandLogo?: ReactNode;
  brandLogoCollapsed?: ReactNode;
  topbarTitle?: string;
  topbarActions?: ReactNode;
  footerCopyright?: string;
  sidebarItems?: import('../sidebar/sidebar-config').SidebarNavItem[];
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
  brandAbbr,
  brandLogo,
  brandLogoCollapsed,
  topbarTitle,
  topbarActions,
  footerCopyright,
  sidebarItems,
}: DashboardLayoutProps) {
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <ThemeProvider role={role} theme={theme}>
      <MobileSidebarEffects />
      <div className="flex h-[100dvh] overflow-hidden bg-[hsl(var(--dashboard-main-bg))] text-[hsl(var(--dashboard-main-fg))]">
        <Sidebar
          role={role}
          brand={brand}
          brandAbbr={brandAbbr}
          brandLogo={brandLogo}
          brandLogoCollapsed={brandLogoCollapsed}
          items={sidebarItems}
        />

        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] transition-opacity duration-200 md:hidden"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <div
          id="dashboard-mobile-sidebar"
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-[min(100vw-3rem,16rem)] transform shadow-xl transition-transform duration-200 ease-in-out md:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none',
          )}
          aria-hidden={!mobileOpen}
        >
          <Sidebar
            role={role}
            brand={brand}
            brandAbbr={brandAbbr}
            brandLogo={brandLogo}
            brandLogoCollapsed={brandLogoCollapsed}
            mobile
            items={sidebarItems}
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar
            role={role}
            user={user}
            profileHref={profileHref}
            settingsHref={settingsHref}
            onLogout={onLogout}
            title={topbarTitle}
            actions={topbarActions}
          />
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-6 sm:py-6">
            {children}
          </main>
          <FooterBar copyright={footerCopyright} brand={brand} />
        </div>
      </div>
    </ThemeProvider>
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

export default DashboardLayout;
