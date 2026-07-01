'use client';

import { cn } from '@community-marketplace/ui';

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, activeId, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto border-b border-border', className)} role="tablist">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={activeId === item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            'shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
            activeId === item.id
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
