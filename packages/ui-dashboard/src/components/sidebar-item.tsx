'use client';

import Link from 'next/link';

import { cn } from '@community-marketplace/ui';

import type { SidebarNavItem } from '../lib/routes';
import { Icon } from './icon';

export interface SidebarItemProps {
  item: SidebarNavItem;
  isActive: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarItem({ item, isActive, collapsed = false, onNavigate }: SidebarItemProps) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={cn(
        'group relative flex items-center rounded-lg text-sm font-medium transition-colors',
        collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
        isActive
          ? 'border-l-[3px] border-[hsl(var(--dashboard-accent))] bg-[hsl(var(--dashboard-sidebar-active))] text-[hsl(var(--dashboard-sidebar-fg))]'
          : 'border-l-[3px] border-transparent text-[hsl(var(--dashboard-sidebar-muted))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.7)] hover:text-[hsl(var(--dashboard-sidebar-fg))]',
      )}
      aria-current={isActive ? 'page' : undefined}
      aria-label={collapsed ? item.label : undefined}
    >
      <Icon
        name={item.icon}
        className={cn(
          'shrink-0',
          isActive ? 'text-[hsl(var(--dashboard-accent))]' : 'text-[hsl(var(--dashboard-sidebar-muted))]',
        )}
      />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
      {collapsed ? (
        <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md bg-[hsl(var(--dashboard-main-fg))] px-2 py-1 text-xs text-[hsl(var(--dashboard-topbar-bg))] opacity-0 shadow-md transition-opacity group-hover:opacity-100 md:group-hover:block">
          {item.label}
        </span>
      ) : null}
    </Link>
  );
}
