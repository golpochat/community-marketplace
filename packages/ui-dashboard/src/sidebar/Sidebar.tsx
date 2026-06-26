'use client';

import { usePathname } from 'next/navigation';

import { cn } from '@community-marketplace/ui';
import type { RbacRole } from '@community-marketplace/types';

import { getSidebarItemsByRole } from '../lib/routes';
import type { SidebarNavItem } from './sidebar-config';
import { isSidebarLinkItem } from './sidebar-config';
import { useSidebar } from '../lib/sidebar-context';
import { getThemeByRole } from '../theme/theme-tokens';
import { SidebarDisabledItem, SidebarNavGroup } from './SidebarNavGroup';
import { SidebarItem } from './SidebarItem';

export interface SidebarProps {
  role: RbacRole;
  brand?: string;
  brandAbbr?: string;
  mobile?: boolean;
  items?: SidebarNavItem[];
}

export function Sidebar({
  role,
  brand = 'SellNearby.ie',
  brandAbbr,
  mobile = false,
  items,
}: SidebarProps) {
  const pathname = usePathname();
  const navItems = items ?? getSidebarItemsByRole(role);
  const theme = getThemeByRole(role);
  const { collapsed, setMobileOpen } = useSidebar();

  const isCollapsed = mobile ? false : collapsed;

  const abbr = brandAbbr ?? brand.replace(/\..*$/, '').slice(0, 2).toUpperCase();

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-bg))] text-[hsl(var(--dashboard-sidebar-fg))] transition-[width] duration-200',
        mobile ? 'h-full w-64' : 'hidden md:flex',
        !mobile && (isCollapsed ? 'w-[4.5rem]' : 'w-64'),
      )}
    >
      <div
        className={cn(
          'border-b border-[hsl(var(--dashboard-sidebar-border))] py-5',
          isCollapsed ? 'px-3 text-center' : 'px-6',
        )}
      >
        <p className={cn('font-semibold tracking-tight', isCollapsed ? 'text-sm' : 'text-lg')}>
          {isCollapsed ? abbr : brand}
        </p>
        {!isCollapsed ? (
          <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{theme.label} Dashboard</p>
        ) : null}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
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
