'use client';

import { cn } from '@community-marketplace/ui';

export interface DashboardTabItem {
  id: string;
  label: string;
}

export interface DashboardSectionTabsProps {
  items: DashboardTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** Page-level tabs get spacing below; nested tabs sit flush inside a card/section. */
  variant?: 'page' | 'nested';
  className?: string;
}

export function DashboardSectionTabs({
  items,
  activeId,
  onChange,
  variant = 'page',
  className,
}: DashboardSectionTabsProps) {
  return (
    <div
      className={cn(
        'flex gap-1 overflow-x-auto border-b border-[hsl(var(--dashboard-sidebar-border))]',
        variant === 'page' && 'mb-6',
        className,
      )}
      role="tablist"
    >
      {items.map((item) => {
        const active = activeId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'border-[hsl(var(--dashboard-accent))] text-[hsl(var(--dashboard-accent))]'
                : 'border-transparent text-[hsl(var(--dashboard-sidebar-muted))] hover:border-[hsl(var(--dashboard-sidebar-border))] hover:text-[hsl(var(--dashboard-main-fg))]',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
