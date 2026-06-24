'use client';

import { usePathname } from 'next/navigation';

import { cn } from '@community-marketplace/ui';
import type { RbacRole } from '@community-marketplace/types';

import { getSidebarItemsByRole } from '../lib/routes';
import { useSidebar } from '../lib/sidebar-context';
import { getThemeByRole } from '../theme/theme-tokens';
import { SidebarItem } from './SidebarItem';

export interface SidebarProps {
  role: RbacRole;
  brand?: string;
  mobile?: boolean;
}

export function Sidebar({ role, brand = 'Community Marketplace', mobile = false }: SidebarProps) {
  const pathname = usePathname();
  const items = getSidebarItemsByRole(role);
  const theme = getThemeByRole(role);
  const { collapsed, setMobileOpen } = useSidebar();

  const isCollapsed = mobile ? false : collapsed;

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
          {isCollapsed ? 'CM' : brand}
        </p>
        {!isCollapsed ? (
          <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{theme.label} Dashboard</p>
        ) : null}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
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
