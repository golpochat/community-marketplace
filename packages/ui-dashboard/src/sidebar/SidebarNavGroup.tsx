'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

import { cn } from '@community-marketplace/ui';

import type { SidebarLinkItem } from './sidebar-config';
import { Icon } from '../ui/Icon';
import { Tooltip } from '../ui/Tooltip';
import { SidebarItem } from './SidebarItem';

export interface SidebarNavGroupProps {
  item: SidebarLinkItem;
  collapsed?: boolean;
  onNavigate?: () => void;
}

function isChildActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNavGroup({ item, collapsed = false, onNavigate }: SidebarNavGroupProps) {
  const pathname = usePathname();
  const children = item.children ?? [];
  const parentActive = children.some((child) => isChildActive(pathname, child.href));
  const [open, setOpen] = useState(parentActive);

  useEffect(() => {
    if (parentActive) {
      setOpen(true);
    }
  }, [parentActive, pathname]);

  if (collapsed) {
    return (
      <SidebarItem
        item={item}
        isActive={parentActive}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`sidebar-group-${item.id}`}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
          'border-l-[3px]',
          parentActive
            ? 'border-[hsl(var(--dashboard-accent))] bg-[hsl(var(--dashboard-sidebar-active))] text-[hsl(var(--dashboard-sidebar-fg))]'
            : 'border-transparent text-[hsl(var(--dashboard-sidebar-muted))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.7)] hover:text-[hsl(var(--dashboard-sidebar-fg))]',
        )}
      >
        <Icon
          name={item.icon}
          className={cn(
            'shrink-0',
            parentActive
              ? 'text-[hsl(var(--dashboard-accent))]'
              : 'text-[hsl(var(--dashboard-sidebar-muted))]',
          )}
        />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 opacity-60 transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
      {open && children.length > 0 ? (
        <div
          id={`sidebar-group-${item.id}`}
          className="ml-4 space-y-0.5 border-l border-[hsl(var(--dashboard-sidebar-border))] pl-2"
        >
          {children.map((child) => {
            const childActive = isChildActive(pathname, child.href);
            return (
              <Link
                key={child.id}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  childActive
                    ? 'bg-[hsl(var(--dashboard-sidebar-active))] text-[hsl(var(--dashboard-sidebar-fg))]'
                    : 'text-[hsl(var(--dashboard-sidebar-muted))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.7)] hover:text-[hsl(var(--dashboard-sidebar-fg))]',
                )}
                aria-current={childActive ? 'page' : undefined}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function SidebarDisabledItem({
  item,
  collapsed = false,
}: {
  item: SidebarLinkItem;
  collapsed?: boolean;
}) {
  const reason = item.disabledReason ?? 'You do not have permission to access this module.';

  const content = (
    <div
      className={cn(
        'flex cursor-not-allowed items-center rounded-lg text-sm font-medium opacity-50',
        collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
        'border-l-[3px] border-transparent text-[hsl(var(--dashboard-sidebar-muted))]',
      )}
      aria-disabled="true"
      aria-label={collapsed ? item.label : undefined}
    >
      <Icon name={item.icon} className="shrink-0 text-[hsl(var(--dashboard-sidebar-muted))]" />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </div>
  );

  return (
    <Tooltip
      label={reason}
      side={collapsed ? 'right' : 'top'}
      multiline
      className={collapsed ? 'w-full' : undefined}
    >
      {content}
    </Tooltip>
  );
}
