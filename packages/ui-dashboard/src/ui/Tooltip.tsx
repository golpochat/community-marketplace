import type { ReactNode } from 'react';

import { cn } from '@community-marketplace/ui';

export interface TooltipProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ label, children, className }: TooltipProps) {
  return (
    <span className={cn('group relative inline-flex', className)}>
      {children}
      <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md bg-[hsl(var(--dashboard-main-fg))] px-2 py-1 text-xs text-[hsl(var(--dashboard-topbar-bg))] opacity-0 shadow-md transition-opacity group-hover:opacity-100 md:group-hover:block">
        {label}
      </span>
    </span>
  );
}
