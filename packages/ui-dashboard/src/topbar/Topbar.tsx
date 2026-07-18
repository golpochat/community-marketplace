'use client';

import type { ReactNode } from 'react';

import { cn } from '@community-marketplace/ui';
import type { RbacRole } from '@community-marketplace/types';
import { Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';

import { usePageTitle } from '../lib/page-title-context';
import { useSidebar } from '../lib/sidebar-context';
import { getThemeByRole } from '../theme/theme-tokens';
import type { ProfileDropdownUser } from '../ui/ProfileDropdown';
import { ProfileDropdown } from '../ui/ProfileDropdown';
import { TopbarIconButton } from '../ui/TopbarIconButton';

export interface TopbarProps {
  role: RbacRole;
  user: ProfileDropdownUser;
  profileHref: string;
  settingsHref?: string;
  onLogout: () => void | Promise<void>;
  title?: string;
  actions?: ReactNode;
  verified?: boolean;
  verifyHref?: string;
}

export function Topbar({
  role,
  user,
  profileHref,
  settingsHref,
  onLogout,
  title,
  actions,
  verified,
  verifyHref,
}: TopbarProps) {
  const theme = getThemeByRole(role);
  const { title: pageTitle } = usePageTitle();
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebar();

  const displayTitle = pageTitle ?? title ?? theme.label;

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))]/95 px-3 text-[hsl(var(--dashboard-topbar-fg))] backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--dashboard-topbar-bg))]/90 sm:px-4">
      <div className="flex min-w-0 items-center gap-1 sm:gap-2">
        <TopbarIconButton
          className="md:hidden"
          active={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          aria-controls="dashboard-mobile-sidebar"
        >
          {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </TopbarIconButton>
        <TopbarIconButton
          className="hidden md:inline-flex"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" aria-hidden />
          ) : (
            <PanelLeftClose className="h-5 w-5" aria-hidden />
          )}
        </TopbarIconButton>
        <div className="min-w-0 pl-0.5">
          <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">{displayTitle}</h1>
        </div>
      </div>

      <div className={cn('flex shrink-0 items-center gap-1 sm:gap-2')}>
        {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
        {actions ? (
          <span
            className="mx-0.5 hidden h-6 w-px bg-[hsl(var(--dashboard-sidebar-border))] sm:block"
            aria-hidden
          />
        ) : null}
        <ProfileDropdown
          user={user}
          profileHref={profileHref}
          settingsHref={settingsHref}
          onLogout={onLogout}
          verified={verified}
          verifyHref={verifyHref}
        />
      </div>
    </header>
  );
}

/** @deprecated Use Topbar */
export const DashboardTopbar = Topbar;
export type DashboardTopbarProps = TopbarProps;
