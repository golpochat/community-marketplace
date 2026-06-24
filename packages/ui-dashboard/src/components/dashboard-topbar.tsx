'use client';

import type { ReactNode } from 'react';

import { cn } from '@community-marketplace/ui';
import type { RbacRole } from '@community-marketplace/types';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { usePageTitle } from '../lib/page-title-context';
import { useSidebar } from '../lib/sidebar-context';
import { getThemeByRole } from '../lib/themes';
import type { ProfileDropdownUser } from './profile-dropdown';
import { ProfileDropdown } from './profile-dropdown';

export interface DashboardTopbarProps {
  role: RbacRole;
  user: ProfileDropdownUser;
  profileHref: string;
  settingsHref: string;
  onLogout: () => void | Promise<void>;
  title?: string;
  actions?: ReactNode;
}

export function DashboardTopbar({
  role,
  user,
  profileHref,
  settingsHref,
  onLogout,
  title,
  actions,
}: DashboardTopbarProps) {
  const theme = getThemeByRole(role);
  const { title: pageTitle } = usePageTitle();
  const { collapsed, toggleCollapsed, toggleMobileOpen } = useSidebar();

  const displayTitle = pageTitle ?? title ?? theme.label;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] px-4 text-[hsl(var(--dashboard-topbar-fg))] sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          className="inline-flex rounded-lg p-2 text-[hsl(var(--dashboard-sidebar-muted))] transition-colors hover:bg-[hsl(var(--dashboard-sidebar-active)/0.5)] hover:text-[hsl(var(--dashboard-topbar-fg))] md:hidden"
          onClick={toggleMobileOpen}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="hidden rounded-lg p-2 text-[hsl(var(--dashboard-sidebar-muted))] transition-colors hover:bg-[hsl(var(--dashboard-sidebar-active)/0.5)] hover:text-[hsl(var(--dashboard-topbar-fg))] md:inline-flex"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold sm:text-base">{displayTitle}</h1>
        </div>
      </div>
      <div className={cn('flex shrink-0 items-center gap-1 sm:gap-2')}>
        {actions}
        <ProfileDropdown
          user={user}
          profileHref={profileHref}
          settingsHref={settingsHref}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
