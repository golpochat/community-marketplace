'use client';

import { cn } from '@community-marketplace/ui';

export function StaffAdminStatusToggle({
  active,
  disabled,
  label,
  onToggle,
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--dashboard-accent))] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        active
          ? 'bg-[hsl(var(--dashboard-accent))]'
          : 'bg-[hsl(var(--dashboard-sidebar-border))]',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
          active ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}

export const staffAdminFieldClassName =
  'w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))] focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))]';
