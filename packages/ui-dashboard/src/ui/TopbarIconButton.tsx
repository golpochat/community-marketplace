'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@community-marketplace/ui';

export interface TopbarIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  active?: boolean;
}

export function TopbarIconButton({
  children,
  className,
  active = false,
  type = 'button',
  ...props
}: TopbarIconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[hsl(var(--dashboard-sidebar-muted))] transition-colors',
        'hover:bg-[hsl(var(--dashboard-sidebar-active)/0.45)] hover:text-[hsl(var(--dashboard-topbar-fg))]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--dashboard-accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--dashboard-topbar-bg))]',
        'disabled:pointer-events-none disabled:opacity-50',
        active && 'bg-[hsl(var(--dashboard-sidebar-active)/0.35)] text-[hsl(var(--dashboard-topbar-fg))]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
