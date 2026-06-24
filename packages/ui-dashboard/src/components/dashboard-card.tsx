import type { ReactNode } from 'react';

import { cn } from '@community-marketplace/ui';

export interface DashboardCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function DashboardCard({ children, className, title, description }: DashboardCardProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg))] p-6 shadow-sm',
        className,
      )}
    >
      {title ? (
        <header className="mb-4">
          <h2 className="text-base font-semibold text-[hsl(var(--dashboard-main-fg))]">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">{description}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
