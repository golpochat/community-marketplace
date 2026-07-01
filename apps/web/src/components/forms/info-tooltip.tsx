'use client';

import type { ReactNode } from 'react';

import { cn } from '@community-marketplace/ui';
import { CircleHelp } from 'lucide-react';

interface InfoTooltipProps {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  /** Wider panel for multi-sentence copy (e.g. account type). */
  wide?: boolean;
}

export function InfoTooltip({ ariaLabel, children, className, wide = false }: InfoTooltipProps) {
  return (
    <span className={cn('group relative inline-flex align-middle', className)}>
      <button
        type="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onClick={(e) => e.preventDefault()}
        onMouseDown={(e) => e.stopPropagation()}
        className="rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CircleHelp className="h-4 w-4" aria-hidden />
      </button>
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-md bg-foreground px-3 py-2 text-left text-xs font-normal leading-snug text-background opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100',
          wide ? 'w-64' : 'w-56',
        )}
      >
        {children}
      </span>
    </span>
  );
}
