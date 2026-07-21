'use client';

import { useState, type ReactNode } from 'react';

import { cn } from '@community-marketplace/ui';

interface DashboardCollapsibleSectionProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function DashboardCollapsibleSection({
  title,
  description,
  defaultOpen = false,
  children,
  className,
}: DashboardCollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        'rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))]',
        className,
      )}
    >
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[hsl(var(--dashboard-main-fg))]">{title}</p>
          {description ? (
            <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{description}</p>
          ) : null}
        </div>
        <span
          className="mt-0.5 shrink-0 text-xs text-[hsl(var(--dashboard-sidebar-muted))]"
          aria-hidden
        >
          {open ? 'Hide' : 'Show'}
        </span>
      </button>
      {open ? <div className="border-t border-[hsl(var(--dashboard-sidebar-border))] p-4 pt-3">{children}</div> : null}
    </section>
  );
}
