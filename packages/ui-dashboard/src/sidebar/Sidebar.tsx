'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { cn } from '@community-marketplace/ui';
import type { RbacRole } from '@community-marketplace/types';
import { X } from 'lucide-react';

import { getSidebarItemsByRole } from '../lib/routes';
import type { SidebarNavItem } from './sidebar-config';
import { isSidebarLinkItem } from './sidebar-config';
import { useSidebar } from '../lib/sidebar-context';
import { getThemeByRole } from '../theme/theme-tokens';
import { TopbarIconButton } from '../ui/TopbarIconButton';
import { SidebarDisabledItem, SidebarNavGroup } from './SidebarNavGroup';
import { SidebarItem } from './SidebarItem';

export interface SidebarProps {
  role: RbacRole;
  brand?: string;
  brandAbbr?: string;
  /** Expanded sidebar brand lockup (e.g. horizontal logo). */
  brandLogo?: ReactNode;
  /** Collapsed sidebar mark (e.g. icon-only logo). Falls back to brandLogo. */
  brandLogoCollapsed?: ReactNode;
  mobile?: boolean;
  items?: SidebarNavItem[];
}

export function Sidebar({
  role,
  brand = 'SellNearby.ie',
  brandAbbr,
  brandLogo,
  brandLogoCollapsed,
  mobile = false,
  items,
}: SidebarProps) {
  const pathname = usePathname();
  const navItems = items ?? getSidebarItemsByRole(role);
  const theme = getThemeByRole(role);
  const { collapsed, setMobileOpen } = useSidebar();

  const isCollapsed = mobile ? false : collapsed;

  const abbr = brandAbbr ?? brand.replace(/\..*$/, '').slice(0, 2).toUpperCase();
  const collapsedLogo = brandLogoCollapsed ?? brandLogo;

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-bg))] text-[hsl(var(--dashboard-sidebar-fg))] transition-[width] duration-200 ease-in-out',
        mobile ? 'h-full w-full' : 'hidden h-screen max-h-screen min-h-0 md:flex',
        !mobile && (isCollapsed ? 'w-[4.5rem]' : 'w-64'),
      )}
    >
      <div
        className={cn(
          'flex shrink-0 flex-col border-b border-[hsl(var(--dashboard-sidebar-border))]',
          mobile && 'px-3 py-3',
          !mobile && (isCollapsed ? 'items-center px-2 py-4' : 'px-4 py-5'),
        )}
      >
        {mobile ? (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {brandLogo ?? (
                <p className="text-lg font-semibold tracking-tight">{brand}</p>
              )}
              <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                {theme.label} Dashboard
              </p>
            </div>
            <TopbarIconButton
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" aria-hidden />
            </TopbarIconButton>
          </div>
        ) : isCollapsed ? (
          collapsedLogo ? (
            <div className="flex justify-center">{collapsedLogo}</div>
          ) : (
            <p className="text-sm font-semibold tracking-tight">{abbr}</p>
          )
        ) : brandLogo ? (
          <>
            {brandLogo}
            <p className="mt-2 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              {theme.label} Dashboard
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold tracking-tight">{brand}</p>
            <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              {theme.label} Dashboard
            </p>
          </>
        )}
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-y-contain p-3">
        {navItems.map((item) => {
          if (item.sectionHeader) {
            if (isCollapsed) return null;
            return (
              <p
                key={item.id}
                className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))] first:pt-2"
              >
                {item.label}
              </p>
            );
          }

          if (!isSidebarLinkItem(item)) {
            return null;
          }

          if (item.disabled) {
            return <SidebarDisabledItem key={item.id} item={item} collapsed={isCollapsed} />;
          }

          if (item.children && item.children.length > 0) {
            return (
              <SidebarNavGroup
                key={item.id}
                item={item}
                collapsed={isCollapsed}
                onNavigate={mobile ? () => setMobileOpen(false) : undefined}
              />
            );
          }

          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={isActive}
              collapsed={isCollapsed}
              onNavigate={mobile ? () => setMobileOpen(false) : undefined}
            />
          );
        })}
      </nav>
    </aside>
  );
}

/** @deprecated Use Sidebar */
export const DashboardSidebar = Sidebar;
export type DashboardSidebarProps = SidebarProps;
